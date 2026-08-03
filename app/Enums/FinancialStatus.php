<?php

namespace App\Enums;

enum FinancialStatus: string
{
    case Incompleto = 'INCOMPLETO';
    case Pendente = 'PENDENTE';
    case Pago = 'PAGO';
    case Recebido = 'RECEBIDO';
    case Repassado = 'REPASSADO';
    case Estornado = 'ESTORNADO';
}
