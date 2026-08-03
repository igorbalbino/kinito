<?php

namespace App\Enums;

enum RideStatus: string
{
    case Criada = 'CRIADA';
    case Agendada = 'AGENDADA';
    case Disponivel = 'DISPONIVEL';
    case Aceita = 'ACEITA';
    case EmAndamento = 'EM_ANDAMENTO';
    case Finalizada = 'FINALIZADA';
    case Cancelada = 'CANCELADA';

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Criada => in_array($next, [self::Agendada, self::Disponivel, self::Cancelada], true),
            self::Agendada => in_array($next, [self::Disponivel, self::Aceita, self::Cancelada], true),
            self::Disponivel => in_array($next, [self::Aceita, self::Cancelada], true),
            self::Aceita => in_array($next, [self::EmAndamento, self::Cancelada], true),
            self::EmAndamento => in_array($next, [self::Finalizada, self::Cancelada], true),
            self::Finalizada, self::Cancelada => false,
        };
    }
}
