import { create } from 'zustand';
import {
  MOCK_AUDITS,
  MOCK_CLIENTS,
  MOCK_COMPANIES,
  MOCK_DRIVERS,
  MOCK_LOGS,
  MOCK_NOTIFICATIONS,
  MOCK_RIDES,
  MOCK_TRANSACTIONS,
} from '../data/mockData';
import { Language, translations } from '../i18n/translations';
import {
  Client,
  Company,
  Driver,
  DriverStatus,
  FeatureFlags,
  FinancialMode,
  FinancialTransaction,
  Ride,
  RideStatus,
  SystemAudit,
  SystemLog,
  SystemNotification,
  UserRole,
} from '../types';

interface AppState {
  // i18n Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  // Role / Active Profile
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
  selectedDriverId: string;
  setSelectedDriverId: (id: string) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;

  // Financial Mode
  financialMode: FinancialMode;
  setFinancialMode: (mode: FinancialMode) => void;

  // Feature Flags
  featureFlags: FeatureFlags;
  toggleFeatureFlag: (flagKey: keyof FeatureFlags) => void;

  // Data Collections
  rides: Ride[];
  drivers: Driver[];
  clients: Client[];
  companies: Company[];
  transactions: FinancialTransaction[];
  notifications: SystemNotification[];
  logs: SystemLog[];
  audits: SystemAudit[];

  // Data Actions
  addRide: (rideData: Omit<Ride, 'id' | 'code' | 'requestedAt'>) => void;
  updateRideStatus: (rideId: string, status: RideStatus, driverId?: string, reason?: string) => void;
  updateRideFinancials: (rideId: string, values: { grossValue: number; driverNet: number; platformCommission: number }) => void;
  cancelRide: (rideId: string, reason: string) => void;

