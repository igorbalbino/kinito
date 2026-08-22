import type { ApiPlan } from './api';

export function isMockPlanId(id: number | string): boolean {
  return String(id).startsWith('mock-');
}

export function resolvePlansForDisplay(apiPlans: ApiPlan[]): {
  plans: ApiPlan[];
  empty: boolean;
} {
  return {
    plans: apiPlans,
    empty: apiPlans.length === 0,
  };
}
