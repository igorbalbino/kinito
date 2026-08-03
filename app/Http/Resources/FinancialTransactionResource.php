<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\FinancialTransaction */
class FinancialTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'code' => $this->code,
            'rideId' => $this->ride_id ? (string) $this->ride_id : null,
            'companyId' => $this->company_id ? (string) $this->company_id : null,
            'type' => strtolower($this->type?->value ?? ''),
            'amount' => (float) $this->amount,
            'grossValue' => $this->gross_value !== null ? (float) $this->gross_value : null,
            'platformFee' => $this->platform_fee !== null ? (float) $this->platform_fee : null,
            'companyFee' => $this->company_fee !== null ? (float) $this->company_fee : null,
            'driverFee' => $this->driver_fee !== null ? (float) $this->driver_fee : null,
            'stripeFee' => $this->stripe_fee !== null ? (float) $this->stripe_fee : null,
            'status' => strtolower($this->status),
            'paymentMode' => $this->payment_mode?->value ?? $this->payment_mode,
            'sender' => $this->sender,
            'recipient' => $this->recipient,
            'description' => $this->description,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
