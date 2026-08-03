<?php

namespace App\Enums;

enum ClientStatus: string
{
    case Ativo = 'ATIVO';
    case Suspenso = 'SUSPENSO';
    case Vip = 'VIP';
}
