<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\CompanySetting */
class CompanySettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'modeloCorridas' => $this->modelo_corridas?->value,
            'acceptInstantRides' => $this->accept_instant_rides,
            'allowScheduling' => $this->allow_scheduling,
            'stripeEnabled' => $this->stripe_enabled,
            'notificationsEnabled' => $this->notifications_enabled,
            'allowPartners' => $this->allow_partners,
            'extra' => $this->extra,
        ];
    }
}
