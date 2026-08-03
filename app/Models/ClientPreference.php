<?php

namespace App\Models;

use App\Enums\DefaultProviderMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientPreference extends Model
{
    protected $fillable = [
        'client_id',
        'default_provider_mode',
        'default_company_id',
        'favorite_addresses',
        'extra',
    ];

    protected function casts(): array
    {
        return [
            'default_provider_mode' => DefaultProviderMode::class,
            'favorite_addresses' => 'array',
            'extra' => 'array',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function defaultCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'default_company_id');
    }
}
