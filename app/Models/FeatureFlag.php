<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureFlag extends Model
{
    protected $fillable = [
        'key',
        'enabled',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
        ];
    }

    public static function isEnabled(string $key, bool $default = false): bool
    {
        $flag = static::query()->where('key', $key)->first();

        return $flag?->enabled ?? $default;
    }
}
