<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Company extends Model
{
    protected $fillable = [
        'owner_user_id',
        'name',
        'slug',
        'cnpj',
        'email',
        'phone',
        'logo',
        'commission_rate',
        'is_distributor',
        'is_provider',
        'is_partner_enabled',
        'is_active',
        'stripe_customer_id',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'is_distributor' => 'boolean',
            'is_provider' => 'boolean',
            'is_partner_enabled' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function settings(): HasOne
    {
        return $this->hasOne(CompanySetting::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot(['role', 'is_active'])
            ->withTimestamps();
    }

    public function drivers(): BelongsToMany
    {
        return $this->belongsToMany(Driver::class, 'driver_company')
            ->withPivot(['status', 'approved_at', 'approved_by'])
            ->withTimestamps();
    }

    public function clients(): BelongsToMany
    {
        return $this->belongsToMany(Client::class, 'client_company')
            ->withPivot(['origin', 'is_active'])
            ->withTimestamps();
    }

    public function partnerships(): HasMany
    {
        return $this->hasMany(CompanyPartnership::class);
    }

    public function partnerOf(): HasMany
    {
        return $this->hasMany(CompanyPartnership::class, 'partner_company_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }

    public function rides(): HasMany
    {
        return $this->hasMany(Ride::class);
    }

    public function partnerRides(): HasMany
    {
        return $this->hasMany(Ride::class, 'partner_company_id');
    }

    public function financialTransactions(): HasMany
    {
        return $this->hasMany(FinancialTransaction::class);
    }
}
