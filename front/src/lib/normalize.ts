import {
  Client,
  Company,
  Driver,
  FinancialTransaction,
  Ride,
  SystemAudit,
  SystemLog,
  SystemNotification,
} from '../types';
import {
  mapClientStatus,
  mapDriverStatus,
  mapPaymentStatus,
  mapRideStatus,
} from './mappers';
import { sanitizePersonName } from './api';

export function normalizeRide(raw: Record<string, unknown>): Ride {
  const paymentMethod = String(raw.paymentMethod || 'pix') as Ride['paymentMethod'];
  return {
    id: String(raw.id),
    code: String(raw.code || ''),
    clientId: String(raw.clientId || ''),
    clientName: sanitizePersonName(raw.clientName, 'Cliente'),
    clientPhone: String(raw.clientPhone || ''),
    clientAvatar: raw.clientAvatar ? String(raw.clientAvatar) : undefined,
    driverId: raw.driverId ? String(raw.driverId) : undefined,
    driverName: raw.driverName ? sanitizePersonName(raw.driverName, 'Motorista') : undefined,
    driverPhone: raw.driverPhone ? String(raw.driverPhone) : undefined,
    driverAvatar: raw.driverAvatar ? String(raw.driverAvatar) : undefined,
    driverVehicle: raw.driverVehicle ? String(raw.driverVehicle) : undefined,
    companyId: String(raw.companyId || ''),
    companyName: String(raw.companyName || ''),
    origin: (raw.origin as Ride['origin']) || {
      address: '',
      lat: 0,
      lng: 0,
      city: '',
      neighborhood: '',
    },
    destination: (raw.destination as Ride['destination']) || {
      address: '',
      lat: 0,
      lng: 0,
      city: '',
      neighborhood: '',
    },
    distanceKm: Number(raw.distanceKm || 0),
    durationMin: Number(raw.durationMin || 0),
    status: mapRideStatus(String(raw.status || '')),
    requestedAt: String(raw.requestedAt || new Date().toISOString()),
    startedAt: raw.startedAt ? String(raw.startedAt) : undefined,
    completedAt: raw.completedAt ? String(raw.completedAt) : undefined,
    cancelledAt: raw.cancelledAt ? String(raw.cancelledAt) : undefined,
    cancellationReason: raw.cancellationReason ? String(raw.cancellationReason) : undefined,
    grossValue: Number(raw.grossValue || 0),
    stripeFee: Number(raw.stripeFee || 0),
    platformCommission: Number(raw.platformCommission || 0),
    companyCut: Number(raw.companyCut || 0),
    driverNet: Number(raw.driverNet || 0),
    paymentMethod: ['credit_card', 'pix', 'faturado', 'dinheiro'].includes(paymentMethod)
      ? paymentMethod
      : 'pix',
    paymentStatus: mapPaymentStatus(String(raw.financialStatus || raw.paymentStatus || '')),
    stripeWebhookReceived: Boolean(raw.stripeWebhookReceived),
    manualOverrideNotes: raw.manualOverrideNotes ? String(raw.manualOverrideNotes) : undefined,
    rating: raw.rating != null ? Number(raw.rating) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
  };
}

export function normalizeClient(raw: Record<string, unknown>): Client {
  const name = sanitizePersonName(raw.name, 'Cliente');
  return {
    id: String(raw.id),
    name,
    email: String(raw.email || ''),
    phone: String(raw.phone || ''),
    avatar: String(raw.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name || raw.id}`),
    companyId: raw.companyId ? String(raw.companyId) : undefined,
    companyName: raw.companyName ? sanitizePersonName(raw.companyName, 'Empresa') : undefined,
    status: mapClientStatus(String(raw.status || 'ativo')),
    totalRides: Number(raw.totalRides || 0),
    totalSpent: Number(raw.totalSpent || 0),
    rating: Number(raw.rating || 5),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    favoriteAddresses: Array.isArray(raw.favoriteAddresses)
      ? (raw.favoriteAddresses as string[])
      : [],
  };
}

export function normalizeDriver(raw: Record<string, unknown>): Driver {
  const docs = Array.isArray(raw.documents) ? (raw.documents as Record<string, unknown>[]) : [];
  const name = sanitizePersonName(raw.name, 'Motorista');
  return {
    id: String(raw.id),
    name,
    email: String(raw.email || ''),
    phone: String(raw.phone || ''),
    avatar: String(raw.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name || raw.id}`),
    companyId: String(raw.companyId || raw.primaryCompanyId || ''),
    companyName: sanitizePersonName(raw.companyName, 'Empresa'),
    primaryCompanyId: raw.primaryCompanyId ? String(raw.primaryCompanyId) : undefined,
    previousPrimaryCompanyId: raw.previousPrimaryCompanyId ? String(raw.previousPrimaryCompanyId) : undefined,
    previousPrimaryCompanyName: raw.previousPrimaryCompanyName
      ? sanitizePersonName(raw.previousPrimaryCompanyName, '')
      : undefined,
    providerSwitchPending: Boolean(raw.providerSwitchPending),
    status: mapDriverStatus(String(raw.status || '')),
    vehicleModel: String(raw.vehicleModel || ''),
    vehiclePlate: String(raw.vehiclePlate || ''),
    vehicleColor: String(raw.vehicleColor || ''),
    rating: Number(raw.rating || 5),
    totalRides: Number(raw.totalRides || 0),
    totalEarnings: Number(raw.totalEarnings || 0),
    pendingBalance: Number(raw.pendingBalance || 0),
    documents: docs.map((d) => ({
      id: String(d.id),
      name: String(d.name || d.type || 'Documento'),
      status: (String(d.status || 'pendente').toLowerCase() as Driver['documents'][0]['status']),
      uploadedAt: String(d.uploadedAt || d.createdAt || new Date().toISOString()),
      expiresAt: String(d.expiresAt || ''),
      fileUrl: d.fileUrl ? String(d.fileUrl) : undefined,
    })),
    joinedAt: String(raw.joinedAt || raw.createdAt || new Date().toISOString()),
    city: String(raw.city || ''),
  };
}

