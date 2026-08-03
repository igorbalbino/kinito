<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Client */
class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $primaryCompany = $this->relationLoaded('companies') ? $this->companies->first() : null;

        return [
            'id' => (string) $this->id,
            'userId' => $this->user_id,
            'name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'email' => $this->whenLoaded('user', fn () => $this->user?->email),
            'phone' => $this->whenLoaded('user', fn () => $this->user?->phone),
            'avatar' => $this->whenLoaded('user', fn () => $this->user?->avatar),
            'status' => strtolower($this->status?->value ?? 'ativo'),
            'rating' => (float) $this->rating,
            'totalRides' => $this->total_rides,
            'totalSpent' => (float) $this->total_spent,
            'companyId' => $primaryCompany ? (string) $primaryCompany->id : null,
            'companyName' => $primaryCompany?->name,
            'preferences' => new ClientPreferenceResource($this->whenLoaded('preferences')),
            'favoriteAddresses' => $this->whenLoaded('preferences', fn () => $this->preferences?->favorite_addresses ?? []),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
