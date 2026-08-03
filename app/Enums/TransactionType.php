<?php

namespace App\Enums;

enum TransactionType: string
{
    case Corrida = 'CORRIDA';
    case Repasse = 'REPASSE';
    case Comissao = 'COMISSAO';
    case Estorno = 'ESTORNO';
    case TaxaStripe = 'TAXA_STRIPE';
}
