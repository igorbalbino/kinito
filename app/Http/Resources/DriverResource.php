<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Driver */
class DriverResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $primary = $this->relationLoaded('primaryCompany')
            ? $this->primaryCompany
            : ($this->relationLoaded('companies') ? $this->companies->first() : null);

        $previous = $this->relationLoaded('previousPrimaryCompany') ? $this->previousPrimaryCompany : null;

        return [
            'id' => (string) $this->id,
            'userId' => $this->user_id,
            'name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'email' => $this->whenLoaded('user', fn () => $this->user?->email),
            'phone' => $this->whenLoaded('user', fn () => $this->user?->phone),
            'avatar' => $this->whenLoaded('user', fn () => $this->user?->avatar),
            'status' => $this->status?->value,
            'vehicleModel' => $this->vehicle_model,
            'vehiclePlate' => $this->vehicle_plate,
            'vehicleColor' => $this->vehicle_color,
            'city' => $this->city,
            'rating' => (float) $this->rating,
            'totalRides' => $this->total_rides,
            'totalEarnings' => (float) $this->total_earnings,
            'pendingBalance' => (float) $this->pending_balance,
            'companyId' => $primary ? (string) $primary->id : null,
            'companyName' => $primary?->name,
            'primaryCompanyId' => $this->primary_company_id ? (string) $this->primary_company_id : null,
            'previousPrimaryCompanyId' => $this->previous_primary_company_id ? (string) $this->previous_primary_company_id : null,
            'previousPrimaryCompanyName' => $previous?->name,
            'providerSwitchPending' => (bool) $this->provider_switch_pending,
            'documents' => DriverDocumentResource::collection($this->whenLoaded('documents')),
            'joinedAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