export function normalizeCompany(raw: Record<string, unknown>): Company {
  return {
    id: String(raw.id),
    name: sanitizePersonName(raw.name, 'Empresa'),
    cnpj: String(raw.cnpj || ''),
    email: String(raw.email || ''),
    phone: String(raw.phone || ''),
    logo: String(raw.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${raw.id}`),
    tier: (String(raw.tier || 'starter') as Company['tier']),
    activeDrivers: Number(raw.activeDrivers || 0),
    totalRides: Number(raw.totalRides || 0),
    monthlyRevenue: Number(raw.monthlyRevenue || 0),
    commissionRate: Number(raw.commissionRate || 10),
    joinedAt: String(raw.joinedAt || raw.createdAt || new Date().toISOString()),
    collaborators: Array.isArray(raw.collaborators)
      ? (raw.collaborators as Company['collaborators']).map((col) => ({
          ...col,
          name: sanitizePersonName(col.name, 'Colaborador'),
        }))
      : [],
  };
}

export function normalizeTransaction(raw: Record<string, unknown>): FinancialTransaction {
  const statusRaw = String(raw.status || '').toLowerCase();
  let status: FinancialTransaction['status'] = 'pendente';
  if (['confirmado', 'pago', 'recebido', 'repassado'].some((s) => statusRaw.includes(s))) {
    status = 'confirmado';
  } else if (statusRaw.includes('process')) {
    status = 'processando';
  } else if (statusRaw.includes('falh') || statusRaw.includes('fail')) {
    status = 'falhou';
  }

  return {
    id: String(raw.id),
    code: String(raw.code || raw.id || ''),
    rideId: raw.rideId ? String(raw.rideId) : undefined,
    type: 'corrida',
    amount: Number(raw.amount || raw.grossValue || 0),
    grossValue: Number(raw.grossValue || raw.amount || 0),
    status,
    paymentMode: 'manual',
    sender: String(raw.sender || raw.companyName || ''),
    recipient: String(raw.recipient || raw.driverName || ''),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    description: String(raw.description || raw.notes || ''),
  };
}

function redactSecrets(text: string): string {
  return text
    .replace(/senha\s*tempor[aá]ria\s*:\s*\S+/gi, 'Senha temporária: [ocultada]')
    .replace(/temporary\s*password\s*:\s*\S+/gi, 'Temporary password: [redacted]')
    .replace(/\b(?:senha|password)\s*[:=]\s*\S+/gi, 'senha: [ocultada]');
}

export function normalizeNotification(raw: Record<string, unknown>): SystemNotification {
  const meta = raw.meta && typeof raw.meta === 'object' ? (raw.meta as SystemNotification['meta']) : undefined;
  return {
    id: String(raw.id),
    title: String(raw.title || ''),
    message: redactSecrets(String(raw.message || raw.body || '')),
    type: (String(raw.type || 'info') as SystemNotification['type']),
    category: (String(raw.category || 'sistema') as SystemNotification['category']),
    timestamp: String(raw.timestamp || raw.createdAt || new Date().toISOString()),
    read: Boolean(raw.read),
    link: raw.link != null ? String(raw.link) : undefined,
    meta,
  };
}

export function normalizeLog(raw: Record<string, unknown>): SystemLog {
  return {
    id: String(raw.id),
    timestamp: String(raw.timestamp || raw.occurredAt || raw.createdAt || new Date().toISOString()),
    level: 'info',
    category: 'sistema',
    message: redactSecrets(String(raw.message || raw.status || JSON.stringify(raw))),
    actor: String(raw.actor || raw.clientName || raw.driverName || 'sistema'),
    role: 'admin',
    ip: String(raw.ip || ''),
  };
}

export function normalizeAudit(raw: Record<string, unknown>): SystemAudit {
  return {
    id: String(raw.id),
    timestamp: String(raw.timestamp || raw.createdAt || new Date().toISOString()),
    action: String(raw.action || ''),
    user: String(raw.user || raw.userName || raw.actor || ''),
    role: 'admin',
    targetResource: String(raw.targetResource || raw.auditableType || ''),
    previousValue: raw.previousValue != null ? String(raw.previousValue) : undefined,
    newValue: raw.newValue != null ? String(raw.newValue) : undefined,
    ip: String(raw.ip || ''),
  };
}
