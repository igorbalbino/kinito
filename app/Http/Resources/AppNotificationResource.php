<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AppNotification */
class AppNotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'title' => $this->title,
            'message' => $this->message,
            'timestamp' => ($this->sent_at ?? $this->created_at)?->toIso8601String(),
            'category' => $this->category,
            'read' => $this->read,
            'link' => $this->link,
            'type' => $this->type,
            'channel' => $this->channel,
        ];
    }
}
