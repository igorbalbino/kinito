<?php

namespace App\Support;

final class RedactSecrets
{
    public static function inText(?string $text): string
    {
        if ($text === null || $text === '') {
            return '';
        }

        $redacted = preg_replace(
            '/senha\s*tempor[aá]ria\s*:\s*\S+/iu',
            'Senha temporária: [ocultada]',
            $text
        ) ?? $text;

        $redacted = preg_replace(
            '/temporary\s*password\s*:\s*\S+/iu',
            'Temporary password: [redacted]',
            $redacted
        ) ?? $redacted;

        $redacted = preg_replace(
            '/\b(?:senha|password)\s*[:=]\s*\S+/iu',
            'senha: [ocultada]',
            $redacted
        ) ?? $redacted;

        return $redacted;
    }

    public static function containsSecret(?string $text): bool
    {
        if ($text === null || $text === '') {
            return false;
        }

        return (bool) preg_match(
            '/(?:senha\s*tempor[aá]ria\s*:|temporary\s*password\s*:|\b(?:senha|password)\s*[:=])\s*\S+/iu',
            $text
        );
    }
}
