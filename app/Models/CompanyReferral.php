<?php

namespace App\Models;

use App\Enums\ReferralStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyReferral extends Model
{
    protected $fillable = [
        'referrer_company_id',
        'referred_company_id',
        'referral_code',
        'status',
        'rewarded_at',
        'reward_days',
    ];

    protected function casts(): array
    {
        return [
            'status' => ReferralStatus::class,
            'rewarded_at' => 'datetime',
            'reward_days' => 'integer',
        ];
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'referrer_company_id');
    }

    public function referred(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'referred_company_id');
    }
}
