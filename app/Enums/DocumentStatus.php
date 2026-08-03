<?php

namespace App\Enums;

enum DocumentStatus: string
{
    case Aprovado = 'APROVADO';
    case Pendente = 'PENDENTE';
    case Rejeitado = 'REJEITADO';
    case Vencido = 'VENCIDO';
}
