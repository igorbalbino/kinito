<?php

namespace App\Support;

use App\Models\Plan;

class DefaultPlans
{
    /**
     * @return list<array<string, mixed>>
     */
    public static function definitions(): array
    {
        return [
            [
                'slug' => 'starter',
                'name' => 'Starter',
                'description' => 'Ideal para frotas pequenas',
                'price' => 0,
                'max_drivers' => 10,
                'max_rides_month' => 500,
                'features' => [
                    'Até 10 motoristas',
                    'Até 500 corridas por mês',
                    'Corridas e clientes',
                    'Relatórios básicos',
                    'Sem parceiros entre empresas',
                    'Sem financeiro avançado',
                    'Indicações: plano Starter',
                ],
            ],
            [
                'slug' => 'pro',
                'name' => 'Pro',
                'description' => 'Para operações com parceiros',
                'price' => 0,
                'max_drivers' => 50,
                'max_rides_month' => 5000,
                'features' => [
                    'Até 50 motoristas',
                    'Até 5.000 corridas por mês',
                    'Tudo do Starter',
                    'Parceiros e repasses',
                    'Financeiro completo',
                    'Relatórios avançados',
                    'Indicações: Pro e Starter',
                ],
            ],
            [
                'slug' => 'enterprise',
                'name' => 'Enterprise',
                'description' => 'Sem limites operacionais',
                'price' => 0,
                'max_drivers' => null,
                'max_rides_month' => null,
                'features' => [
                    'Motoristas ilimitados',
                    'Corridas ilimitadas',
                    'Todos os módulos liberados',
                    'API e integrações',
                    'SLA e suporte prioritário',
                    'Indicações: todos os planos',
                ],
            ],
        ];
    }

    public static function ensureSeeded(): void
    {
        if (Plan::query()->where('is_active', true)->exists()) {
            return;
        }

        foreach (self::definitions() as $plan) {
            $stripePriceId = config('kinito.stripe.prices.'.$plan['slug']);

            Plan::query()->updateOrCreate(['slug' => $plan['slug']], $plan + [
                'billing_period' => 'monthly',
                'is_active' => true,
                'stripe_price_id' => filled($stripePriceId) ? $stripePriceId : null,
            ]);
        }
    }
}
