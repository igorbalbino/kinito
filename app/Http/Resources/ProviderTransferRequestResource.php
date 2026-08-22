<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ProviderTransferRequest */
class ProviderTransferRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subjectType' => $this->subject_type,
            'subjectId' => $this->subject_id,
            'toCompanyId' => $this->to_company_id,
            'fromCompanyId' => $this->from_company_id,
            'status' => $this->status,
            'resolvedAt' => $this->resolved_at?->toIso8601String(),
        ];
    }
}
