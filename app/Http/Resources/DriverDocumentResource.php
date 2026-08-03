<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\DriverDocument */
class DriverDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'status' => strtolower($this->status?->value ?? 'pendente'),
            'fileUrl' => $this->file_url,
            'uploadedAt' => $this->uploaded_at?->toIso8601String(),
            'expiresAt' => $this->expires_at?->toIso8601String(),
        ];
    }
}
