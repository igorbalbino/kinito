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
        if ($user->hasRole(UserRole::Admin->value)) {
            return true;
        }

        if ($user->hasRole(UserRole::Cliente->value)) {
            return $user->client?->id === $client->id;
        }

        if ($user->hasRole(UserRole::Empresa->value)) {
            $companyIds = $user->accessibleCompanyIds();

            return $companyIds->isNotEmpty()
                && $client->companies()->whereIn('companies.id', $companyIds)->exists();
        }

        if ($user->hasRole(UserRole::Motorista->value)) {
            $companyIds = $user->accessibleCompanyIds();

            return $companyIds->isNotEmpty()
                && $client->companies()->whereIn('companies.id', $companyIds)->exists();
        }

        return false;
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
        return $this->view($user, $client);
    }
}
