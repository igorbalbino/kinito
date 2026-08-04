<?php

namespace App\Support;

use App\Enums\UserRole;
use App\Models\User;
use Spatie\Permission\Models\Role;

final class EnsureUserRoles
{
    public static function ensure(UserRole ...$roles): void
    {
        $targets = $roles ?: UserRole::cases();

        foreach ($targets as $role) {
            Role::findOrCreate($role->value, 'web');
        }
    }

    public static function assign(User $user, UserRole $role): void
    {
        self::ensure($role);
        if (! $user->hasRole($role->value)) {
            $user->assignRole($role->value);
        }
    }
}
