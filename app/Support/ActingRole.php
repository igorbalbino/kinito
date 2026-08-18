<?php

namespace App\Support;

use App\Enums\UserRole;
use App\Models\User;

final class ActingRole
{
    public const HEADER = 'X-Kinito-Role';

    public static function of(User $user): UserRole
    {
        $requested = self::fromHeader();

        if ($requested && $user->hasRole($requested->value)) {
            return $requested;
        }

        return self::highest($user);
    }

    public static function highest(User $user): UserRole
    {
        foreach ([UserRole::Admin, UserRole::Empresa, UserRole::Motorista, UserRole::Cliente] as $role) {
            if ($user->hasRole($role->value)) {
                return $role;
            }
        }

        return UserRole::Cliente;
    }

    public static function fromHeader(): ?UserRole
    {
        if (! app()->bound('request')) {
            return null;
        }

        $raw = strtoupper(trim((string) request()->header(self::HEADER, '')));

        return $raw === '' ? null : UserRole::tryFrom($raw);
    }
}
