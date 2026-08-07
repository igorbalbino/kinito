<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Services\Notification\NotificationService;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /** Envia verificação via SMTP direto (PHPMailer), não via MAIL_MAILER=log. */
    public function sendEmailVerificationNotification(): void
    {
        app(NotificationService::class)->sendEmailVerification($this);
    }

    /** Redefinição de senha via SMTP direto. */
    public function sendPasswordResetNotification($token): void
    {
        app(NotificationService::class)->sendPasswordResetEmail($this, (string) $token);
    }

    protected $fillable = [
        'name',
        'email',
        'phone',
        'avatar',
        'password',
        'is_active',
        'must_change_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
        ];
    }

    public static function findForLogin(string $login): ?self
    {
        $login = trim($login);

        if (str_contains($login, '@')) {
            return static::query()->where('email', $login)->first();
        }

        $digits = preg_replace('/\D+/', '', $login) ?: $login;

        return static::query()
            ->where(function ($q) use ($login, $digits) {
                $q->where('phone', $login)
                    ->orWhere('phone', $digits)
                    ->orWhereRaw("REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') = ?", [$digits]);
            })
            ->first();
    }

    public function ownedCompanies(): HasMany
    {
        return $this->hasMany(Company::class, 'owner_user_id');
    }

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class)
            ->withPivot(['role', 'is_active'])
            ->withTimestamps();
    }

    public function driver(): HasOne
    {
        return $this->hasOne(Driver::class);
    }

    public function client(): HasOne
    {
        return $this->hasOne(Client::class);
    }

    public function appNotifications(): HasMany
    {
        return $this->hasMany(AppNotification::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function hasAppRole(UserRole|string $role): bool
    {
        $value = $role instanceof UserRole ? $role->value : $role;

        return $this->hasRole($value);
    }

    public function primaryCompany(): ?Company
    {
        return $this->ownedCompanies()->first()
            ?? $this->companies()->wherePivot('is_active', true)->first();
    }

    /**
     * Company IDs this user may act on (tenant scope).
     * ADMIN is handled separately via canAccessCompany().
     *
     * @return Collection<int, int>
     */
    public function accessibleCompanyIds(): Collection
    {
        if ($this->hasRole(UserRole::Admin->value)) {
            return collect();
        }

        if ($this->hasRole(UserRole::Empresa->value)) {
            return $this->ownedCompanies()->pluck('id')
                ->merge($this->companies()->pluck('companies.id'))
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values();
        }

        if ($this->hasRole(UserRole::Motorista->value) && $this->driver) {
            return $this->driver->companies()->pluck('companies.id')
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values();
        }

        return collect();
    }

    public function canAccessCompany(Company|int $company): bool
    {
        if ($this->hasRole(UserRole::Admin->value)) {
            return true;
        }

        $id = $company instanceof Company ? (int) $company->id : (int) $company;

        return $this->accessibleCompanyIds()->contains($id);
    }
}
