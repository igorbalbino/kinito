<?php

namespace App\Http\Controllers\Api;

use App\Enums\RideStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\FinancialTransactionResource;
use App\Models\FinancialTransaction;
use App\Models\Ride;
use App\Services\Finance\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FinanceController extends Controller
{
    public function __construct(private readonly FinanceService $finance) {}

    public function transactions(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $acting = $user->actingRole();
        abort_unless(in_array($acting, [UserRole::Admin, UserRole::Empresa, UserRole::Motorista], true), 403);

        $query = FinancialTransaction::query()->with(['ride', 'company'])->latest();

        if ($acting === UserRole::Empresa) {
            $ids = $user->accessibleCompanyIds();
            $query->whereIn('company_id', $ids);
        } elseif ($acting === UserRole::Motorista) {
            $driverId = $user->driver?->id;
            abort_unless($driverId, 404, 'Perfil de motorista não encontrado.');
            $query->whereHas('ride', fn ($q) => $q->where('driver_id', $driverId));
        }

        if ($type = $request->string('type')->toString()) {
            $query->where('type', strtoupper($type));
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', strtoupper($status));
        }

        $perPage = min(100, max(1, $request->integer('per_page', 50)));

        return FinancialTransactionResource::collection($query->paginate($perPage));
    }

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $acting = $user->actingRole();
        abort_unless(in_array($acting, [UserRole::Admin, UserRole::Empresa, UserRole::Motorista], true), 403);

        $rides = Ride::query()->where('status', RideStatus::Finalizada);

        if ($acting === UserRole::Empresa) {
            $ids = $user->accessibleCompanyIds();
            $rides->where(function ($q) use ($ids) {
                $q->whereIn('company_id', $ids)->orWhereIn('partner_company_id', $ids);
            });
        } elseif ($acting === UserRole::Motorista) {
            $driverId = $user->driver?->id;
            abort_unless($driverId, 404, 'Perfil de motorista não encontrado.');
            $rides->where('driver_id', $driverId);
        }

        if ($request->filled('from')) {
            $rides->whereDate('completed_at', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $rides->whereDate('completed_at', '<=', $request->date('to'));
        }

        $agg = $rides->selectRaw('
            COALESCE(SUM(gross_value),0) as gross,
            COALESCE(SUM(stripe_fee),0) as stripe_fees,
            COALESCE(SUM(platform_commission),0) as platform,
            COALESCE(SUM(company_cut),0) as company,
            COALESCE(SUM(driver_net),0) as driver_net,
            COUNT(*) as rides_count
        ')->first();

        return response()->json([
            'paymentProvider' => config('kinito.payment_provider'),
            'gross' => (float) $agg->gross,
            'stripeFees' => (float) $agg->stripe_fees,
            'platformCommission' => (float) $agg->platform,
            'companyCut' => (float) $agg->company,
            'driverNet' => (float) $agg->driver_net,
            'ridesCount' => (int) $agg->rides_count,
        ]);
    }

    public function createPaymentIntent(Ride $ride): JsonResponse
    {
        $this->authorize('manage', $ride);

        $payment = $this->finance->createPaymentIntent($ride);
        $driver = $this->finance->paymentDriver();

        return response()->json([
            'message' => $driver === 'stripe'
                ? 'PaymentIntent Stripe criado.'
                : 'PaymentIntent mock preparado (STRIPE_SECRET ausente).',
            'driver' => $driver,
            'payment' => $payment,
        ], 201);
    }

    /** Spending summary for the authenticated client (CLIENTE acting role). */
    public function mySpendings(Request $request): JsonResponse
    {
        abort_unless($request->user()->isActingAs(UserRole::Cliente), 403);
        abort_unless($request->user()->hasRole('CLIENTE'), 403);

        $clientId = $request->user()->client?->id;
        abort_unless($clientId, 404, 'Perfil de cliente não encontrado.');

        $rides = Ride::query()
            ->where('client_id', $clientId)
            ->with(['company:id,name'])
            ->latest()
            ->limit(100)
            ->get();

        $billable = $rides->whereIn('status', [
            RideStatus::Finalizada,
            RideStatus::EmAndamento,
            RideStatus::Aceita,
        ]);

        $items = $rides->map(fn (Ride $ride) => [
            'id' => $ride->id,
            'code' => $ride->code,
            'status' => $ride->status?->value ?? (string) $ride->status,
            'grossValue' => (float) $ride->gross_value,
            'origin' => is_array($ride->origin) ? ($ride->origin['address'] ?? '') : '',
            'destination' => is_array($ride->destination) ? ($ride->destination['address'] ?? '') : '',
            'companyName' => $ride->company?->name,
            'requestedAt' => optional($ride->created_at)?->toIso8601String(),
            'completedAt' => optional($ride->completed_at)?->toIso8601String(),
        ])->values();

        return response()->json([
            'items' => $items,
            'totalSpent' => (float) $billable->sum('gross_value'),
            'ridesCount' => $rides->count(),
            'paymentProvider' => config('kinito.payment_provider'),
        ]);
    }
}
