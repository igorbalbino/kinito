import React, { useEffect, useState } from 'react';
import { Building2, Check, Loader2, RotateCcw } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Footer } from '../components/layout/Footer';
import { PageSEO } from '../components/common/PageSEO';
import { useAppStore } from '../store/useAppStore';
import {
  fetchProviders,
  fetchCurrentUser,
  getStoredApiUser,
  revertDriverProviderApi,
  setApiSession,
  getApiToken,
  switchDriverProviderApi,
  updateClientPreferencesApi,
  updateDriverPreferencesApi,
} from '../lib/api';
import { isClientRole } from '../lib/navByRole';
import { normalizeDriver } from '../lib/normalize';
import { unwrapResource } from '../lib/sessionProfile';

export const FornecedoresView: React.FC = () => {
  const { activeRole, upsertDriver } = useAppStore();
  const clientMode = isClientRole(activeRole);
  const isDriverProfile = activeRole === 'motorista';
  const [providers, setProviders] = useState<{ id: number; name: string; modeloCorridas?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [apiUser, setApiUser] = useState(() => getStoredApiUser());

  const refreshUser = () => setApiUser(getStoredApiUser());

  useEffect(() => {
    fetchProviders()
      .then(setProviders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao listar fornecedores'))
      .finally(() => setLoading(false));
  }, []);

  const clientPrefs = apiUser?.client?.preferences;
  const clientId = apiUser?.client?.id;
  const inferredClientCompanyId = clientPrefs?.defaultCompanyId ?? apiUser?.client?.companyId ?? null;
  const selectedCompanyId = inferredClientCompanyId ? Number(inferredClientCompanyId) : null;
  const mode = clientPrefs?.defaultProviderMode || (selectedCompanyId ? 'COMPANY' : 'ALL');

  const driver = apiUser?.driver;
  const driverPrimaryId = driver?.primaryCompanyId ? Number(driver.primaryCompanyId) : null;
  const driverProviderMode = driver?.providerMode || 'COMPANY';
  const switchPending = Boolean(driver?.providerSwitchPending);

  const persistUserPatch = (patch: Partial<NonNullable<typeof apiUser>>) => {
    const token = getApiToken();
    const current = getStoredApiUser();
    if (!token || !current) return;
    const next = { ...current, ...patch };
    setApiSession(token, next);
    setApiUser(next);
  };

  const selectClientCompany = async (companyId: number | null, nextMode: 'COMPANY' | 'ALL') => {
    let resolvedClientId = clientId;
    if (!resolvedClientId) {
      try {
        const fresh = await fetchCurrentUser();
        setApiUser(fresh);
        resolvedClientId = fresh.client?.id;
      } catch {
        // fall through to user-facing error below
      }
    }
    if (!resolvedClientId) {
      setError('Perfil de cliente não encontrado na sessão.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await updateClientPreferencesApi(resolvedClientId, {
        default_provider_mode: nextMode,
        default_company_id: nextMode === 'ALL' ? null : companyId,
      });
      const client = (res as { preferences?: unknown; id?: string }).preferences
        ? res
        : ((res as { data?: Record<string, unknown> }).data || res);
      const prefs = (client as { preferences?: { defaultProviderMode?: string; defaultCompanyId?: string | null } })
        .preferences;
      persistUserPatch({
        client: {
          ...apiUser?.client,
          id: resolvedClientId,
          companyId: prefs?.defaultCompanyId || null,
          preferences: {
            defaultProviderMode: prefs?.defaultProviderMode || nextMode,
            defaultCompanyId: prefs?.defaultCompanyId || null,
          },
        },
      });
      setMessage(nextMode === 'ALL' ? 'Marketplace ativado.' : 'Fornecedor principal atualizado.');
      refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar');
    } finally {
      setBusy(false);
    }
  };

  const selectDriverAll = async () => {
    if (!driver?.id) {
      setError('Perfil de motorista não encontrado.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await updateDriverPreferencesApi(driver.id, { provider_mode: 'ALL' });
      const raw = unwrapResource((res as { data?: Record<string, unknown> }).data || res);
      upsertDriver(normalizeDriver(raw as Record<string, unknown>));
      persistUserPatch({
        driver: {
          ...apiUser?.driver,
          id: driver.id,
          companyId: null,
          companyName: null,
          primaryCompanyId: null,
          providerMode: 'ALL',
          providerSwitchPending: false,
        },
      });
      setMessage('Marketplace ativado — você pode aceitar corridas de qualquer fornecedor disponível.');
      refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar');
    } finally {
      setBusy(false);
    }
  };

  const selectDriverCompany = async (companyId: number) => {
    if (!driver?.id) {
      setError('Perfil de motorista não encontrado.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await switchDriverProviderApi(driver.id, companyId);
      const raw = unwrapResource(res.driver || res);
      upsertDriver(normalizeDriver(raw as Record<string, unknown>));
      persistUserPatch({
        driver: {
          ...apiUser?.driver,
          id: driver.id,
          companyId: String((raw as { companyId?: string }).companyId || companyId),
          companyName: String((raw as { companyName?: string }).companyName || ''),
          primaryCompanyId: String((raw as { primaryCompanyId?: string }).primaryCompanyId || companyId),
          previousPrimaryCompanyId: (raw as { previousPrimaryCompanyId?: string }).previousPrimaryCompanyId || null,
          previousPrimaryCompanyName: (raw as { previousPrimaryCompanyName?: string }).previousPrimaryCompanyName || null,
          providerSwitchPending: Boolean((raw as { providerSwitchPending?: boolean }).providerSwitchPending),
        },
      });
      setMessage(res.message || 'Solicitação enviada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao solicitar vínculo');
    } finally {
      setBusy(false);
    }
  };

  const revertDriver = async () => {
    if (!driver?.id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await revertDriverProviderApi(driver.id);
      const raw = unwrapResource(res.driver || res);
      upsertDriver(normalizeDriver(raw as Record<string, unknown>));
      persistUserPatch({
        driver: {
          ...apiUser?.driver,
          id: driver.id,
          companyId: String((raw as { companyId?: string }).companyId || ''),
          companyName: String((raw as { companyName?: string }).companyName || ''),
          primaryCompanyId: String((raw as { primaryCompanyId?: string }).primaryCompanyId || ''),
          previousPrimaryCompanyId: null,
          previousPrimaryCompanyName: null,
          providerSwitchPending: false,
        },
      });
      setMessage(res.message || 'Fornecedor anterior restaurado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao reverter');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <PageSEO page="fornecedores" />
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Fornecedores</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          {clientMode
            ? 'Escolha uma empresa específica ou use o marketplace (todos).'
            : 'Escolha uma empresa específica ou receba corridas de todos os fornecedores disponíveis.'}
        </p>
      </header>

      {error && <p className="text-sm text-rose-500 font-medium">{error}</p>}
      {message && <p className="text-sm text-emerald-600 font-medium">{message}</p>}

      {isDriverProfile && switchPending && (
        <section aria-label="Troca de fornecedor pendente" className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100 text-xs space-y-3">
          <p>
            Aguardando aceite de <strong>{driver?.companyName}</strong>. Você está suspenso de corridas até a
            aprovação.
            {driver?.previousPrimaryCompanyName
              ? ` Pode voltar para ${driver.previousPrimaryCompanyName}.`
              : ''}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void revertDriver()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 text-white font-bold disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Voltar ao fornecedor anterior
          </button>
        </section>
      )}

      {isDriverProfile && !switchPending && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void selectDriverAll()}
          aria-pressed={driverProviderMode === 'ALL'}
          className={`w-full text-left p-4 rounded-xl border transition-all ${
            driverProviderMode === 'ALL'
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          }`}
        >
          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {driverProviderMode === 'ALL' && <Check className="w-4 h-4 text-indigo-500" />} Todos / marketplace
          </div>
          <p className="text-xs text-zinc-500 mt-1">Aceitar corridas abertas de qualquer fornecedor ativo.</p>
        </button>
      )}

      {clientMode && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void selectClientCompany(null, 'ALL')}
          aria-pressed={mode === 'ALL'}
          className={`w-full text-left p-4 rounded-xl border transition-all ${
            mode === 'ALL'
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          }`}
        >
          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {mode === 'ALL' && <Check className="w-4 h-4 text-indigo-500" />} Todos / marketplace
          </div>
          <p className="text-xs text-zinc-500 mt-1">Escolher fornecedor a cada corrida instantânea.</p>
        </button>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando fornecedores…
        </div>
      ) : (
        <section aria-label="Lista de fornecedores" className="space-y-2">
          {providers.map((p) => {
            const selected = clientMode
              ? mode === 'COMPANY' && selectedCompanyId === p.id
              : driverProviderMode === 'COMPANY' && driverPrimaryId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                disabled={busy || (isDriverProfile && selected && !switchPending)}
                aria-pressed={selected}
                onClick={() => {
                  if (clientMode) void selectClientCompany(p.id, 'COMPANY');
                  else if (isDriverProfile) void selectDriverCompany(p.id);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 disabled:opacity-60 ${
                  selected
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-400/40'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {selected && <Check className="w-4 h-4 text-emerald-500" />}
                    {p.name}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {p.modeloCorridas === 'AGENDAMENTO'
                      ? 'Modelo: agendamento'
                      : p.modeloCorridas === 'INSTANTANEAS'
                        ? 'Modelo: instantâneo'
                        : 'Modelo: instantâneo e agendamento'}
                    {driverProviderMode === 'COMPANY' && selected && switchPending ? ' · aguardando aceite' : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </section>
      )}

      <Footer />
    </PageContainer>
  );
};
