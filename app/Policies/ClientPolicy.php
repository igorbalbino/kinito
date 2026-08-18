<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Client;
use App\Models\User;

class ClientPolicy
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

    public function view(User $user, Client $client): bool
    {
        return match ($user->actingRole()) {
            UserRole::Admin => true,
            UserRole::Cliente, UserRole::Motorista => $user->client?->id === $client->id,
            UserRole::Empresa => $this->inCompanyRoster($user, $client),
        };
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Empresa->value,
            UserRole::Motorista->value,
        ]);
    }

    public function update(User $user, Client $client): bool
    {
        if ($user->isActingAs(UserRole::Cliente) || $user->isActingAs(UserRole::Motorista)) {
            return $user->client?->id === $client->id;
        }

        if ($user->hasRole(UserRole::Admin->value) && $user->isActingAs(UserRole::Admin)) {
            return true;
        }

        return $user->hasRole(UserRole::Empresa->value)
            && $user->isActingAs(UserRole::Empresa)
            && $this->inCompanyRoster($user, $client);
    }

    private function inCompanyRoster(User $user, Client $client): bool
    {
        $companyIds = $user->accessibleCompanyIds();

        return $companyIds->isNotEmpty()
            && $client->companies()->whereIn('companies.id', $companyIds)->exists();
    }
}
