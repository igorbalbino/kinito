<?php

namespace App\Console\Commands;

use App\Services\Subscription\SubscriptionLifecycleService;
use Illuminate\Console\Command;

class ExpireTrialsCommand extends Command
{
    protected $signature = 'subscriptions:expire-trials';

    protected $description = 'Expira trials e assinaturas pagas vencidas; suspende empresas e libera afiliados';

    public function handle(SubscriptionLifecycleService $lifecycle): int
    {
        $trials = $lifecycle->expireDueTrials();
        $paid = $lifecycle->expireDuePaidSubscriptions();
        $this->info("Trials expirados: {$trials}; assinaturas pagas expiradas: {$paid}");

        return self::SUCCESS;
    }
}
