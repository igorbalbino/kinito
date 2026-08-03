<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Ride;
use App\Models\User;

class RidePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Empresa->value,
            UserRole::Motorista->value,
            UserRole::Cliente->value,
        ]);
    }

    public function view(User $user, Ride $ride): bool
    {
        if ($user->hasRole(UserRole::Admin->value)) {
            return true;
        }

        if ($user->hasRole(UserRole::Empresa->value)) {
            $companyIds = $user->ownedCompanies()->pluck('id')
                ->merge($user->companies()->pluck('companies.id'));

            return $companyIds->contains($ride->company_id)
                || $companyIds->contains($ride->partner_company_id);
        }

        if ($user->hasRole(UserRole::Motorista->value)) {
            return $user->driver?->id === $ride->driver_id;
        }

        if ($user->hasRole(UserRole::Cliente->value)) {
            return $user->client?->id === $ride->client_id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Empresa->value,
            UserRole::Cliente->value,
            UserRole::Motorista->value,
        ]);
    }

    public function update(User $user, Ride $ride): bool
    {
        if ($user->hasRole(UserRole::Cliente->value) && $user->client?->id === $ride->client_id) {
            return true;
        }

        return $this->view($user, $ride) && ! $user->hasRole(UserRole::Cliente->value);
    }

    public function manage(User $user, Ride $ride): bool
    {
        return $user->hasRole(UserRole::Admin->value)
            || ($user->hasRole(UserRole::Empresa->value) && $this->view($user, $ride));
    }
}
