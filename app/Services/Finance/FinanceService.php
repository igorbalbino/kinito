<?php

namespace App\Services\Finance;

use App\Enums\FinancialStatus;
use App\Enums\PaymentProvider;
use App\Enums\TransactionType;
use App\Models\FinancialTransaction;
use App\Models\Payment;
use App\Models\Ride;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Stripe\StripeClient;
use Throwable;

class FinanceService
{
    public function paymentDriver(): string
    {
        return filled(config('kinito.stripe.secret')) ? 'stripe' : 'mock';
    }

    /**
     * Stripe ride-split is active only when provider is stripe AND secret is configured.
     */
    public function isStripeActive(): bool
    {
        return config('kinito.payment_provider') === PaymentProvider::Stripe->value
            && filled(config('kinito.stripe.secret'));
    }

    /**
     * @return array{gross: float, stripe_fee: float, platform_commission: float, company_cut: float, driver_net: float}
     */
    public function calculateSplit(float $gross, ?float $companyCommissionRate = null, ?string $paymentMethod = null): array
    {
        $companyPercent = $companyCommissionRate ?? (float) config('kinito.commissions.company_percent', 10);
        $stripeActive = $this->isStripeActive();

        $stripeFee = 0.0;
        $platformCommission = 0.0;

        if ($stripeActive) {
            $stripeFee = $this->stripeFeeForMethod($gross, $paymentMethod);
            $platformPercent = (float) config('kinito.commissions.platform_percent', 15);
            $afterStripe = max($gross - $stripeFee, 0);
            $platformCommission = round($afterStripe * ($platformPercent / 100), 2);
            $base = $afterStripe;
        } else {
            $base = $gross;
        }

        $companyCut = round($base * ($companyPercent / 100), 2);
        $driverNet = round($base - $platformCommission - $companyCut, 2);

        return [
            'gross' => round($gross, 2),
            'stripe_fee' => $stripeFee,
            'platform_commission' => $platformCommission,
            'company_cut' => $companyCut,
            'driver_net' => $driverNet,
        ];
    }

    private function stripeFeeForMethod(float $gross, ?string $paymentMethod): float
    {
        $method = strtolower((string) $paymentMethod);

        // Offline settlement — no Stripe processing fee.
        if (in_array($method, ['dinheiro', 'faturado', 'cash'], true)) {
            return 0.0;
        }

        $fees = config('kinito.stripe.fees_by_method', []);
        $row = $fees[$method] ?? $fees['default'] ?? [
            'percent' => (float) config('kinito.stripe.fee_percent', 3.9),
            'fixed' => (float) config('kinito.stripe.fee_fixed', 0.50),
        ];

        $percent = (float) ($row['percent'] ?? 0);
        $fixed = (float) ($row['fixed'] ?? 0);

        return round(($gross * ($percent / 100)) + $fixed, 2);
    }

    public function applyToRide(Ride $ride, ?float $gross = null, bool $manual = false): Ride
    {
        $gross ??= (float) ($ride->gross_value ?? 0);
        $companyRate = (float) ($ride->company?->commission_rate ?? config('kinito.commissions.company_percent', 10));
        $paymentMethod = $ride->payment_method;
        $methodValue = $paymentMethod instanceof \BackedEnum
            ? $paymentMethod->value
            : (is_string($paymentMethod) ? $paymentMethod : null);
        $split = $this->calculateSplit($gross, $companyRate, $methodValue);

        $provider = config('kinito.payment_provider', 'manual');
        $financialStatus = $manual || $provider === PaymentProvider::Manual->value
            ? ($gross > 0 ? FinancialStatus::Pendente : FinancialStatus::Incompleto)
            : FinancialStatus::Pendente;

        $ride->fill([
            'gross_value' => $split['gross'],
            'stripe_fee' => $split['stripe_fee'],
            'platform_commission' => $split['platform_commission'],
            'company_cut' => $split['company_cut'],
            'driver_net' => $split['driver_net'],
            'payment_provider' => $provider,
            'financial_status' => $financialStatus,
        ])->save();

        return $ride->refresh();
    }

    public function createRideTransaction(Ride $ride, string $status = 'PENDENTE'): FinancialTransaction
    {
        return FinancialTransaction::query()->create([
            'code' => 'TX-'.strtoupper(Str::random(8)),
            'ride_id' => $ride->id,
            'company_id' => $ride->company_id,
            'type' => TransactionType::Corrida,
            'amount' => $ride->gross_value ?? 0,
            'gross_value' => $ride->gross_value,
            'platform_fee' => $ride->platform_commission,
            'company_fee' => $ride->company_cut,
            'driver_fee' => $ride->driver_net,
            'stripe_fee' => $ride->stripe_fee,
            'status' => $status,
            'payment_mode' => $ride->payment_provider?->value ?? config('kinito.payment_provider'),
            'sender' => $ride->client?->user?->name ?? 'Cliente',
            'recipient' => $ride->company?->name ?? 'Empresa',
            'description' => 'Corrida '.$ride->code,
        ]);
    }

