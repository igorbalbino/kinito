<?php

namespace App\Services\Ride;

use App\Enums\DefaultProviderMode;
use App\Enums\FinancialStatus;
use App\Enums\ModeloCorridas;
use App\Enums\RideStatus;
use App\Models\Client;
use App\Models\Company;
use App\Models\Driver;
use App\Models\Ride;
use App\Models\RideDetailLog;
use App\Models\RideLog;
use App\Services\Audit\AuditService;
use App\Services\Finance\FinanceService;
use App\Services\Notification\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class RideService
{
    public function __construct(
        private readonly FinanceService $finance,
        private readonly AuditService $audit,
        private readonly NotificationService $notifications,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?Client $client = null): Ride
    {
        return DB::transaction(function () use ($data, $client) {
            $client ??= Client::query()->findOrFail($data['client_id']);
            $companyId = $data['company_id'] ?? $this->resolveCompanyId($client, $data);

            if (! $companyId) {
                throw new InvalidArgumentException('Não foi possível determinar a empresa responsável pela corrida.');
            }

            $company = Company::query()->with('settings')->findOrFail($companyId);
            $status = $this->initialStatus($company, $data);

            $gross = isset($data['gross_value'])
                ? (float) $data['gross_value']
                : $this->estimateGross((float) ($data['distance_km'] ?? 0));

            $ride = Ride::query()->create([
                'code' => 'COR-'.now()->format('ymd').strtoupper(Str::random(5)),
                'client_id' => $client->id,
                'company_id' => $company->id,
                'partner_company_id' => $data['partner_company_id'] ?? null,
                'driver_id' => $data['driver_id'] ?? null,
                'origin' => $data['origin'],
                'destination' => $data['destination'],
                'scheduled_date' => $data['scheduled_date'] ?? null,
                'scheduled_time' => $data['scheduled_time'] ?? null,
                'distance_km' => $data['distance_km'] ?? 0,
                'duration_min' => $data['duration_min'] ?? 0,
                'status' => $status,
                'financial_status' => FinancialStatus::Incompleto,
                'payment_method' => $data['payment_method'] ?? 'pix',
                'payment_provider' => config('kinito.payment_provider', 'manual'),
                'gross_value' => $gross,
                'notes' => $data['notes'] ?? null,
                'requested_at' => now(),
            ]);

            if (! empty($data['driver_id']) && $status === RideStatus::Disponivel) {
                $ride->update(['status' => RideStatus::Aceita]);
            }

            $this->finance->applyToRide($ride->fresh(['company']), $gross);
            $this->writeLogs($ride->fresh(['client.user', 'driver.user']), 'created', [
                'input' => $data,
            ]);

            $this->audit->log('RIDE_CREATED', auth()->user(), $ride);

            return $ride->fresh(['client.user', 'driver.user', 'company', 'partnerCompany']);
        });
    }

    public function transition(Ride $ride, RideStatus $next, array $extra = []): Ride
    {
        if (! $ride->status->canTransitionTo($next)) {
            throw new InvalidArgumentException("Transição inválida de {$ride->status->value} para {$next->value}.");
        }

        $before = $ride->only(['status', 'driver_id', 'financial_status']);

        $payload = array_merge(['status' => $next], $extra);

        if ($next === RideStatus::EmAndamento) {
            $payload['started_at'] = now();
        }

        if ($next === RideStatus::Finalizada) {
            $payload['completed_at'] = now();
            $payload['financial_status'] = config('kinito.payment_provider') === 'manual'
                ? FinancialStatus::Pendente
                : FinancialStatus::Pago;
        }

        if ($next === RideStatus::Cancelada) {
            $payload['cancelled_at'] = now();
            $payload['financial_status'] = FinancialStatus::Estornado;
        }

        $ride->update($payload);
        $ride = $ride->fresh(['client.user', 'driver.user', 'company']);

        if ($next === RideStatus::Finalizada) {
            $this->finance->createRideTransaction($ride, 'CONFIRMADO');
            if ($ride->driver) {
                $ride->driver->increment('total_rides');
                $ride->driver->increment('total_earnings', (float) $ride->driver_net);
            }
            $ride->client?->increment('total_rides');
            $ride->client?->increment('total_spent', (float) $ride->gross_value);
        }

        $this->writeLogs($ride, 'status_changed', [
            'from' => $before,
            'to' => $ride->only(['status', 'driver_id', 'financial_status']),
            'extra' => $extra,
        ]);

        $this->audit->log('RIDE_STATUS_CHANGED', auth()->user(), $ride, $before, $ride->only(['status', 'driver_id', 'financial_status']));

        return $ride;
    }

    public function accept(Ride $ride, Driver $driver): Ride
    {
        return $this->transition($ride, RideStatus::Aceita, ['driver_id' => $driver->id]);
    }

    public function start(Ride $ride): Ride
    {
        return $this->transition($ride, RideStatus::EmAndamento);
    }

    public function finish(Ride $ride): Ride
    {
        return $this->transition($ride, RideStatus::Finalizada);
    }

    public function cancel(Ride $ride, ?string $reason = null): Ride
    {
        return $this->transition($ride, RideStatus::Cancelada, [
            'cancellation_reason' => $reason,
        ]);
    }

    public function reassign(Ride $ride, Driver $driver): Ride
    {
        $before = ['driver_id' => $ride->driver_id];
        $ride->update([
            'driver_id' => $driver->id,
            'status' => RideStatus::Aceita,
        ]);
        $ride = $ride->fresh(['client.user', 'driver.user', 'company']);
        $this->writeLogs($ride, 'reassigned', ['from' => $before, 'to' => ['driver_id' => $driver->id]]);
        $this->audit->log('RIDE_REASSIGNED', auth()->user(), $ride, $before, ['driver_id' => $driver->id]);

        return $ride;
    }

    public function transferToPartner(Ride $ride, Company $partner): Ride
    {
        $before = ['company_id' => $ride->company_id, 'partner_company_id' => $ride->partner_company_id];
        $ride->update([
            'partner_company_id' => $partner->id,
            // Original company remains responsible; partner executes.
        ]);
        $ride = $ride->fresh(['client.user', 'driver.user', 'company', 'partnerCompany']);
        $this->writeLogs($ride, 'transferred_partner', [
            'from' => $before,
            'to' => ['partner_company_id' => $partner->id],
        ]);
        $this->audit->log('RIDE_TRANSFERRED_PARTNER', auth()->user(), $ride, $before, ['partner_company_id' => $partner->id]);

        return $ride;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveCompanyId(Client $client, array $data): ?int
    {
        if (! empty($data['company_id'])) {
            return (int) $data['company_id'];
        }

        $prefs = $client->preferences;
        if ($prefs?->default_provider_mode === DefaultProviderMode::Company && $prefs->default_company_id) {
            return (int) $prefs->default_company_id;
        }

        return $client->companies()->wherePivot('is_active', true)->value('companies.id');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function initialStatus(Company $company, array $data): RideStatus
    {
        $modelo = $company->settings?->modelo_corridas ?? ModeloCorridas::Ambos;
        $hasSchedule = ! empty($data['scheduled_date']);

        if ($hasSchedule && in_array($modelo, [ModeloCorridas::Agendamento, ModeloCorridas::Ambos], true)) {
            return RideStatus::Agendada;
        }

        if (in_array($modelo, [ModeloCorridas::Instantaneas, ModeloCorridas::Ambos], true)) {
            return RideStatus::Disponivel;
        }

        return RideStatus::Criada;
    }

    private function estimateGross(float $distanceKm): float
    {
        return round(max(12, $distanceKm * 3.5), 2);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function writeLogs(Ride $ride, string $event, array $payload = []): void
    {
        RideLog::query()->create([
            'ride_id' => $ride->id,
            'client_name' => $ride->client?->user?->name,
            'driver_name' => $ride->driver?->user?->name,
            'origin' => $ride->origin['address'] ?? null,
            'destination' => $ride->destination['address'] ?? null,
            'occurred_at' => now(),
            'status' => $ride->status->value,
        ]);

        RideDetailLog::query()->create([
            'ride_id' => $ride->id,
            'payload' => [
                'event' => $event,
                'status' => $ride->status->value,
                'financial_status' => $ride->financial_status?->value,
                'route' => [
                    'origin' => $ride->origin,
                    'destination' => $ride->destination,
                ],
                'changes' => $payload,
                'at' => now()->toIso8601String(),
            ],
        ]);
    }
}
