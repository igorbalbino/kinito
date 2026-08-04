import { create } from 'zustand';
import { Language } from '../i18n/translations';
import {
  Client,
  Company,
  Driver,
  DriverStatus,
  FeatureFlags,
  FinancialMode,
  FinancialTransaction,
  Ride,
  SystemAudit,
  SystemLog,
  SystemNotification,
  UserRole,
} from '../types';

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;

  theme: 'dark' | 'light';
  toggleTheme: () => void;

  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;

  financialMode: FinancialMode;
  setFinancialMode: (mode: FinancialMode) => void;

  featureFlags: FeatureFlags;
  toggleFeatureFlag: (flagKey: keyof FeatureFlags) => void;

  rides: Ride[];
  drivers: Driver[];
  clients: Client[];
  companies: Company[];
  transactions: FinancialTransaction[];
  notifications: SystemNotification[];
  logs: SystemLog[];
  audits: SystemAudit[];
  dataLoaded: boolean;
  dataLoading: boolean;
  dataError: string | null;

  setRides: (rides: Ride[]) => void;
  setDrivers: (drivers: Driver[]) => void;
  setClients: (clients: Client[]) => void;
  setCompanies: (companies: Company[]) => void;
  setTransactions: (transactions: FinancialTransaction[]) => void;
  setNotifications: (notifications: SystemNotification[]) => void;
  setLogs: (logs: SystemLog[]) => void;
  setAudits: (audits: SystemAudit[]) => void;
  setDataMeta: (meta: { loaded?: boolean; loading?: boolean; error?: string | null }) => void;
  resetDomainData: () => void;

  upsertRide: (ride: Ride) => void;
  updateRideFinancials: (rideId: string, values: { grossValue: number; driverNet: number; platformCommission: number }) => void;

  updateDriverStatus: (driverId: string, status: DriverStatus) => void;
  updateDriverDocument: (driverId: string, docId: string, docStatus: 'aprovado' | 'rejeitado' | 'pendente') => void;
  upsertDriver: (driver: Driver) => void;

  addClient: (client: Client) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  handPreference: 'right' | 'left' | 'center';
  setHandPreference: (pref: 'right' | 'left' | 'center') => void;
  isNewRideModalOpen: boolean;
  setNewRideModalOpen: (open: boolean) => void;
  isQuickActionSheetOpen: boolean;
  setQuickActionSheetOpen: (open: boolean) => void;
}

const emptyDomain = {
  rides: [] as Ride[],
  drivers: [] as Driver[],
  clients: [] as Client[],
  companies: [] as Company[],
  transactions: [] as FinancialTransaction[],
  notifications: [] as SystemNotification[],
  logs: [] as SystemLog[],
  audits: [] as SystemAudit[],
};

export const useAppStore = create<AppState>((set, get) => ({
  language: 'pt',
  setLanguage: (language) => set({ language }),

  theme: 'dark',
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    set({ theme: nextTheme });
  },

  activeRole: 'cliente',
  setActiveRole: (activeRole) => set({ activeRole }),
  selectedCompanyId: '',
  setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),

  financialMode: 'manual',
  setFinancialMode: (financialMode) => set({ financialMode }),

  featureFlags: {
    saasMode: true,
    stripe: true,
    comissaoAutomatica: true,
    geolocalizacao: true,
    apiPublica: true,
    logsAvancados: true,
    notificacoesPush: true,
    moduloClientes: true,
    moduloMotoristas: true,
    relatoriosFinanceiros: true,
    auditoriaSistema: true,
  },
  toggleFeatureFlag: (flagKey) =>
    set((state) => ({
      featureFlags: { ...state.featureFlags, [flagKey]: !state.featureFlags[flagKey] },
    })),

  ...emptyDomain,
  dataLoaded: false,
  dataLoading: false,
  dataError: null,

  setRides: (rides) => set({ rides }),
  setDrivers: (drivers) => set({ drivers }),
  setClients: (clients) => set({ clients }),
  setCompanies: (companies) => set({ companies }),
  setTransactions: (transactions) => set({ transactions }),
  setNotifications: (notifications) => set({ notifications }),
  setLogs: (logs) => set({ logs }),
  setAudits: (audits) => set({ audits }),
  setDataMeta: (meta) =>
    set({
      dataLoaded: meta.loaded ?? get().dataLoaded,
      dataLoading: meta.loading ?? get().dataLoading,
      dataError: meta.error !== undefined ? meta.error : get().dataError,
    }),
  resetDomainData: () => set({ ...emptyDomain, dataLoaded: false, dataError: null }),

  upsertRide: (ride) =>
    set((state) => {
      const idx = state.rides.findIndex((r) => r.id === ride.id);
      if (idx < 0) return { rides: [ride, ...state.rides] };
      const rides = [...state.rides];
      rides[idx] = ride;
      return { rides };
    }),

  updateRideFinancials: (rideId, values) =>
    set((state) => ({
      rides: state.rides.map((r) =>
        r.id === rideId
          ? {
              ...r,
              grossValue: values.grossValue,
              driverNet: values.driverNet,
              platformCommission: values.platformCommission,
              manualOverrideNotes: 'Valores atualizados manualmente',
            }
          : r,
      ),
    })),

  updateDriverStatus: (driverId, status) =>
    set((state) => ({
      drivers: state.drivers.map((d) => (d.id === driverId ? { ...d, status } : d)),
    })),

  updateDriverDocument: (driverId, docId, docStatus) =>
    set((state) => ({
      drivers: state.drivers.map((drv) => {
        if (drv.id !== driverId) return drv;
        const documents = drv.documents.map((doc) =>
          doc.id === docId ? { ...doc, status: docStatus } : doc,
        );
        const allApproved = documents.every((d) => d.status === 'aprovado');
        return {
          ...drv,
          documents,
          status: allApproved ? ('ativo' as DriverStatus) : drv.status,
        };
      }),
    })),

  upsertDriver: (driver) =>
    set((state) => {
      const idx = state.drivers.findIndex((d) => d.id === driver.id);
      if (idx < 0) return { drivers: [driver, ...state.drivers] };
      const drivers = [...state.drivers];
      drivers[idx] = driver;
      return { drivers };
    }),

  addClient: (client) => set((state) => ({ clients: [client, ...state.clients] })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  handPreference: 'right',
  setHandPreference: (handPreference) => set({ handPreference }),
  isNewRideModalOpen: false,
  setNewRideModalOpen: (isNewRideModalOpen) => set({ isNewRideModalOpen }),
  isQuickActionSheetOpen: false,
  setQuickActionSheetOpen: (isQuickActionSheetOpen) => set({ isQuickActionSheetOpen }),
}));
