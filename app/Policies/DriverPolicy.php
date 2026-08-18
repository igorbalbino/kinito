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
        return match ($user->actingRole()) {
            UserRole::Admin => true,
            UserRole::Motorista, UserRole::Cliente => $user->driver?->id === $driver->id,
            UserRole::Empresa => $this->inCompanyFleet($user, $driver),
        };
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Empresa->value,
        ]);
    }

    public function update(User $user, Driver $driver): bool
    {
        if ($user->driver?->id === $driver->id && $user->hasRole(UserRole::Motorista->value)) {
            return true;
        }

        return $this->manageFleet($user, $driver);
    }

    public function manageFleet(User $user, Driver $driver): bool
    {
        if ($user->hasRole(UserRole::Admin->value)) {
            return true;
        }

        return $user->hasRole(UserRole::Empresa->value)
            && $this->inCompanyFleet($user, $driver);
    }

    private function inCompanyFleet(User $user, Driver $driver): bool
    {
        $companyIds = $user->accessibleCompanyIds();

        return $companyIds->isNotEmpty()
            && $driver->companies()->whereIn('companies.id', $companyIds)->exists();
    }
}
