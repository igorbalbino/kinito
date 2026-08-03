<?php

namespace App\Models;

use App\Enums\PartnershipStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyPartnership extends Model
{
    protected $fillable = [
        'company_id',
        'partner_company_id',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => PartnershipStatus::class,
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'partner_company_id');
    }
}
