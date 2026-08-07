<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Client;
use App\Models\Company;
use App\Models\Driver;
use App\Models\DriverDocument;
use App\Models\Ride;
use App\Models\RideDetailLog;
use App\Models\RideLog;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogController extends Controller
{
    public function rideLogs(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Ride::class);

        $query = RideLog::query()->latest();
        $this->applyRideIdFilter($request, $query);
        $this->scopeByRideVisibility($query, $request->user());

        return response()->json($query->paginate($request->integer('per_page', 30)));
    }

    public function rideDetailLogs(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAnyRole(['ADMIN', 'EMPRESA']), 403);

        $query = RideDetailLog::query()->latest();
        $this->applyRideIdFilter($request, $query);

        $user = $request->user();
        if (! $user->hasRole('ADMIN')) {
            $ids = $user->accessibleCompanyIds();
            $query->whereHas('ride', function (Builder $q) use ($ids) {
                $q->whereIn('company_id', $ids)->orWhereIn('partner_company_id', $ids);
            });
        }

        return response()->json($query->paginate($request->integer('per_page', 30)));
    }

    public function audits(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAnyRole(['ADMIN', 'EMPRESA']), 403);

        $query = AuditLog::query()->with('user')->latest();

        if ($action = $request->string('action')->toString()) {
            $query->where('action', 'like', "%{$action}%");
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        $user = $request->user();
        if (! $user->hasRole('ADMIN')) {
            $this->scopeAuditsForEmpresa($query, $user);
        }

        return response()->json($query->paginate($request->integer('per_page', 30)));
    }

    /**
     * @param  Builder<RideLog>|Builder<RideDetailLog>  $query
     */
    private function applyRideIdFilter(Request $request, Builder $query): void
    {
        if (! $request->filled('ride_id')) {
            return;
        }

        $ride = Ride::query()->findOrFail($request->integer('ride_id'));
        $this->authorize('view', $ride);
        $query->where('ride_id', $ride->id);
    }

    /**
     * Mirror RideController::index visibility via whereHas('ride').
     *
     * @param  Builder<RideLog>|Builder<RideDetailLog>  $query
     */
    private function scopeByRideVisibility(Builder $query, User $user): void
    {
        if ($user->hasRole('ADMIN')) {
            return;
        }

        $query->whereHas('ride', function (Builder $q) use ($user) {
            if ($user->hasRole('EMPRESA')) {
                $ids = $user->accessibleCompanyIds();
                $q->where(function (Builder $inner) use ($ids) {
                    $inner->whereIn('company_id', $ids)->orWhereIn('partner_company_id', $ids);
                });

                return;
            }

            if ($user->hasRole('MOTORISTA')) {
                $q->where('driver_id', $user->driver?->id);

                return;
            }

            if ($user->hasRole('CLIENTE')) {
                $q->where('client_id', $user->client?->id);
            }
        });
    }

    /**
     * Fail-closed morph scope: EMPRESA only sees audits tied to accessible companies.
     *
     * @param  Builder<AuditLog>  $query
     */
    private function scopeAuditsForEmpresa(Builder $query, User $user): void
    {
        $ids = $user->accessibleCompanyIds();

        if ($ids->isEmpty()) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where(function (Builder $q) use ($ids) {
            $q->where(function (Builder $inner) use ($ids) {
                $inner->where('auditable_type', Ride::class)
                    ->whereIn('auditable_id', Ride::query()
                        ->where(function (Builder $r) use ($ids) {
                            $r->whereIn('company_id', $ids)->orWhereIn('partner_company_id', $ids);
                        })
                        ->select('id'));
            })->orWhere(function (Builder $inner) use ($ids) {
                $inner->where('auditable_type', Company::class)
                    ->whereIn('auditable_id', $ids);
            })->orWhere(function (Builder $inner) use ($ids) {
                $inner->where('auditable_type', Subscription::class)
                    ->whereIn('auditable_id', Subscription::query()
                        ->whereIn('company_id', $ids)
                        ->select('id'));
            })->orWhere(function (Builder $inner) use ($ids) {
                $inner->where('auditable_type', Driver::class)
                    ->whereIn('auditable_id', Driver::query()
                        ->whereHas('companies', fn (Builder $c) => $c->whereIn('companies.id', $ids))
                        ->select('id'));
            })->orWhere(function (Builder $inner) use ($ids) {
                $inner->where('auditable_type', Client::class)
                    ->whereIn('auditable_id', Client::query()
                        ->whereHas('companies', fn (Builder $c) => $c->whereIn('companies.id', $ids))
                        ->select('id'));
            })->orWhere(function (Builder $inner) use ($ids) {
                $inner->where('auditable_type', DriverDocument::class)
                    ->whereIn('auditable_id', DriverDocument::query()
                        ->whereHas('driver.companies', fn (Builder $c) => $c->whereIn('companies.id', $ids))
                        ->select('id'));
            });
        });
    }
}
