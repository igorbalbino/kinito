<?php

namespace App\Models;

use App\Enums\DriverStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Driver extends Model
{
    protected $fillable = [
        'user_id',
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
            'rating' => 'decimal:2',
            'total_earnings' => 'decimal:2',
            'pending_balance' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
