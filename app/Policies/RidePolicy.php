<?php

namespace App\Policies;

use App\Enums\DriverStatus;
use App\Enums\RideStatus;
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
            $companyIds = $user->accessibleCompanyIds();

            return $companyIds->contains($ride->company_id)
                || $companyIds->contains($ride->partner_company_id);
        }

        if ($user->hasRole(UserRole::Motorista->value)) {
            if ($user->driver?->id === $ride->driver_id) {
                return true;
            }

            return $this->driverCanSeeOpenRide($user, $ride);
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

    public function accept(User $user, Ride $ride): bool
    {
        if ($user->hasRole(UserRole::Admin->value)) {
            return true;
        }

        if ($user->hasRole(UserRole::Empresa->value)) {
            return $this->manage($user, $ride);
        }

        if ($user->hasRole(UserRole::Motorista->value)) {
            return $this->driverCanSeeOpenRide($user, $ride);
        }

        return false;
    }

    public function operate(User $user, Ride $ride): bool
    {
        if ($user->hasRole(UserRole::Admin->value)) {
            return true;
        }

        if ($user->hasRole(UserRole::Empresa->value)) {
            return $this->manage($user, $ride);
        }

        if ($user->hasRole(UserRole::Motorista->value)) {
            return $user->driver?->id === $ride->driver_id;
        }

        return false;
    }

    public function cancel(User $user, Ride $ride): bool
    {
        if ($this->operate($user, $ride)) {
            return true;
        }

        return $user->hasRole(UserRole::Cliente->value)
            && $user->client?->id === $ride->client_id;
    }

    private function driverCanSeeOpenRide(User $user, Ride $ride): bool
    {
        if ($ride->driver_id !== null) {
            return false;
        }

        if (! in_array($ride->status, [RideStatus::Disponivel, RideStatus::Agendada], true)) {
            return false;
        }

        $driver = $user->driver;
        if (! $driver) {
            return false;
        }

        return $driver->companies()
            ->where('companies.id', $ride->company_id)
            ->wherePivot('status', DriverStatus::Ativo->value)
            ->exists();
    }
}
