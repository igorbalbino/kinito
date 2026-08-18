<?php

namespace App\Support;

use App\Enums\ClientStatus;
use App\Enums\DefaultProviderMode;
use App\Enums\DriverStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\ClientPreference;
use App\Models\Company;
use App\Models\Driver;
use App\Models\User;

final class EnsureUserProfiles
{
    public static function ensureCliente(User $user, ?Company $company = null, string $origin = 'empresa'): Client
    {
        EnsureUserRoles::assign($user, UserRole::Cliente);

        $client = Client::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['status' => ClientStatus::Ativo]
        );

        ClientPreference::query()->firstOrCreate(
            ['client_id' => $client->id],
            [
                'default_provider_mode' => $company ? DefaultProviderMode::Company : DefaultProviderMode::All,
                'default_company_id' => $company?->id,
                'favorite_addresses' => [],
            ]
        );

        if ($company) {
            $company->clients()->syncWithoutDetaching([
                $client->id => [
                    'origin' => $origin,
                    'is_active' => true,
                ],
            ]);

            $prefs = $client->preferences;
            if ($prefs && ! $prefs->default_company_id) {
                $prefs->update([
                    'default_provider_mode' => DefaultProviderMode::Company,
                    'default_company_id' => $company->id,
                ]);
            }
        }

        return $client->fresh(['preferences', 'companies']);
    }

    public static function ensureMotorista(User $user, ?Company $company = null, ?User $actor = null): Driver
    {
        EnsureUserRoles::assign($user, UserRole::Motorista);

        $driver = Driver::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['status' => DriverStatus::Ativo]
        );

        if ($company) {
            $driver->companies()->syncWithoutDetaching([
                $company->id => [
                    'status' => DriverStatus::Ativo->value,
                    'approved_at' => now(),
                    'approved_by' => $actor?->id ?? $user->id,
                ],
            ]);

            if (! $driver->primary_company_id) {
                $driver->forceFill(['primary_company_id' => $company->id])->save();
            }
        }

        return $driver->fresh(['companies', 'primaryCompany']);
    }

    /** Company owner can switch empresa / motorista / cliente. */
    public static function grantEmpresaSwitchProfiles(User $user, Company $company): void
    {
        EnsureUserRoles::assign($user, UserRole::Empresa);
        self::ensureCliente($user, $company, 'empresa');
        self::ensureMotorista($user, $company, $user);
    }

    /** Driver can also request rides as cliente. */
    public static function grantDriverClientProfile(User $user, ?Company $company = null): void
    {
        self::ensureCliente($user, $company, $company ? 'empresa' : 'self');
    }
}
