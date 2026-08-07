export type UserRole = 'admin' | 'empresa' | 'motorista' | 'cliente';

export type FinancialMode = 'stripe' | 'manual';

export type RideStatus = 'pendente' | 'atribuida' | 'em_andamento' | 'concluida' | 'cancelada';

export type DriverStatus = 'ativo' | 'em_aprovacao' | 'bloqueado' | 'indisponivel';

export type ClientStatus = 'ativo' | 'suspenso' | 'vip';

export type CompanyTier = 'starter' | 'pro' | 'enterprise';

export type PaymentStatus = 'pago' | 'pendente' | 'estornado' | 'falhou';

export interface LocationPoint {
  address: string;
  lat: number;
  lng: number;
  city: string;
  neighborhood: string;
}

export interface Ride {
  id: string;
  code: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAvatar?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverAvatar?: string;
  driverVehicle?: string;
  companyId: string;
  companyName: string;
  origin: LocationPoint;
  destination: LocationPoint;
  distanceKm: number;
  durationMin: number;
  status: RideStatus;
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  
  // Financial breakdown
  grossValue: number;
  stripeFee: number;
  platformCommission: number; // e.g. 15%
  companyCut: number; // e.g. 10%
  driverNet: number; // calculated remaining
  paymentMethod: 'credit_card' | 'pix' | 'faturado' | 'dinheiro';
  paymentStatus: 'pago' | 'pendente' | 'estornado' | 'falhou';
  stripeWebhookReceived?: boolean;
  manualOverrideNotes?: string;
  rating?: number;
  notes?: string;
}

export interface DriverDocument {
  id: string;
  name: string; // e.g., 'CNH', 'CRLV', 'Antecedentes Criminais', 'Vistoria Veicular'
  status: 'aprovado' | 'pendente' | 'rejeitado' | 'vencido';
  uploadedAt: string;
  expiresAt: string;
  fileUrl?: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  companyId: string;
  companyName: string;
  primaryCompanyId?: string;
  previousPrimaryCompanyId?: string;
  previousPrimaryCompanyName?: string;
  providerSwitchPending?: boolean;
  status: DriverStatus;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  pendingBalance: number;
  documents: DriverDocument[];
  joinedAt: string;
  city: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  companyId?: string; // Optional if linked to corporate account
  companyName?: string;
  status: ClientStatus;
  totalRides: number;
  totalSpent: number;
  rating: number;
  createdAt: string;
  favoriteAddresses: string[];
}

export interface CompanyCollaborator {
  id: string;
  name: string;
  email: string;
  role: 'Dono' | 'Gerente de Frota' | 'Financeiro' | 'Atendimento';
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  logo: string;
  tier: CompanyTier;
  activeDrivers: number;
  totalRides: number;
  monthlyRevenue: number;
  commissionRate: number; // % company retains
  collaborators: CompanyCollaborator[];
  joinedAt: string;
}

export interface FinancialTransaction {
  id: string;
  code: string;
  rideId?: string;
  type: 'corrida' | 'repasse' | 'comissao' | 'estorno' | 'taxa_stripe';
  amount: number;
  grossValue?: number;
  platformFee?: number;
  companyFee?: number;
  driverFee?: number;
  stripeFee?: number;
  status: 'confirmado' | 'pendente' | 'processando' | 'falhou';
  paymentMode: FinancialMode;
  sender: string;
  recipient: string;
  createdAt: string;
  description: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'security';
  category: 'corrida' | 'financeiro' | 'motorista' | 'auth' | 'stripe' | 'sistema';
  message: string;
  actor: string;
  role: UserRole;
  ip: string;
  details?: Record<string, any>;
}

export interface SystemAudit {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  role: UserRole;
  targetResource: string;
  previousValue?: string;
  newValue?: string;
  ip: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: 'corrida' | 'financeiro' | 'motorista' | 'sistema' | 'seguranca';
  read: boolean;
  link?: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface FeatureFlags {
  saasMode: boolean;
  stripe: boolean;
  comissaoAutomatica: boolean;
  geolocalizacao: boolean;
  apiPublica: boolean;
  logsAvancados: boolean;
  notificacoesPush: boolean;
  moduloClientes: boolean;
  moduloMotoristas: boolean;
  relatoriosFinanceiros: boolean;
  auditoriaSistema: boolean;
}
