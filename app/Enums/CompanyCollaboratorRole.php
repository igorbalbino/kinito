<?php

namespace App\Enums;

enum CompanyCollaboratorRole: string
{
    case Dono = 'dono';
    case GerenteFrota = 'gerente_frota';
    case Financeiro = 'financeiro';
    case Atendimento = 'atendimento';
}
