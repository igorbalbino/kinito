<?php

namespace App\Models;

use App\Enums\PaymentProvider;
use App\Enums\TransactionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialTransaction extends Model
{
    protected $fillable = [
        'code',
        'ride_id',
        'company_id',
        'type',
        'amount',
        'gross_value',
        'platform_fee',
        'company_fee',
        'driver_fee',
        'stripe_fee',
        'status',
        'payment_mode',
        'sender',
        'recipient',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'type' => TransactionType::class,
            'payment_mode' => PaymentProvider::class,
            'amount' => 'decimal:2',
            'gross_value' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'company_fee' => 'decimal:2',
            'driver_fee' => 'decimal:2',
            'stripe_fee' => 'decimal:2',
        ];
    }

    public function ride(): BelongsTo
    {
        return $this->belongsTo(Ride::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
