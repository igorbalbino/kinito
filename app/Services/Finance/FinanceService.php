<?php

namespace App\Services\Finance;

use App\Enums\FinancialStatus;
use App\Enums\PaymentProvider;
use App\Enums\TransactionType;
use App\Models\FinancialTransaction;
use App\Models\Payment;
use App\Models\Ride;
use Illuminate\Support\Str;

class FinanceService
{
    /**
     * @return array{gross: float, stripe_fee: float, platform_commission: float, company_cut: float, driver_net: float}
     */
    public function calculateSplit(float $gross, ?float $companyCommissionRate = null): array
    {
        $provider = config('kinito.payment_provider', 'manual');
        $stripeFee = 0.0;

        if ($provider === PaymentProvider::Stripe->value) {
            $percent = (float) config('kinito.stripe.fee_percent', 3.9);
            $fixed = (float) config('kinito.stripe.fee_fixed', 0.50);
            $stripeFee = round(($gross * ($percent / 100)) + $fixed, 2);
        }

        $platformPercent = (float) config('kinito.commissions.platform_percent', 15);
        $companyPercent = $companyCommissionRate ?? (float) config('kinito.commissions.company_percent', 10);

        $afterStripe = max($gross - $stripeFee, 0);
        $platformCommission = round($afterStripe * ($platformPercent / 100), 2);
        $companyCut = round($afterStripe * ($companyPercent / 100), 2);
        $driverNet = round($afterStripe - $platformCommission - $companyCut, 2);

        return [
            'gross' => round($gross, 2),
            'stripe_fee' => $stripeFee,
            'platform_commission' => $platformCommission,
            'company_cut' => $companyCut,
            'driver_net' => $driverNet,
        ];
    }

    public function applyToRide(Ride $ride, ?float $gross = null, bool $manual = false): Ride
    {
        $gross ??= (float) ($ride->gross_value ?? 0);
        $companyRate = (float) ($ride->company?->commission_rate ?? config('kinito.commissions.company_percent', 10));
        $split = $this->calculateSplit($gross, $companyRate);

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

    public function createPaymentIntentStub(Ride $ride): Payment
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
                'note' => 'Stripe PaymentIntent stub — replace with real Stripe SDK call when keys are configured.',
            ],
        ]);
    }

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
}
