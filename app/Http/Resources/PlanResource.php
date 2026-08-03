<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Plan */
class PlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'price' => (float) $this->price,
            'billingPeriod' => $this->billing_period,
            'maxDrivers' => $this->max_drivers,
            'maxRidesMonth' => $this->max_rides_month,
            'features' => $this->features,
            'isActive' => $this->is_active,
        ];
    }
}
