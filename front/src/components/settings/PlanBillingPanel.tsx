import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, CreditCard, Loader2, Sparkles, Users } from 'lucide-react';
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
} from '../../lib/api';
import { SafeSelect } from '../common/SafeSelect';

export const PlanBillingPanel: React.FC = () => {
  const [companyId, setCompanyId] = useState<number | null>(() => getApiCompanyId());
  const [companies] = useState(() => listSessionCompanies());
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [status, setStatus] = useState<SubscriptionStatusPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const apiReady = isApiConfigured() && Boolean(getApiToken());

  const refresh = useCallback(async () => {
    if (!apiReady || !companyId) return;
    setError(null);
    try {
      const [planList, sub] = await Promise.all([
        fetchPlans(),
        fetchSubscriptionStatus(companyId),
      ]);
      setPlans(planList);
      setStatus(sub);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar planos');
    }
  }, [apiReady, companyId]);

  useEffect(() => {
    if (!companyId && companies[0]) {
      setCompanyId(companies[0].id);
      setApiCompanyId(companies[0].id);
    }
  }, [companies, companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSelect = async (plan: ApiPlan, mode: 'trial' | 'checkout') => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await subscribeCompany(companyId, plan.id, mode);
      if (result.checkout?.checkout_url) {
        window.location.href = result.checkout.checkout_url;
        return;
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha na assinatura');
    } finally {
      setLoading(false);
    }
  };

  const copyShare = async () => {
    const url = status?.referral?.share_url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Não foi possível copiar o link');
    }
  };

  if (!apiReady) {
    return null;
  }

  const subStatus = status?.subscription?.status;
  const hasAccess = Boolean(status?.has_access);
  const canTrial = !status?.trial_used;
  const referral = status?.referral;

  return (
    <div className="space-y-5">
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-white dark:bg-white/5 space-y-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Plano e período de teste</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Escolha um plano e teste 14 dias grátis. Depois, assine ou a empresa fica suspensa e some do marketplace.
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
              hasAccess
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
            }`}
          >
            {hasAccess ? subStatus || 'Acesso ativo' : subStatus || 'Sem acesso'}
          </span>
        </div>

        {companies.length > 1 && (
          <SafeSelect
            className="w-full sm:w-72"
            value={String(companyId ?? '')}
            onChange={(v) => {
              const id = Number(v);
              setCompanyId(id);
              setApiCompanyId(id);
            }}
            sanitizeLabels
            label="Empresa"
            options={companies.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
          />
        )}

        {!hasAccess && (
          <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
            Empresa suspensa ou sem plano: ela não aparece para clientes até assinar.
          </p>
        )}

        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map((plan) => (
            <div
              key={String(plan.id)}
              className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 space-y-3"
            >
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{plan.name}</h4>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  R$ {Number(plan.price).toFixed(2)}
                  <span className="text-[10px] font-semibold text-slate-400">/mês</span>
                </p>
                {plan.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {canTrial && !hasAccess && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void onSelect(plan, 'trial')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Teste 14 dias
                  </button>
                )}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void onSelect(plan, 'checkout')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white/10 disabled:opacity-50"
                >
                  Assinar agora
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {referral?.referral_code && (
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-white dark:bg-white/5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Indique empresas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quando a empresa indicada pagar o primeiro plano, você ganha +1 mês de vigência (acumulável).
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Seu código</div>
              <div className="font-mono text-lg font-black tracking-widest text-slate-900 dark:text-slate-100">
                {referral.referral_code}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void copyShare()}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold min-h-[48px]"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link copiado' : 'Copiar link de indicação'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {referral.months_earned ?? referral.rewarded ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">Meses ganhos</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {referral.pending ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">Aguardando pagamento</div>
            </div>
          </div>

          {Boolean(referral.recent?.length) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Indicações recentes</h4>
              <ul className="divide-y divide-slate-100 dark:divide-white/10 text-xs">
                {referral.recent!.slice(0, 5).map((row) => (
                  <li key={row.id} className="py-2 flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {row.referred_company || `Empresa #${row.id}`}
                    </span>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        row.status === 'rewarded'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {row.status === 'rewarded' ? '+1 mês' : 'Pendente'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
