<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppNotification extends Model
{
    protected $table = 'app_notifications';

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'category',
        'type',
        'channel',
        'link',
        'meta',
        'read',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'read' => 'boolean',
            'sent_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
