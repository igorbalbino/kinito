<?php

namespace App\Console\Commands;

use App\Services\Subscription\SubscriptionLifecycleService;
use Illuminate\Console\Command;

class ExpireTrialsCommand extends Command
{
    protected $signature = 'subscriptions:expire-trials';

    protected $description = 'Expira trials vencidos, suspende empresas e libera clientes para o marketplace';

    public function handle(SubscriptionLifecycleService $lifecycle): int
    {
        $count = $lifecycle->expireDueTrials();
        $this->info("Trials expirados: {$count}");

        return self::SUCCESS;
    }
}
