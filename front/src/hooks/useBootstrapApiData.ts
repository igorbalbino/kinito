import { useCallback, useEffect } from 'react';
import {
  fetchAudits,
  fetchClientsList,
  fetchCompaniesFull,
  fetchDriversList,
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
import { roleFromApi } from '../lib/mappers';
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
        setActiveRole(roleFromApi(user.roles));
      }
      const companyId = getApiCompanyId();
      if (companyId) setSelectedCompanyId(String(companyId));

      const config = await fetchPlatformConfig().catch(() => null);
      if (config?.paymentProvider === 'stripe' || config?.paymentProvider === 'manual') {
        setFinancialMode(config.paymentProvider as FinancialMode);
      }

      const [rides, drivers, clients, companies, transactions, notifications, logs, audits] =
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
