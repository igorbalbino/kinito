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
            $companyIds = $user->ownedCompanies()->pluck('id')
                ->merge($user->companies()->pluck('companies.id'));

            return $client->companies()->whereIn('companies.id', $companyIds)->exists();
        }

        return $user->hasRole(UserRole::Motorista->value);
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