    public function createPaymentIntent(Ride $ride): Payment
    {
        if ($this->paymentDriver() === 'stripe') {
            return $this->createStripePaymentIntent($ride);
        }

        return $this->createMockPaymentIntent($ride);
    }

    /** @deprecated Use createPaymentIntent() */
    public function createPaymentIntentStub(Ride $ride): Payment
    {
        return $this->createPaymentIntent($ride);
    }

    private function createMockPaymentIntent(Ride $ride): Payment
    {
        $intentId = 'pi_stub_'.Str::lower(Str::random(24));

        return Payment::query()->create([
            'ride_id' => $ride->id,
            'company_id' => $ride->company_id,
            'provider' => PaymentProvider::Stripe,
            'stripe_payment_intent_id' => $intentId,
            'stripe_customer_id' => $ride->company?->stripe_customer_id,
            'amount' => $ride->gross_value ?? 0,
            'currency' => 'brl',
            'status' => 'PENDENTE',
            'meta' => [
                'client_secret' => $intentId.'_secret_stub',
                'driver' => 'mock',
                'note' => 'Mock PaymentIntent (STRIPE_SECRET ausente).',
            ],
        ]);
    }

    private function createStripePaymentIntent(Ride $ride): Payment
    {
        $amountCents = (int) round(((float) ($ride->gross_value ?? 0)) * 100);
        if ($amountCents < 1) {
            throw new InvalidArgumentException('Valor da corrida inválido para PaymentIntent.');
        }

        try {
            $stripe = new StripeClient((string) config('kinito.stripe.secret'));
            $intent = $stripe->paymentIntents->create([
                'amount' => $amountCents,
                'currency' => 'brl',
                'automatic_payment_methods' => ['enabled' => true],
                'metadata' => [
                    'ride_id' => (string) $ride->id,
                    'company_id' => (string) $ride->company_id,
                    'ride_code' => (string) $ride->code,
                ],
            ]);
        } catch (Throwable $e) {
            Log::error('Stripe PaymentIntent failed.', [
                'ride_id' => $ride->id,
                'error' => $e->getMessage(),
            ]);

            throw new InvalidArgumentException('Falha ao criar PaymentIntent no Stripe: '.$e->getMessage());
        }

        return Payment::query()->create([
            'ride_id' => $ride->id,
            'company_id' => $ride->company_id,
            'provider' => PaymentProvider::Stripe,
            'stripe_payment_intent_id' => $intent->id,
            'stripe_customer_id' => $ride->company?->stripe_customer_id,
            'amount' => $ride->gross_value ?? 0,
            'currency' => 'brl',
            'status' => 'PENDENTE',
            'meta' => [
                'client_secret' => $intent->client_secret,
                'driver' => 'stripe',
            ],
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function handleStripeWebhook(array $payload): void
    {
        $type = $payload['type'] ?? null;
        $intentId = data_get($payload, 'data.object.id');

        if (! $intentId || ! $type) {
            return;
        }

        $payment = Payment::query()->where('stripe_payment_intent_id', $intentId)->first();
        if (! $payment) {
            return;
        }

        if ($type === 'payment_intent.succeeded') {
            $payment->update(['status' => 'PAGO']);
            if ($payment->ride) {
                $payment->ride->update([
                    'financial_status' => FinancialStatus::Pago,
                    'stripe_webhook_received' => true,
                ]);
            }
        }

        if ($type === 'payment_intent.payment_failed') {
            $payment->update(['status' => 'FALHOU']);
        }

        if ($type === 'charge.refunded') {
            $payment->update(['status' => 'ESTORNADO']);
            if ($payment->ride) {
                $payment->ride->update(['financial_status' => FinancialStatus::Estornado]);
            }
        }
    }

    /**
     * Validate mock webhook: intent must exist and be a stub id.
     *
     * @param  array<string, mixed>  $payload
     */
    public function assertValidMockRideWebhook(array $payload): void
    {
        $intentId = data_get($payload, 'data.object.id');
        if (! is_string($intentId) || ! str_starts_with($intentId, 'pi_stub_')) {
            throw new InvalidArgumentException('Mock webhook exige payment_intent stub existente (pi_stub_*).');
        }

        $exists = Payment::query()->where('stripe_payment_intent_id', $intentId)->exists();
        if (! $exists) {
            throw new InvalidArgumentException('PaymentIntent mock não encontrado.');
        }
    }
}
