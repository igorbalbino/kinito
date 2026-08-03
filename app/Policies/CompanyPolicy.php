<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Company;
use App\Models\User;

class CompanyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([UserRole::Admin->value, UserRole::Empresa->value]);
    }

    public function view(User $user, Company $company): bool
    {
        if ($user->hasRole(UserRole::Admin->value)) {
            return true;
        }

        return $company->owner_user_id === $user->id
            || $company->users()->where('users.id', $user->id)->exists();
    }

    public function update(User $user, Company $company): bool
    {
        return $this->view($user, $company);
    }

    public function manage(User $user, Company $company): bool
    {
        return $user->hasRole(UserRole::Admin->value)
            || $company->owner_user_id === $user->id;
    }
}
