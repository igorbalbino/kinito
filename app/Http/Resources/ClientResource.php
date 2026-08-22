<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Client */
class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $prefCompanyId = $this->relationLoaded('preferences')
            ? $this->preferences?->default_company_id
            : null;

        $primaryCompany = null;
        if ($prefCompanyId && $this->relationLoaded('companies')) {
            $primaryCompany = $this->companies->firstWhere('id', $prefCompanyId);
        }
        if (! $primaryCompany && $this->relationLoaded('companies')) {
            $primaryCompany = $this->companies->first();
        }

        $viewer = $request->user();
        $transferPending = false;
        if ($viewer && $this->relationLoaded('companies')) {
            $viewerCompanyIds = $viewer->accessibleCompanyIds();
            $pendingPivot = $this->companies->first(function ($company) use ($viewerCompanyIds) {
                return $viewerCompanyIds->contains($company->id)
                    && ! (bool) ($company->pivot?->is_active ?? true);
            });
            $transferPending = $pendingPivot !== null;
        }

        $base = [
            'id' => (string) $this->id,
            'userId' => $this->user_id,
            'status' => strtolower($this->status?->value ?? 'ativo'),
            'rating' => (float) $this->rating,
            'totalRides' => $this->total_rides,
            'totalSpent' => (float) $this->total_spent,
            'companyId' => $prefCompanyId
                ? (string) $prefCompanyId
                : ($primaryCompany ? (string) $primaryCompany->id : null),
            'companyName' => $primaryCompany?->name,
            'transferPending' => $transferPending,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];

        // Pending consent: hide PII from company listing until the client accepts.
        if ($transferPending && $viewer && ! $viewer->hasRole('ADMIN') && (int) $viewer->id !== (int) $this->user_id) {
            return array_merge($base, [
                'name' => 'Transferência pendente',
                'email' => null,
                'phone' => null,
                'avatar' => null,
                'preferences' => null,
                'favoriteAddresses' => [],
            ]);
        }

        return array_merge($base, [
            'name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'email' => $this->whenLoaded('user', fn () => $this->user?->email),
            'phone' => $this->whenLoaded('user', fn () => $this->user?->phone),
            'avatar' => $this->whenLoaded('user', fn () => $this->user?->avatar),
            'preferences' => new ClientPreferenceResource($this->whenLoaded('preferences')),
            'favoriteAddresses' => $this->whenLoaded('preferences', fn () => $this->preferences?->favorite_addresses ?? []),
        ]);
    }
}
