<?php

namespace App\Models;

use App\Enums\ModeloCorridas;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanySetting extends Model
{
    protected $fillable = [
        'company_id',
        'modelo_corridas',
        'accept_instant_rides',
        'allow_scheduling',
        'stripe_enabled',
        'notifications_enabled',
        'allow_partners',
        'whatsapp_enabled',
        'whatsapp_connected',
        'whatsapp_phone',
        'whatsapp_webhook_secret',
        'extra',
    ];

    protected $hidden = [
        'whatsapp_webhook_secret',
    ];

    protected function casts(): array
    {
        return [
            'modelo_corridas' => ModeloCorridas::class,
            'accept_instant_rides' => 'boolean',
            'allow_scheduling' => 'boolean',
            'stripe_enabled' => 'boolean',
            'notifications_enabled' => 'boolean',
            'allow_partners' => 'boolean',
            'whatsapp_enabled' => 'boolean',
            'whatsapp_connected' => 'boolean',
            'extra' => 'array',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
