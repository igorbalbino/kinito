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
        return match ($user->actingRole()) {
            UserRole::Admin => true,
            UserRole::Empresa => $this->inCompanyFleet($user, $ride),
            UserRole::Motorista => $user->driver?->id === $ride->driver_id
                || $this->driverCanSeeOpenRide($user, $ride),
            UserRole::Cliente => $user->client?->id === $ride->client_id,
        };
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
        if ($user->isActingAs(UserRole::Cliente) && $user->client?->id === $ride->client_id) {
            return true;
        }

        return $this->view($user, $ride) && ! $user->isActingAs(UserRole::Cliente);
    }

    public function manage(User $user, Ride $ride): bool
    {
        if ($user->hasRole(UserRole::Admin->value) && $user->isActingAs(UserRole::Admin)) {
            return true;
        }

        return $user->hasRole(UserRole::Empresa->value)
            && $user->isActingAs(UserRole::Empresa)
            && $this->inCompanyFleet($user, $ride);
    }

    public function adjustPrice(User $user, Ride $ride): bool
    {
        if ($this->manage($user, $ride)) {
            return true;
        }

        return $user->isActingAs(UserRole::Motorista)
            && $user->hasRole(UserRole::Motorista->value)
            && $user->driver?->id === $ride->driver_id;
    }

    public function accept(User $user, Ride $ride): bool
    {
        if ($user->isActingAs(UserRole::Admin) && $user->hasRole(UserRole::Admin->value)) {
            return true;
        }

        if ($user->isActingAs(UserRole::Empresa)) {
            return $this->manage($user, $ride);
        }

        if ($user->isActingAs(UserRole::Motorista) && $user->hasRole(UserRole::Motorista->value)) {
            return $this->driverCanSeeOpenRide($user, $ride);
        }

        return false;
    }

    public function operate(User $user, Ride $ride): bool
    {
        if ($user->isActingAs(UserRole::Admin) && $user->hasRole(UserRole::Admin->value)) {
            return true;
        }

        if ($user->isActingAs(UserRole::Empresa)) {
            return $this->manage($user, $ride);
        }

        if ($user->isActingAs(UserRole::Motorista) && $user->hasRole(UserRole::Motorista->value)) {
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
            && $user->isActingAs(UserRole::Cliente)
            && $user->client?->id === $ride->client_id;
    }

    private function inCompanyFleet(User $user, Ride $ride): bool
    {
        if (! $user->hasRole(UserRole::Empresa->value) && ! $user->hasRole(UserRole::Admin->value)) {
            return false;
        }

        $companyIds = $user->accessibleCompanyIds();

        return $companyIds->contains($ride->company_id)
            || $companyIds->contains($ride->partner_company_id);
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
