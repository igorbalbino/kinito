<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Driver;
use App\Models\User;

class DriverPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Empresa->value,
            UserRole::Motorista->value,
        ]);
    }

    public function view(User $user, Driver $driver): bool
    {
        if ($user->hasRole(UserRole::Admin->value)) {
            return true;
        }

        if ($user->hasRole(UserRole::Motorista->value)) {
            return $user->driver?->id === $driver->id;
        }

        if ($user->hasRole(UserRole::Empresa->value)) {
            $companyIds = $user->ownedCompanies()->pluck('id')
                ->merge($user->companies()->pluck('companies.id'));

            return $driver->companies()->whereIn('companies.id', $companyIds)->exists();
        }

        return false;
    }

    public function update(User $user, Driver $driver): bool
    {
        return $user->hasRole(UserRole::Admin->value)
            || $user->hasRole(UserRole::Empresa->value)
            || $user->driver?->id === $driver->id;
    }
}
