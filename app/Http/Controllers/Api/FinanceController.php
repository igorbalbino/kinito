<?php

namespace App\Http\Controllers\Api;

use App\Enums\RideStatus;
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
        $query = FinancialTransaction::query()->with(['ride', 'company'])->latest();

        if (! $request->user()->hasRole('ADMIN')) {
            $ids = $request->user()->ownedCompanies()->pluck('id')
                ->merge($request->user()->companies()->pluck('companies.id'));
            $query->whereIn('company_id', $ids);
        }

        if ($type = $request->string('type')->toString()) {
            $query->where('type', strtoupper($type));
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', strtoupper($status));
        }

        return FinancialTransactionResource::collection($query->paginate($request->integer('per_page', 20)));
    }

    public function summary(Request $request): JsonResponse
    {
        $rides = Ride::query()->where('status', RideStatus::Finalizada);

        if (! $request->user()->hasRole('ADMIN')) {
            $ids = $request->user()->ownedCompanies()->pluck('id')
                ->merge($request->user()->companies()->pluck('companies.id'));
            $rides->whereIn('company_id', $ids);
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

        $payment = $this->finance->createPaymentIntentStub($ride);

        return response()->json([
            'message' => 'PaymentIntent preparado (stub Stripe).',
            'payment' => $payment,
        ], 201);
    }

    /** Spending summary for the authenticated client (CLIENTE role). */
    public function mySpendings(Request $request): JsonResponse
    {
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
