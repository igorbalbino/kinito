<?php

namespace App\Models;

use App\Enums\ClientStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Client extends Model
{
    protected $fillable = [
        'user_id',
        'status',
        'rating',
        'total_rides',
        'total_spent',
    ];

    protected function casts(): array
    {
        return [
            'status' => ClientStatus::class,
            'rating' => 'decimal:2',
            'total_spent' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'client_company')
            ->withPivot(['origin', 'is_active'])
            ->withTimestamps();
    }

    public function preferences(): HasOne
    {
        return $this->hasOne(ClientPreference::class);
    }

    public function rides(): HasMany
    {
        return $this->hasMany(Ride::class);
    }
}
