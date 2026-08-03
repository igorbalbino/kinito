<?php

namespace App\Enums;

enum SubscriptionStatus: string
{
    case Trialing = 'TRIALING';
    case Active = 'ACTIVE';
    case PastDue = 'PAST_DUE';
    case Canceled = 'CANCELED';
    case Expired = 'EXPIRED';
}
