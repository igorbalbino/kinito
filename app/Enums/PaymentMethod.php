<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CreditCard = 'credit_card';
    case Pix = 'pix';
    case Faturado = 'faturado';
    case Dinheiro = 'dinheiro';
}