  updateDriverStatus: (driverId: string, status: DriverStatus) => void;
  updateDriverDocument: (driverId: string, docId: string, docStatus: 'aprovado' | 'rejeitado' | 'pendente') => void;

  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'totalRides' | 'totalSpent' | 'rating'>) => void;
  updateClientStatus: (clientId: string, status: Client['status']) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;

  // UI State
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;

  // Ergonomics & One-Handed Mode
  handPreference: 'right' | 'left' | 'center';
  setHandPreference: (pref: 'right' | 'left' | 'center') => void;
  isNewRideModalOpen: boolean;
  setNewRideModalOpen: (open: boolean) => void;
  isQuickActionSheetOpen: boolean;
  setQuickActionSheetOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // i18n Language
  language: 'pt',
  setLanguage: (language) => set({ language }),

  // Theme
  theme: 'dark',
  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: nextTheme });
  },

  // Role Profile
  activeRole: 'admin',
  setActiveRole: (activeRole) => set({ activeRole }),
  selectedCompanyId: MOCK_COMPANIES[0].id,
  setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),
  selectedDriverId: MOCK_DRIVERS[0].id,
  setSelectedDriverId: (id) => set({ selectedDriverId: id }),
  selectedClientId: MOCK_CLIENTS[0].id,
  setSelectedClientId: (id) => set({ selectedClientId: id }),

  // Financial Mode
  financialMode: 'stripe',
  setFinancialMode: (financialMode) => {
    // Log audit action
    const newAudit: SystemAudit = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'TOGGLE_FINANCIAL_MODE',
      user: 'admin@kinito.test',
      role: get().activeRole,
      targetResource: 'FINANCIAL_CONFIG',
      previousValue: get().financialMode,
      newValue: financialMode,
      ip: '201.82.14.99'
    };

    const newLog: SystemLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'security',
      category: 'stripe',
      message: `Modo de processamento financeiro alternado para ${financialMode === 'stripe' ? 'Stripe (Automático)' : 'Manual (Sinalizado)'}`,
      actor: 'Administrador Master',
      role: get().activeRole,
      ip: '201.82.14.99'
    };

    set((state) => ({
      financialMode,
      audits: [newAudit, ...state.audits],
      logs: [newLog, ...state.logs]
    }));
  },

  // Feature Flags
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
  toggleFeatureFlag: (flagKey) => set((state) => {
    const updatedFlags = { ...state.featureFlags, [flagKey]: !state.featureFlags[flagKey] };
    return { featureFlags: updatedFlags };
  }),

  // Collections
  rides: MOCK_RIDES,
  drivers: MOCK_DRIVERS,
  clients: MOCK_CLIENTS,
  companies: MOCK_COMPANIES,
  transactions: MOCK_TRANSACTIONS,
  notifications: MOCK_NOTIFICATIONS,
  logs: MOCK_LOGS,
  audits: MOCK_AUDITS,

  // Ride Actions
  addRide: (rideData) => set((state) => {
    const id = `rd-${Date.now()}`;
    const code = `COR-${100000 + state.rides.length}`;
    const requestedAt = new Date().toISOString();
    
    const newRide: Ride = {
      ...rideData,
      id,
      code,
      requestedAt,
    };

    const newLog: SystemLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      category: 'corrida',
      message: `Nova corrida ${code} solicitada por ${newRide.clientName}`,
      actor: newRide.clientName,
      role: 'cliente',
      ip: '177.13.44.12'
    };

    return {
      rides: [newRide, ...state.rides],
      logs: [newLog, ...state.logs]
    };
  }),

  updateRideStatus: (rideId, status, driverId, reason) => set((state) => {
    let targetDriverName = undefined;
    let targetDriverVehicle = undefined;

    if (driverId) {
      const drv = state.drivers.find(d => d.id === driverId);
      if (drv) {
        targetDriverName = drv.name;
        targetDriverVehicle = `${drv.vehicleModel} (${drv.vehiclePlate})`;
      }
    }

    const updatedRides = state.rides.map((ride) => {
      if (ride.id !== rideId) return ride;

      const now = new Date().toISOString();
      return {
        ...ride,
        status,
        driverId: driverId || ride.driverId,
        driverName: targetDriverName || ride.driverName,
        driverVehicle: targetDriverVehicle || ride.driverVehicle,
        startedAt: status === 'em_andamento' ? now : ride.startedAt,
        completedAt: status === 'concluida' ? now : ride.completedAt,
        cancelledAt: status === 'cancelada' ? now : ride.cancelledAt,
        cancellationReason: reason || ride.cancellationReason,
        paymentStatus: status === 'concluida' ? 'pago' : status === 'cancelada' ? 'estornado' : ride.paymentStatus
      };
    });

    return { rides: updatedRides };
  }),

  updateRideFinancials: (rideId, values) => set((state) => {
    const updatedRides = state.rides.map((r) => {
      if (r.id !== rideId) return r;
      return {
        ...r,
        grossValue: values.grossValue,
        driverNet: values.driverNet,
        platformCommission: values.platformCommission,
        manualOverrideNotes: 'Valores atualizados manualmente no modo de processamento Manual'
      };
    });
    return { rides: updatedRides };
  }),

  cancelRide: (rideId, reason) => set((state) => {
    const updatedRides = state.rides.map((r) => {
      if (r.id !== rideId) return r;
      return {
        ...r,
        status: 'cancelada' as RideStatus,
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
        paymentStatus: 'estornado' as const
      };
    });
    return { rides: updatedRides };
  }),

  // Driver Actions
  updateDriverStatus: (driverId, status) => set((state) => {
    const updatedDrivers = state.drivers.map((d) => d.id === driverId ? { ...d, status } : d);
    return { drivers: updatedDrivers };
  }),

  updateDriverDocument: (driverId, docId, docStatus) => set((state) => {
    const updatedDrivers = state.drivers.map((drv) => {
      if (drv.id !== driverId) return drv;
      const updatedDocs = drv.documents.map((doc) => doc.id === docId ? { ...doc, status: docStatus } : doc);
      const allApproved = updatedDocs.every(d => d.status === 'aprovado');
      return {
        ...drv,
        documents: updatedDocs,
        status: allApproved ? ('ativo' as DriverStatus) : drv.status
      };
    });
    return { drivers: updatedDrivers };
  }),

  // Client Actions
  addClient: (clientData) => set((state) => {
    const id = `cli-${Date.now()}`;
    const newClient: Client = {
      ...clientData,
      id,
      createdAt: new Date().toISOString(),
      totalRides: 0,
      totalSpent: 0,
      rating: 5.0,
      status: 'ativo'
    };
    return { clients: [newClient, ...state.clients] };
  }),

  updateClientStatus: (clientId, status) => set((state) => {
    const updatedClients = state.clients.map((c) => c.id === clientId ? { ...c, status } : c);
    return { clients: updatedClients };
  }),

  // Notifications
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
  })),

  markAllNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true }))
  })),

  addNotification: (notification) => set((state) => {
    const newNotif: SystemNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    return { notifications: [newNotif, ...state.notifications] };
  }),

  // UI
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  globalSearchQuery: '',
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),

  // Ergonomics & One-Handed Mobile Controls
  handPreference: 'right',
  setHandPreference: (handPreference) => set({ handPreference }),
  isNewRideModalOpen: false,
  setNewRideModalOpen: (isNewRideModalOpen) => set({ isNewRideModalOpen }),
  isQuickActionSheetOpen: false,
  setQuickActionSheetOpen: (isQuickActionSheetOpen) => set({ isQuickActionSheetOpen }),
}));
