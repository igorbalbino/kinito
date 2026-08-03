<?php

namespace App\Enums;

enum ModeloCorridas: string
{
    case Instantaneas = 'INSTANTANEAS';
    case Agendamento = 'AGENDAMENTO';
    case Ambos = 'AMBOS';
}
