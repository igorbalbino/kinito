<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Ride */
class RideResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'code' => $this->code,
            'clientId' => (string) $this->client_id,
            'clientName' => $this->whenLoaded('client', fn () => $this->client?->user?->name),
            'clientPhone' => $this->whenLoaded('client', fn () => $this->client?->user?->phone),
            'clientAvatar' => $this->whenLoaded('client', fn () => $this->client?->user?->avatar),
            'driverId' => $this->driver_id ? (string) $this->driver_id : null,
            'driverName' => $this->whenLoaded('driver', fn () => $this->driver?->user?->name),
            'driverPhone' => $this->whenLoaded('driver', fn () => $this->driver?->user?->phone),
            'driverAvatar' => $this->whenLoaded('driver', fn () => $this->driver?->user?->avatar),
            'driverVehicle' => $this->whenLoaded('driver', fn () => $this->driver?->vehicle_model),
            'companyId' => (string) $this->company_id,
            'companyName' => $this->whenLoaded('company', fn () => $this->company?->name),
            'partnerCompanyId' => $this->partner_company_id ? (string) $this->partner_company_id : null,
            'partnerCompanyName' => $this->whenLoaded('partnerCompany', fn () => $this->partnerCompany?->name),
            'origin' => $this->origin,
            'destination' => $this->destination,
            'scheduledDate' => $this->scheduled_date?->format('Y-m-d'),
            'scheduledTime' => $this->scheduled_time,
            'distanceKm' => (float) $this->distance_km,
            'durationMin' => $this->duration_min,
            'status' => $this->status?->value,
            'financialStatus' => $this->financial_status?->value,
            'paymentMethod' => $this->payment_method?->value,
            'paymentProvider' => $this->payment_provider?->value,
            'grossValue' => (float) $this->gross_value,
            'stripeFee' => (float) $this->stripe_fee,
            'platformCommission' => (float) $this->platform_commission,
            'companyCut' => (float) $this->company_cut,
            'driverNet' => (float) $this->driver_net,
            'stripeWebhookReceived' => $this->stripe_webhook_received,
            'notes' => $this->notes,
            'cancellationReason' => $this->cancellation_reason,
            'manualOverrideNotes' => $this->manual_override_notes,
            'rating' => $this->rating !== null ? (float) $this->rating : null,
            'requestedAt' => $this->requested_at?->toIso8601String(),
            'startedAt' => $this->started_at?->toIso8601String(),
            'completedAt' => $this->completed_at?->toIso8601String(),
            'cancelledAt' => $this->cancelled_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
