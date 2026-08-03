<?php

namespace App\Models;

use App\Enums\FinancialStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentProvider;
use App\Enums\RideStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ride extends Model
{
    protected $fillable = [
        'code',
        'client_id',
        'company_id',
        'partner_company_id',
        'driver_id',
        'origin',
        'destination',
        'scheduled_date',
        'scheduled_time',
        'distance_km',
        'duration_min',
        'status',
        'financial_status',
        'payment_method',
        'payment_provider',
        'gross_value',
        'stripe_fee',
        'platform_commission',
        'company_cut',
        'driver_net',
        'stripe_webhook_received',
        'notes',
        'cancellation_reason',
        'manual_override_notes',
        'rating',
        'requested_at',
        'started_at',
        'completed_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'origin' => 'array',
            'destination' => 'array',
            'scheduled_date' => 'date',
            'status' => RideStatus::class,
            'financial_status' => FinancialStatus::class,
            'payment_method' => PaymentMethod::class,
            'payment_provider' => PaymentProvider::class,
            'distance_km' => 'decimal:2',
            'gross_value' => 'decimal:2',
            'stripe_fee' => 'decimal:2',
            'platform_commission' => 'decimal:2',
            'company_cut' => 'decimal:2',
            'driver_net' => 'decimal:2',
            'stripe_webhook_received' => 'boolean',
            'rating' => 'decimal:2',
            'requested_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function partnerCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'partner_company_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(RideLog::class);
    }

    public function detailLogs(): HasMany
    {
        return $this->hasMany(RideDetailLog::class);
    }

    public function financialTransactions(): HasMany
    {
        return $this->hasMany(FinancialTransaction::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
