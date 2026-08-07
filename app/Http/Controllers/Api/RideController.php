<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ride\StoreRideRequest;
use App\Http\Resources\RideResource;
use App\Models\Company;
use App\Models\Driver;
use App\Models\Ride;
use App\Services\Finance\FinanceService;
use App\Services\Ride\RideService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RideController extends Controller
{
    public function __construct(
        private readonly RideService $rides,
        private readonly FinanceService $finance,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Ride::class);

        $query = Ride::query()->with(['client.user', 'driver.user', 'company', 'partnerCompany']);

        $user = $request->user();

        if ($user->hasRole('ADMIN')) {
            // all
        } elseif ($user->hasRole('EMPRESA')) {
            $ids = $user->accessibleCompanyIds();
            $query->where(function ($q) use ($ids) {
                $q->whereIn('company_id', $ids)->orWhereIn('partner_company_id', $ids);
            });
        } elseif ($user->hasRole('MOTORISTA')) {
            $driverId = $user->driver?->id;
            $companyIds = $user->accessibleCompanyIds();
            $query->where(function ($q) use ($driverId, $companyIds) {
                $q->where('driver_id', $driverId)
                    ->orWhere(function ($q) use ($companyIds) {
                        $q->whereNull('driver_id')
                            ->whereIn('status', ['DISPONIVEL', 'AGENDADA'])
                            ->whereIn('company_id', $companyIds);
                    });
            });
        } elseif ($user->hasRole('CLIENTE')) {
            $query->where('client_id', $user->client?->id);
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', strtoupper($status));
        }

        if ($financial = $request->string('financial_status')->toString()) {
            $query->where('financial_status', strtoupper($financial));
        }

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->integer('company_id'));
        }

        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->integer('driver_id'));
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->integer('client_id'));
        }

        if ($request->filled('from')) {
            $query->whereDate('requested_at', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('requested_at', '<=', $request->date('to'));
        }

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('origin->address', 'like', "%{$search}%")
                    ->orWhere('destination->address', 'like', "%{$search}%");
            });
        }

        return RideResource::collection($query->latest()->paginate($request->integer('per_page', 20)));
    }

    public function store(StoreRideRequest $request): JsonResponse
    {
        $this->authorize('create', Ride::class);

        $data = $request->validated();
        $user = $request->user();

        if (! $user->hasAnyRole(['ADMIN', 'EMPRESA'])) {
            unset($data['driver_id'], $data['partner_company_id']);
        }

        if ($user->hasAnyRole(['EMPRESA', 'MOTORISTA']) && ! empty($data['company_id'])) {
            abort_unless($user->canAccessCompany((int) $data['company_id']), 403, 'Sem permissão nesta empresa.');
        }

        if ($user->hasRole('CLIENTE') && empty($data['client_id'])) {
            $data['client_id'] = $user->client?->id;
        }

        $ride = $this->rides->create($data, $user->client);

        return response()->json([
            'message' => 'Corrida criada.',
            'ride' => new RideResource($ride),
        ], 201);
    }

    public function show(Ride $ride): RideResource
    {
        $this->authorize('view', $ride);

        return new RideResource($ride->load(['client.user', 'driver.user', 'company', 'partnerCompany', 'logs', 'detailLogs']));
    }

    public function accept(Request $request, Ride $ride): RideResource
    {
        $this->authorize('accept', $ride);

        $user = $request->user();
        if ($user->hasRole('MOTORISTA')) {
            $driver = $user->driver;
            abort_unless($driver, 403, 'Perfil de motorista não encontrado.');
        } else {
            $driver = Driver::query()->findOrFail($request->integer('driver_id'));
        }

        return new RideResource($this->rides->accept($ride, $driver)->load(['client.user', 'driver.user', 'company']));
    }

    public function start(Ride $ride): RideResource
    {
        $this->authorize('operate', $ride);

        return new RideResource($this->rides->start($ride)->load(['client.user', 'driver.user', 'company']));
    }

    public function finish(Ride $ride): RideResource
    {
        $this->authorize('operate', $ride);

        return new RideResource($this->rides->finish($ride)->load(['client.user', 'driver.user', 'company']));
    }

    public function cancel(Request $request, Ride $ride): RideResource
    {
        $this->authorize('cancel', $ride);

        $data = $request->validate(['reason' => ['nullable', 'string']]);

        return new RideResource($this->rides->cancel($ride, $data['reason'] ?? null)->load(['client.user', 'driver.user', 'company']));
    }

    public function reassign(Request $request, Ride $ride): RideResource
    {
        $this->authorize('manage', $ride);

        $data = $request->validate(['driver_id' => ['required', 'exists:drivers,id']]);
        $driver = Driver::query()->findOrFail($data['driver_id']);

        return new RideResource($this->rides->reassign($ride, $driver)->load(['client.user', 'driver.user', 'company']));
    }

    public function transferPartner(Request $request, Ride $ride): RideResource
    {
        $this->authorize('manage', $ride);

        $data = $request->validate(['partner_company_id' => ['required', 'exists:companies,id']]);
        $partner = Company::query()->findOrFail($data['partner_company_id']);

        return new RideResource($this->rides->transferToPartner($ride, $partner)->load(['client.user', 'driver.user', 'company', 'partnerCompany']));
    }

    public function manualFinance(Request $request, Ride $ride): RideResource
    {
        $this->authorize('manage', $ride);

        $data = $request->validate([
            'gross_value' => ['required', 'numeric', 'min:0'],
            'platform_commission' => ['nullable', 'numeric', 'min:0'],
            'company_cut' => ['nullable', 'numeric', 'min:0'],
            'driver_net' => ['nullable', 'numeric', 'min:0'],
            'manual_override_notes' => ['nullable', 'string'],
        ]);

        if (isset($data['platform_commission']) || isset($data['driver_net'])) {
            $ride->update([
                'gross_value' => $data['gross_value'],
                'platform_commission' => $data['platform_commission'] ?? $ride->platform_commission,
                'company_cut' => $data['company_cut'] ?? $ride->company_cut,
                'driver_net' => $data['driver_net'] ?? $ride->driver_net,
                'manual_override_notes' => $data['manual_override_notes'] ?? null,
                'financial_status' => $data['gross_value'] > 0 ? 'PENDENTE' : 'INCOMPLETO',
            ]);
        } else {
            $this->finance->applyToRide($ride, (float) $data['gross_value'], true);
            if (! empty($data['manual_override_notes'])) {
                $ride->update(['manual_override_notes' => $data['manual_override_notes']]);
            }
        }

        return new RideResource($ride->fresh()->load(['client.user', 'driver.user', 'company']));
    }
}
