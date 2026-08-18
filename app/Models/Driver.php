<?php

namespace App\Models;

use App\Enums\DefaultProviderMode;
use App\Enums\DriverStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Driver extends Model
{
    protected $fillable = [
        'user_id',
        'primary_company_id',
        'previous_primary_company_id',
        'provider_switch_pending',
        'provider_mode',
        'provider_restore',
        'status',
        'vehicle_model',
        'vehicle_plate',
        'vehicle_color',
        'city',
        'rating',
        'total_rides',
        'total_earnings',
        'pending_balance',
    ];

    protected function casts(): array
    {
        return [
            'status' => DriverStatus::class,
            'provider_mode' => DefaultProviderMode::class,
            'provider_switch_pending' => 'boolean',
            'provider_restore' => 'array',
            'rating' => 'decimal:2',
            'total_earnings' => 'decimal:2',
            'pending_balance' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function primaryCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'primary_company_id');
    }

    public function previousPrimaryCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'previous_primary_company_id');
    }

    public function canAcceptRides(): bool
    {
        return ! $this->provider_switch_pending
            && $this->status === DriverStatus::Ativo;
    }

    public function isMarketplaceProvider(): bool
    {
        return ($this->provider_mode ?? DefaultProviderMode::Company) === DefaultProviderMode::All;
    }

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'driver_company')
            ->withPivot(['status', 'approved_at', 'approved_by'])
            ->withTimestamps();
    }

    public function documents(): HasMany
    {
        return $this->hasMany(DriverDocument::class);
    }

    public function rides(): HasMany
    {
        return $this->hasMany(Ride::class);
    }
}
