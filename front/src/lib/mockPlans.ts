import type { ApiPlan } from './api';

/** Planos de fallback quando a API ainda não retornou catálogo (preço zero, só demonstração). */
export const MOCK_PLANS: ApiPlan[] = [
  {
    id: 'mock-starter',
    slug: 'starter',
    name: 'Starter',
    description: 'Ideal para frotas pequenas começando no Kinito.',
    price: 0,
    billingPeriod: 'monthly',
    features: [
      'Até 10 motoristas',
      'Até 500 corridas por mês',
      'Corridas e clientes',
      'Relatórios básicos',
      'Sem parceiros entre empresas',
      'Sem financeiro avançado',
      'Indicações: plano Starter',
    ],
  },
  {
    id: 'mock-pro',
    slug: 'pro',
    name: 'Pro',
    description: 'Para operações com parceiros e repasses.',
    price: 0,
    billingPeriod: 'monthly',
    features: [
      'Até 50 motoristas',
      'Até 5.000 corridas por mês',
      'Tudo do Starter',
      'Parceiros e repasses',
      'Financeiro completo',
      'Relatórios avançados',
      'Indicações: Pro e Starter',
    ],
  },
  {
    id: 'mock-enterprise',
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Operação em escala, sem limites operacionais.',
    price: 0,
    billingPeriod: 'monthly',
    features: [
      'Motoristas ilimitados',
      'Corridas ilimitadas',
      'Todos os módulos liberados',
      'API e integrações',
      'SLA e suporte prioritário',
      'Indicações: todos os planos',
    ],
  },
];

export function isMockPlanId(id: number | string): boolean {
  return String(id).startsWith('mock-');
}

export function resolvePlansForDisplay(apiPlans: ApiPlan[]): {
  plans: ApiPlan[];
  usingMockPlans: boolean;
} {
  if (apiPlans.length > 0) {
    return { plans: apiPlans, usingMockPlans: false };
  }
  return { plans: MOCK_PLANS, usingMockPlans: true };
}
