import { useCallback, useEffect, useRef } from 'react';
import {
  fetchAudits,
  fetchClientsList,
  fetchCompaniesFull,
  fetchDriversList,
  fetchMySpendings,
  fetchNotifications,
  fetchPlatformConfig,
  fetchRideLogs,
  fetchRides,
  fetchTransactions,
  getApiCompanyId,
  getApiToken,
  getStoredApiUser,
  isApiConfigured,
  sanitizeApiUser,
  setApiSession,
} from '../lib/api';
import {
  normalizeAudit,
  normalizeClient,
  normalizeCompany,
  normalizeDriver,
  normalizeLog,
  normalizeNotification,
  normalizeRide,
  normalizeTransaction,
} from '../lib/normalize';
import { rolesFromApi } from '../lib/mappers';
import { perfLog, perfMark } from '../lib/perf';
import { useAppStore } from '../store/useAppStore';
import type { FinancialMode, UserRole } from '../types';

async function safeListFetch<T>(
  label: string,
  fn: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[bootstrap] ${label} falhou — usando lista vazia`, err);
    }
    return [];
  }
}

export function useBootstrapApiData(enabled = true) {
  const {
    setRides,
    setDrivers,
    setClients,
    setCompanies,
    setTransactions,
    setNotifications,
    setLogs,
    setAudits,
    setDataMeta,
    setActiveRole,
    setSelectedCompanyId,
    setFinancialMode,
    activeRole,
    dataLoaded,
    dataLoading,
  } = useAppStore();

  const inFlightRef = useRef(false);
  const generationRef = useRef(0);

  const load = useCallback(async () => {
    if (!enabled || !isApiConfigured() || !getApiToken()) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    const generation = ++generationRef.current;
    const roleAtStart = useAppStore.getState().activeRole;
    const endBootstrap = perfMark(`bootstrap:${roleAtStart}`);

    setDataMeta({ loading: true, error: null });
    try {
      const user = getStoredApiUser();
      const token = getApiToken();
      if (user && token) {
        setApiSession(token, sanitizeApiUser(user), getApiCompanyId());
      }
      if (user?.roles) {
        const allowed = rolesFromApi(user.roles);
        const current = useAppStore.getState().activeRole;
        if (!allowed.includes(current)) {
          setActiveRole(allowed[0] ?? 'cliente');
        }
      }
      const companyId = getApiCompanyId();
      if (companyId) setSelectedCompanyId(String(companyId));

      const config = await fetchPlatformConfig().catch(() => null);
      if (generation !== generationRef.current) return;

      if (config?.paymentProvider === 'stripe' || config?.paymentProvider === 'manual') {
        setFinancialMode(config.paymentProvider as FinancialMode);
      }

      const endFetch = perfMark(`bootstrap:fetch:${roleAtStart}`);
      let rides: Record<string, unknown>[] = [];
      let drivers: Record<string, unknown>[] = [];
      let clients: Record<string, unknown>[] = [];
      let companies: Record<string, unknown>[] = [];
      let transactions: Record<string, unknown>[] = [];
      let notifications: Record<string, unknown>[] = [];
      let logs: Record<string, unknown>[] = [];
      let audits: Record<string, unknown>[] = [];

      const role = roleAtStart as UserRole;

      if (role === 'admin' || role === 'empresa') {
        [rides, drivers, clients, companies, transactions, notifications, logs, audits] =
          await Promise.all([
            safeListFetch('corridas', fetchRides),
            safeListFetch('motoristas', fetchDriversList),
            safeListFetch('clientes', fetchClientsList),
            safeListFetch('empresas', fetchCompaniesFull),
            safeListFetch('transações', fetchTransactions),
            safeListFetch('notificações', fetchNotifications),
            safeListFetch('logs', fetchRideLogs),
            safeListFetch('auditoria', fetchAudits),
          ]);
      } else if (role === 'motorista') {
        [rides, notifications] = await Promise.all([
          safeListFetch('corridas', fetchRides),
          safeListFetch('notificações', fetchNotifications),
        ]);
      } else {
        const [clientRides, clientNotifications, mySpendings] = await Promise.all([
          safeListFetch('corridas', fetchRides),
          safeListFetch('notificações', fetchNotifications),
          fetchMySpendings().catch(() => ({ items: [] as Record<string, unknown>[] })),
        ]);
        rides = clientRides;
        notifications = clientNotifications;
        transactions = Array.isArray(mySpendings.items) ? mySpendings.items : [];
      }
      endFetch();

      if (generation !== generationRef.current) return;

      const endNormalize = perfMark(`bootstrap:normalize:${roleAtStart}`);
      setRides(rides.map((r) => normalizeRide(r as Record<string, unknown>)));
      setDrivers(drivers.map((d) => normalizeDriver(d as Record<string, unknown>)));
      setClients(clients.map((c) => normalizeClient(c as Record<string, unknown>)));
      setCompanies(companies.map((c) => normalizeCompany(c as Record<string, unknown>)));
      setTransactions(transactions.map((t) => normalizeTransaction(t as Record<string, unknown>)));
      setNotifications(notifications.map((n) => normalizeNotification(n as Record<string, unknown>)));
      setLogs(logs.map((l) => normalizeLog(l as Record<string, unknown>)));
      setAudits(audits.map((a) => normalizeAudit(a as Record<string, unknown>)));
      endNormalize();

      perfLog(`bootstrap:counts:${roleAtStart}`, {
        rides: rides.length,
        drivers: drivers.length,
        clients: clients.length,
      });

      setDataMeta({ loaded: true, loading: false, error: null });
      endBootstrap();
    } catch (e) {
      if (generation !== generationRef.current) return;
      setDataMeta({
        loading: false,
        error: e instanceof Error ? e.message : 'Falha ao carregar dados',
      });
      endBootstrap();
    } finally {
      if (generation === generationRef.current) {
        inFlightRef.current = false;
      }
    }
  }, [
    enabled,
    setActiveRole,
    setAudits,
    setClients,
    setCompanies,
    setDataMeta,
    setDrivers,
    setFinancialMode,
    setLogs,
    setNotifications,
    setRides,
    setSelectedCompanyId,
    setTransactions,
  ]);

  useEffect(() => {
    if (!enabled || !isApiConfigured() || !getApiToken()) return;
    if (dataLoaded || dataLoading || inFlightRef.current) return;
    void load();
  }, [enabled, dataLoaded, dataLoading, load, activeRole]);

  return { reload: load };
}
