<?php

namespace App\Enums;

enum DriverStatus: string
{
    case Pendente = 'PENDENTE';
    case Ativo = 'ATIVO';
    case Bloqueado = 'BLOQUEADO';
    case Indisponivel = 'INDISPONIVEL';
}
