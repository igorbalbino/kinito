<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Company */
class CompanyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'cnpj' => $this->cnpj,
            'email' => $this->email,
            'phone' => $this->phone,
            'logo' => $this->logo,
            'commissionRate' => (float) $this->commission_rate,
            'isDistributor' => $this->is_distributor,
            'isProvider' => $this->is_provider,
            'isPartnerEnabled' => $this->is_partner_enabled,
            'isActive' => $this->is_active,
            'ownerUserId' => $this->owner_user_id,
            'tier' => $this->whenLoaded('activeSubscription', function () {
                return $this->activeSubscription?->plan?->slug;
            }),
            'activeDrivers' => $this->when(isset($this->active_drivers_count), $this->active_drivers_count),
            'totalRides' => $this->when(isset($this->rides_count), $this->rides_count),
            'settings' => new CompanySettingResource($this->whenLoaded('settings')),
            'collaborators' => $this->whenLoaded('users', function () {
                return $this->users->map(fn ($u) => [
                    'id' => (string) $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->pivot->role,
                ]);
            }),
            'joinedAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
