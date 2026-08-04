<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar,
            'isActive' => $this->is_active,
            'mustChangePassword' => (bool) $this->must_change_password,
            'emailVerifiedAt' => $this->email_verified_at,
            'roles' => $this->whenLoaded('roles', fn () => $this->getRoleNames()),
            'driver' => new DriverResource($this->whenLoaded('driver')),
            'client' => new ClientResource($this->whenLoaded('client')),
            'companies' => CompanyResource::collection($this->whenLoaded('companies')),
            'ownedCompanies' => CompanyResource::collection($this->whenLoaded('ownedCompanies')),
            'createdAt' => $this->created_at,
        ];
    }
}
