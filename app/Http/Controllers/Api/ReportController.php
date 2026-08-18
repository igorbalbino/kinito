<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Ride;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function own(Request $request): JsonResponse
    {
        $this->assertCanViewReports($request);

        return response()->json(['data' => $this->build($request, 'own')]);
    }

    public function received(Request $request): JsonResponse
    {
        $this->assertCanViewReports($request);

        return response()->json(['data' => $this->build($request, 'received')]);
    }

    public function forwarded(Request $request): JsonResponse
    {
        $this->assertCanViewReports($request);

        return response()->json(['data' => $this->build($request, 'forwarded')]);
    }

    public function consolidated(Request $request): JsonResponse
    {
        $this->assertCanViewReports($request);
        $own = $this->build($request, 'own');
        $received = $this->build($request, 'received');
        $forwarded = $this->build($request, 'forwarded');

        return response()->json([
            'own' => $own,
            'received' => $received,
            'forwarded' => $forwarded,
            'totals' => [
                'rides' => $own['summary']['rides'] + $received['summary']['rides'] + $forwarded['summary']['rides'],
                'gross' => round($own['summary']['gross'] + $received['summary']['gross'] + $forwarded['summary']['gross'], 2),
                'companyCut' => round($own['summary']['companyCut'] + $received['summary']['companyCut'] + $forwarded['summary']['companyCut'], 2),
            ],
        ]);
    }

    /**
     * @return array{summary: array<string, mixed>, items: array<int, mixed>}
     */
    private function build(Request $request, string $type): array
    {
        $companyIds = $this->companyScope($request);
        $query = Ride::query()->with(['client.user', 'driver.user', 'company', 'partnerCompany']);

        match ($type) {
            'own' => $query->whereIn('company_id', $companyIds)->whereNull('partner_company_id'),
            'received' => $query->whereIn('partner_company_id', $companyIds),
            'forwarded' => $query->whereIn('company_id', $companyIds)->whereNotNull('partner_company_id'),
            default => null,
        };

        $this->applyFilters($query, $request);

        $items = $query->latest()->limit(500)->get()->map(fn (Ride $ride) => [
            'code' => $ride->code,
            'status' => $ride->status?->value,
            'financialStatus' => $ride->financial_status?->value,
            'client' => $ride->client?->user?->name,
            'driver' => $ride->driver?->user?->name,
            'company' => $ride->company?->name,
            'partnerCompany' => $ride->partnerCompany?->name,
            'grossValue' => (float) $ride->gross_value,
            'companyCut' => (float) $ride->company_cut,
            'driverNet' => (float) $ride->driver_net,
            'requestedAt' => $ride->requested_at?->toIso8601String(),
        ]);

        $summary = [
            'rides' => $items->count(),
            'gross' => round($items->sum('grossValue'), 2),
            'companyCut' => round($items->sum('companyCut'), 2),
            'driverNet' => round($items->sum('driverNet'), 2),
        ];

        return ['summary' => $summary, 'items' => $items->values()->all()];
    }

    private function assertCanViewReports(Request $request): void
    {
        $user = $request->user();
        abort_unless(
            $user->isActingAs(UserRole::Admin) || $user->isActingAs(UserRole::Empresa),
            403
        );
        abort_unless(
            $user->hasRole('ADMIN') || $user->hasRole('EMPRESA'),
            403
        );
    }

    private function companyScope(Request $request): \Illuminate\Support\Collection
    {
        if ($request->user()->isActingAs(UserRole::Admin) && $request->filled('company_id')) {
            return collect([(int) $request->integer('company_id')]);
        }

        if ($request->user()->isActingAs(UserRole::Admin) && ! $request->filled('company_id')) {
            return Ride::query()->distinct()->pluck('company_id');
        }

        $ids = $request->user()->accessibleCompanyIds();

        return $ids->isEmpty() ? collect([0]) : $ids;
    }

    private function applyFilters($query, Request $request): void
    {
        if ($request->filled('from')) {
            $query->whereDate('requested_at', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('requested_at', '<=', $request->date('to'));
        }
        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->integer('driver_id'));
        }
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->integer('client_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->string('status')->toString()));
        }
    }
}
