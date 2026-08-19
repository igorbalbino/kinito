import { useCallback, useEffect } from 'react';
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
import { useAppStore } from '../store/useAppStore';
import type { FinancialMode } from '../types';

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

  const load = useCallback(async () => {
    if (!enabled || !isApiConfigured() || !getApiToken()) return;

    setDataMeta({ loading: true, error: null });
    try {
      const user = getStoredApiUser();
      const token = getApiToken();
      // Re-write session without any accidental credential fields from older builds.
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
      if (config?.paymentProvider === 'stripe' || config?.paymentProvider === 'manual') {
        setFinancialMode(config.paymentProvider as FinancialMode);
      }

      let rides: Record<string, unknown>[] = [];
      let drivers: Record<string, unknown>[] = [];
      let clients: Record<string, unknown>[] = [];
      let companies: Record<string, unknown>[] = [];
      let transactions: Record<string, unknown>[] = [];
      let notifications: Record<string, unknown>[] = [];
      let logs: Record<string, unknown>[] = [];
      let audits: Record<string, unknown>[] = [];

      if (activeRole === 'admin' || activeRole === 'empresa') {
        [rides, drivers, clients, companies, transactions, notifications, logs, audits] =
          await Promise.all([
            fetchRides().catch(() => []),
            fetchDriversList().catch(() => []),
            fetchClientsList().catch(() => []),
            fetchCompaniesFull().catch(() => []),
            fetchTransactions().catch(() => []),
            fetchNotifications().catch(() => []),
            fetchRideLogs().catch(() => []),
            fetchAudits().catch(() => []),
          ]);
      } else if (activeRole === 'motorista') {
        [rides, notifications] = await Promise.all([
          fetchRides().catch(() => []),
          fetchNotifications().catch(() => []),
        ]);
      } else {
        const [clientRides, clientNotifications, mySpendings] = await Promise.all([
          fetchRides().catch(() => []),
          fetchNotifications().catch(() => []),
          fetchMySpendings().catch(() => ({ items: [] as Record<string, unknown>[] })),
        ]);
        rides = clientRides;
        notifications = clientNotifications;
        transactions = Array.isArray(mySpendings.items) ? mySpendings.items : [];
      }

      setRides(rides.map((r) => normalizeRide(r as Record<string, unknown>)));
      setDrivers(drivers.map((d) => normalizeDriver(d as Record<string, unknown>)));
      setClients(clients.map((c) => normalizeClient(c as Record<string, unknown>)));
      setCompanies(companies.map((c) => normalizeCompany(c as Record<string, unknown>)));
      setTransactions(transactions.map((t) => normalizeTransaction(t as Record<string, unknown>)));
      setNotifications(notifications.map((n) => normalizeNotification(n as Record<string, unknown>)));
      setLogs(logs.map((l) => normalizeLog(l as Record<string, unknown>)));
      setAudits(audits.map((a) => normalizeAudit(a as Record<string, unknown>)));
      setDataMeta({ loaded: true, loading: false, error: null });
    } catch (e) {
      setDataMeta({
        loading: false,
        error: e instanceof Error ? e.message : 'Falha ao carregar dados',
      });
    }
  }, [
    activeRole,
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
    if (!dataLoaded && !dataLoading) {
      void load();
    }
  }, [dataLoaded, dataLoading, load]);
}
