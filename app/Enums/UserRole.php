<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'ADMIN';
    case Empresa = 'EMPRESA';
    case Motorista = 'MOTORISTA';
    case Cliente = 'CLIENTE';
}
