<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Company */
class ProviderCompanyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'isProvider' => true,
            'modeloCorridas' => $this->whenLoaded('settings', fn () => $this->settings?->modelo_corridas?->value),
            'settings' => [
                'modeloCorridas' => $this->whenLoaded('settings', fn () => $this->settings?->modelo_corridas?->value),
            ],
        ];
    }
}
