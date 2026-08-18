import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { SEOHead } from '../components/common/SEOHead';
import {
  ApiPlan,
  fetchPlans,
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

export const PlanSelectionView: React.FC = () => {
  const navigate = useNavigate();
  const { activeRole } = useAppStore();
  const [companyId, setCompanyId] = useState<number | null>(() => getApiCompanyId());
  const [companies] = useState(() => listSessionCompanies());
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [status, setStatus] = useState<SubscriptionStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPlanId, setBusyPlanId] = useState<number | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingDriver, setBillingDriver] = useState<'mock' | 'stripe'>('mock');

  const refresh = useCallback(async () => {
    if (!isApiConfigured() || !getApiToken()) return;
    let cid = companyId ?? companies[0]?.id ?? null;
    if (cid && !companyId) {
      setCompanyId(cid);
      setApiCompanyId(cid);
    }
    if (!cid) {
      setLoading(false);
      return;
    }
    try {
      const [planList, sub, config] = await Promise.all([
        fetchPlans(),
        fetchSubscriptionStatus(cid),
        fetch(`${(import.meta.env.VITE_API_URL as string).replace(/\/$/, '')}/api/v1/config`, {
          headers: {
            Authorization: `Bearer ${getApiToken()}`,
            Accept: 'application/json',
          },
        }).then((r) => r.json() as Promise<{ billingDriver?: string }>),
      ]);
      setPlans(planList);
      setStatus(sub);
      if (config.billingDriver === 'stripe' || config.billingDriver === 'mock') {
        setBillingDriver(config.billingDriver);
      }
      if (sub.has_access) {
        navigate('/dashboard', { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar planos');
    } finally {
      setLoading(false);
    }
  }, [companyId, companies, navigate]);

  useEffect(() => {
    if (activeRole !== 'empresa') {
      navigate('/dashboard', { replace: true });
      return;
    }
    void refresh();
  }, [activeRole, navigate, refresh]);

  const startTrial = async (plan: ApiPlan) => {
    const cid = companyId ?? companies[0]?.id;
    if (!cid) return;
    setBusyPlanId(plan.id);
    setError(null);
    try {
      await subscribeCompany(cid, plan.id, 'trial');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao iniciar trial');
    } finally {
      setBusyPlanId(null);
    }
  };

  const subscribeNow = async (plan: ApiPlan) => {
    const cid = companyId ?? companies[0]?.id;
    if (!cid) return;
    setBusyPlanId(plan.id);
    setError(null);
    try {
      const result = await subscribeCompany(cid, plan.id, 'checkout');
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

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 flex flex-col">
      <SEOHead
        title="Escolher plano — Kinito"
        description="Selecione um plano para iniciar o teste gratuito de 14 dias."
        keywords="kinito, plano, trial"
        category="billing"
        canonicalUrl="/escolher-plano"
      />

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
        {billingDriver === 'mock' && (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            Modo de pagamento simulado — checkout abrirá uma confirmação local (sem Stripe).
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const busy = busyPlanId === plan.id;
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
                    R$ {Number(plan.price).toFixed(2)}
                    <span className="text-xs font-bold text-slate-500">/mês</span>
                  </p>
                  {plan.description && (
                    <p className="text-sm text-slate-500 flex-1">{plan.description}</p>
                  )}
                  {Array.isArray(plan.features) && plan.features.length > 0 && (
                    <ul className="space-y-1 text-xs">
                      {plan.features.map((f) => (
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
