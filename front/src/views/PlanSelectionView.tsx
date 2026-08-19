import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { PageSEO } from '../components/common/PageSEO';
import {
  ApiPlan,
  fetchCurrentUser,
  fetchPlans,
  fetchPlatformConfig,
  fetchSubscriptionStatus,
  getApiCompanyId,
  getApiToken,
  isApiConfigured,
  listSessionCompanies,
  setApiCompanyId,
  subscribeCompany,
  SubscriptionStatusPayload,
} from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { isMockPlanId, resolvePlansForDisplay } from '../lib/mockPlans';

function planFeatureItems(features: ApiPlan['features']): string[] {
  if (Array.isArray(features)) {
    return features.map((f) => String(f)).filter(Boolean);
  }
  if (features && typeof features === 'object') {
    return Object.values(features)
      .map((v) => String(v))
      .filter(Boolean);
  }
  return [];
}

export const PlanSelectionView: React.FC = () => {
  const navigate = useNavigate();
  const { activeRole } = useAppStore();
  const [companyId, setCompanyId] = useState<number | null>(() => getApiCompanyId());
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [usingMockPlans, setUsingMockPlans] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPlanId, setBusyPlanId] = useState<number | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingDriver, setBillingDriver] = useState<'mock' | 'stripe'>('mock');

  const refresh = useCallback(async () => {
    if (!isApiConfigured() || !getApiToken()) {
      setLoading(false);
      return;
    }

    setError(null);

    try {
      const planList = await fetchPlans();
      const resolved = resolvePlansForDisplay(planList);
      setPlans(resolved.plans);
      setUsingMockPlans(resolved.usingMockPlans);
    } catch (e) {
      const resolved = resolvePlansForDisplay([]);
      setPlans(resolved.plans);
      setUsingMockPlans(true);
      if (resolved.plans.length === 0) {
        setError(e instanceof Error ? e.message : 'Falha ao carregar planos');
        setLoading(false);
        return;
      }
    }

    let cid = companyId ?? getApiCompanyId() ?? listSessionCompanies()[0]?.id ?? null;
    if (!cid) {
      try {
        const me = await fetchCurrentUser();
        cid = listSessionCompanies(me)[0]?.id ?? null;
      } catch {
        cid = null;
      }
    }

    if (cid && cid !== companyId) {
      setCompanyId(cid);
      setApiCompanyId(cid);
    }

    if (cid) {
      const [subResult, configResult] = await Promise.allSettled([
        fetchSubscriptionStatus(cid),
        fetchPlatformConfig(),
      ]);

      if (subResult.status === 'fulfilled') {
        setStatus(subResult.value);
        if (subResult.value.has_access) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } else {
        const reason = subResult.reason;
        setError(reason instanceof Error ? reason.message : 'Falha ao carregar assinatura');
      }

      if (configResult.status === 'fulfilled') {
        const driver = configResult.value.billingDriver;
        if (driver === 'stripe' || driver === 'mock') {
          setBillingDriver(driver);
        }
      }
    }

    setLoading(false);
  }, [companyId, navigate]);

  useEffect(() => {
    if (activeRole !== 'empresa') {
      navigate('/dashboard', { replace: true });
      return;
    }
    void refresh();
  }, [activeRole, navigate, refresh]);

  const resolvePlanForSubscribe = async (plan: ApiPlan): Promise<ApiPlan | null> => {
    if (!isMockPlanId(plan.id)) return plan;
    try {
      const fresh = await fetchPlans();
      const real = fresh.find((p) => p.slug === plan.slug);
      if (real) {
        setPlans(fresh);
        setUsingMockPlans(false);
        return real;
      }
    } catch {
      // keep mock fallback
    }
    setError('Planos ainda não disponíveis no servidor. Tente novamente em instantes.');
    return null;
  };

  const startTrial = async (plan: ApiPlan) => {
    const cid = companyId ?? getApiCompanyId() ?? listSessionCompanies()[0]?.id;
    if (!cid) {
      setError('Não foi possível identificar sua empresa. Entre novamente.');
      return;
    }
    setBusyPlanId(plan.id);
    setError(null);
    try {
      const target = await resolvePlanForSubscribe(plan);
      if (!target) return;
      await subscribeCompany(cid, target.id, 'trial');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao iniciar trial');
    } finally {
      setBusyPlanId(null);
    }
  };

  const subscribeNow = async (plan: ApiPlan) => {
    const cid = companyId ?? getApiCompanyId() ?? listSessionCompanies()[0]?.id;
    if (!cid) {
      setError('Não foi possível identificar sua empresa. Entre novamente.');
      return;
    }
    setBusyPlanId(plan.id);
    setError(null);
    try {
      const target = await resolvePlanForSubscribe(plan);
      if (!target) return;
      const result = await subscribeCompany(cid, target.id, 'checkout');
      if (result.checkout?.checkout_url) {
        window.location.href = result.checkout.checkout_url;
        return;
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao assinar');
    } finally {
      setBusyPlanId(null);
    }
  };

  const trialUsed = Boolean(status?.trial_used);
  const expired = trialUsed && !status?.has_access;
  const referralConstraints = status?.referral?.referral_constraints;
  const allowedSlugs = referralConstraints?.allowed_plan_slugs?.filter(Boolean) ?? [];
  const filteredPlans =
    allowedSlugs.length > 0 ? plans.filter((p) => allowedSlugs.includes(p.slug)) : plans;
  const visiblePlans = filteredPlans.length > 0 ? filteredPlans : plans;

  const slugLabel = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 flex flex-col">
      <PageSEO page="planSelection" />

      <header className="p-6 flex items-center gap-3 max-w-5xl mx-auto w-full">
        <BrandLogo className="w-10 h-10" />
        <div>
          <p className="font-extrabold text-lg">Kinito Empresas</p>
          <p className="text-xs text-slate-500">
            {expired ? 'Seu trial expirou — assine para continuar' : 'Escolha um plano para começar'}
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 pb-12 space-y-6">
        {usingMockPlans && (
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-500/10 border border-slate-500/30 rounded-xl px-4 py-3">
            Catálogo de demonstração (R$ 0,00) — limites e liberações por plano. Ao confirmar, o sistema
            sincroniza com o servidor.
          </p>
        )}

        {billingDriver === 'mock' && (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            Modo de pagamento simulado — checkout abrirá uma confirmação local (sem Stripe).
          </p>
        )}

        {referralConstraints && allowedSlugs.length > 0 && (
          <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200 bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3">
            Você foi indicado por <strong>{referralConstraints.referrer_company}</strong>.
            Planos disponíveis com esta indicação: {allowedSlugs.map(slugLabel).join(', ')}.
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : visiblePlans.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-16">
            Nenhum plano disponível no momento.
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {visiblePlans.map((plan) => {
              const busy = busyPlanId === plan.id;
              const features = planFeatureItems(plan.features);
              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121215] p-6 flex flex-col gap-4 shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-black text-lg">{plan.name}</h2>
                  </div>
                  <p className="text-3xl font-black">
                    R$ {Number(plan.price || 0).toFixed(2)}
                    <span className="text-xs font-bold text-slate-500">/mês</span>
                  </p>
                  {plan.description && (
                    <p className="text-sm text-slate-500 flex-1">{plan.description}</p>
                  )}
                  {features.length > 0 && (
                    <ul className="space-y-1 text-xs">
                      {features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!trialUsed ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void startTrial(plan)}
                      className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Iniciar teste grátis (14 dias)
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void subscribeNow(plan)}
                      className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      Assinar agora
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
      </main>
    </div>
  );
};
