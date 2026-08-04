<?php

namespace App\Services\Company;

use App\Enums\CompanyCollaboratorRole;
use App\Enums\ModeloCorridas;
use App\Enums\UserRole;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Plan;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Subscription\SubscriptionLifecycleService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CompanyService
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly SubscriptionLifecycleService $lifecycle,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
            ]);

            $user->assignRole(UserRole::Empresa->value);

            $company = Company::query()->create([
                'owner_user_id' => $user->id,
                'name' => $data['company_name'],
                'slug' => Str::slug($data['company_name']).'-'.Str::lower(Str::random(4)),
                'cnpj' => $data['cnpj'],
                'email' => $data['company_email'] ?? $data['email'],
                'phone' => $data['company_phone'] ?? ($data['phone'] ?? null),
                'commission_rate' => config('kinito.commissions.company_percent', 10),
                'is_provider' => true,
                'is_active' => true,
            ]);

            $company->users()->attach($user->id, [
                'role' => CompanyCollaboratorRole::Dono->value,
                'is_active' => true,
            ]);

            CompanySetting::query()->create([
                'company_id' => $company->id,
                'modelo_corridas' => ModeloCorridas::Ambos,
                'accept_instant_rides' => true,
                'allow_scheduling' => true,
                'stripe_enabled' => config('kinito.payment_provider') === 'stripe',
                'notifications_enabled' => true,
                'allow_partners' => true,
            ]);

            $subscription = null;
            if (! empty($data['plan_id'])) {
                $plan = Plan::query()->where('is_active', true)->findOrFail($data['plan_id']);
                $subscription = $this->lifecycle->startTrial($company, $plan);
            }

            $this->audit->log('COMPANY_REGISTERED', $user, $company, null, $company->toArray());

            return compact('user', 'company', 'subscription');
        });
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    public function updateSettings(Company $company, array $settings): CompanySetting
    {
        $before = $company->settings?->toArray();
        $setting = $company->settings()->updateOrCreate(
            ['company_id' => $company->id],
            $settings
        );

        $this->audit->log('COMPANY_SETTINGS_UPDATED', auth()->user(), $company, $before, $setting->toArray());

        return $setting->refresh();
    }
}
