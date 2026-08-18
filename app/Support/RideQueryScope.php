<?php

namespace App\Support;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

final class RideQueryScope
{
    public static function apply(Builder $query, User $user): void
    {
        match ($user->actingRole()) {
            UserRole::Admin => null,
            UserRole::Empresa => self::companyFleet($query, $user),
            UserRole::Motorista => self::driverWork($query, $user),
            UserRole::Cliente => $query->where('client_id', $user->client?->id ?? 0),
        };
    }

    private static function companyFleet(Builder $query, User $user): void
    {
        $ids = $user->accessibleCompanyIds();
        $query->where(function (Builder $q) use ($ids) {
            $q->whereIn('company_id', $ids)->orWhereIn('partner_company_id', $ids);
        });
    }

    private static function driverWork(Builder $query, User $user): void
    {
        $driverId = $user->driver?->id;
        if (! $driverId) {
            $query->whereRaw('0 = 1');

            return;
        }

        $companyIds = $user->accessibleCompanyIds();
        $query->where(function (Builder $q) use ($driverId, $companyIds) {
            $q->where('driver_id', $driverId)
                ->orWhere(function (Builder $inner) use ($companyIds) {
                    $inner->whereNull('driver_id')
                        ->whereIn('status', ['DISPONIVEL', 'AGENDADA'])
                        ->whereIn('company_id', $companyIds);
                });
        });
    }
}
