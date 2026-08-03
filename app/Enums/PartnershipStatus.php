<?php

namespace App\Enums;

enum PartnershipStatus: string
{
    case Pending = 'PENDING';
    case Active = 'ACTIVE';
    case Rejected = 'REJECTED';
    case Suspended = 'SUSPENDED';
}
