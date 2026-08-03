<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ClientPreference */
class ClientPreferenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'defaultProviderMode' => $this->default_provider_mode?->value,
            'defaultCompanyId' => $this->default_company_id ? (string) $this->default_company_id : null,
            'favoriteAddresses' => $this->favorite_addresses ?? [],
            'extra' => $this->extra,
        ];
    }
}
