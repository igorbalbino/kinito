const TOKEN_KEY = 'kinito_api_token';
const USER_KEY = 'kinito_api_user';
const COMPANY_KEY = 'kinito_api_company_id';
export const ACTIVE_ROLE_KEY = 'kinito_active_role';

export type ApiUser = {
  id: number | string;
  name: string;
  email: string;
  phone?: string | null;
  mustChangePassword?: boolean;
  roles?: string[];
  companies?: { id: number | string; name: string }[];
  ownedCompanies?: { id: number | string; name: string }[];
  client?: {
    id?: number | string;
    companyId?: string | null;
    companyName?: string | null;
    preferences?: {
      defaultProviderMode?: string;
      defaultCompanyId?: string | null;
    };
  };
  driver?: {
    id?: number | string;
    companyId?: string | null;
    companyName?: string | null;
    primaryCompanyId?: string | null;
    previousPrimaryCompanyId?: string | null;
    previousPrimaryCompanyName?: string | null;
    providerSwitchPending?: boolean;
    providerMode?: string;
  };
};

export type ApiPlan = {
  id: number | string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  billingPeriod?: string;
  features?: string[] | Record<string, unknown>;
};

export type SubscriptionStatusPayload = {
  has_access: boolean;
  trial_used: boolean;
  trial_used_at?: string | null;
  subscription?: {
    id: number;
    status: string;
    plan_id?: number;
    trial_ends_at?: string | null;
    ends_at?: string | null;
    plan?: ApiPlan;
  } | null;
  referral?: {
    referral_code?: string | null;
    share_url?: string | null;
    pending?: number;
    rewarded?: number;
    months_earned?: number;
    recent?: Array<{
      id: number;
      status: string;
      referred_company?: string | null;
      rewarded_at?: string | null;
      created_at?: string | null;
    }>;
  };
};

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
}

export function isApiConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}

export function getApiToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

const SECRET_USER_KEYS = [
  'password',
  'password_confirmation',
  'current_password',
  'temporary_password',
  'temporaryPassword',
  'plain_password',
  'plainPassword',
] as const;

/** Detects autofill/password tokens accidentally glued into name fields. */
function looksLikePasswordToken(token: string): boolean {
  if (token.length < 4 || /\s/.test(token)) return false;
  if (/^(password|senha|admin|root|12345678?|qwerty|changeme|secret)$/i.test(token)) {
    return true;
  }
  if (token.length < 6) return false;
  const hasLetter = /[A-Za-zÀ-ÿ]/.test(token);
  const hasDigit = /\d/.test(token);
  const hasSpecial = /[^A-Za-zÀ-ÿ0-9]/.test(token);
  // all-lowercase long token often is a dumped password (e.g. "minhasenha")
  if (/^[a-z]{8,}$/.test(token)) return true;
  return (hasLetter && hasDigit) || (hasLetter && hasSpecial) || (hasDigit && hasSpecial);
}

/**
 * Cleans person/company display names polluted by browser autofill
 * (password appended on a new line or as a trailing token).
 */
export function sanitizePersonName(value: unknown, fallback = 'Usuário'): string {
  let name = String(value ?? '').replace(/\u0000/g, '').trim();
  if (!name) return fallback;

  // Password managers often dump the secret on the next line of the same field.
  name = name.split(/\r?\n|\t| {2,}/)[0]?.trim() || fallback;

  const parts = name.split(/\s+/).filter(Boolean);
  while (parts.length > 1 && looksLikePasswordToken(parts[parts.length - 1]!)) {
    parts.pop();
  }
  name = parts.join(' ').trim();

  if (!name || looksLikePasswordToken(name)) {
    return fallback;
  }

  return name.slice(0, 120);
}

function sanitizeCompanyList(
  list: { id: number | string; name: string }[] | undefined,
): { id: number | string; name: string }[] | undefined {
  if (!list) return undefined;
  return list.map((c) => ({
    id: c.id,
    name: sanitizePersonName(c.name, 'Empresa'),
  }));
}

/** Never persist or expose credential fields from API payloads. */
export function sanitizeApiUser(user: ApiUser): ApiUser {
  const raw = { ...(user as ApiUser & Record<string, unknown>) };
  for (const key of SECRET_USER_KEYS) {
    delete raw[key];
  }
  const email = String(raw.email || '').trim();
  const emailFallback = email.includes('@') ? email.split('@')[0]! : 'Usuário';
  return {
    id: raw.id,
    name: sanitizePersonName(raw.name, emailFallback),
    email,
    phone: raw.phone ?? null,
    mustChangePassword: Boolean(raw.mustChangePassword),
    roles: Array.isArray(raw.roles) ? raw.roles.map(String) : undefined,
    companies: sanitizeCompanyList(raw.companies),
    ownedCompanies: sanitizeCompanyList(raw.ownedCompanies),
  };
}

export function getStoredApiUser(): ApiUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return sanitizeApiUser(JSON.parse(raw) as ApiUser);
  } catch {
    return null;
  }
}

export function getApiCompanyId(): number | null {
  const raw = localStorage.getItem(COMPANY_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function setApiSession(token: string, user: ApiUser, companyId?: number | null): void {
  const safeUser = sanitizeApiUser(user);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  const fromUser = Number(safeUser.ownedCompanies?.[0]?.id ?? safeUser.companies?.[0]?.id ?? 0);
  const resolved = companyId ?? (fromUser > 0 ? fromUser : null);
  if (resolved) {
    localStorage.setItem(COMPANY_KEY, String(resolved));
  }
}

export function setApiCompanyId(companyId: number): void {
  localStorage.setItem(COMPANY_KEY, String(companyId));
}

export function clearApiSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(COMPANY_KEY);
  localStorage.removeItem(ACTIVE_ROLE_KEY);
}

export function listSessionCompanies(user: ApiUser | null = getStoredApiUser()): { id: number; name: string }[] {
  if (!user) return [];
  const map = new Map<number, string>();
  for (const c of [...(user.ownedCompanies ?? []), ...(user.companies ?? [])]) {
    const id = Number(c.id);
    if (id > 0) map.set(id, c.name);
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }));
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error('VITE_API_URL não configurada.');
  }

  const token = getApiToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Accept', 'application/json');
  const acting = localStorage.getItem(ACTIVE_ROLE_KEY);
  if (token && acting) {
    headers.set('X-Kinito-Role', acting.toUpperCase());
  }

  const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const payload = data as {
      message?: string;
      error?: string;
      code?: string;
      email_unverified?: boolean;
      email?: string;
    };
    const err = new Error(payload.message || payload.error || `HTTP ${res.status}`) as Error & {
      code?: string;
      status?: number;
      email_unverified?: boolean;
      email?: string;
    };
    err.code = payload.code;
    err.status = res.status;
    err.email_unverified = Boolean(payload.email_unverified);
    err.email = payload.email;
    throw err;
  }

  return data as T;
}

export async function apiLogin(login: string, password: string): Promise<{ token: string; user: ApiUser }> {
  const data = await apiFetch<{ token: string; user: ApiUser }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password, device_name: 'kinito-web' }),
  });
  const user = sanitizeApiUser(data.user);
  setApiSession(data.token, user);
  return { token: data.token, user };
}

export async function changePassword(currentPassword: string, password: string): Promise<ApiUser> {
  const data = await apiFetch<{ user: ApiUser }>('/api/v1/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      password,
      password_confirmation: password,
    }),
  });
  const user = sanitizeApiUser(data.user);
  const token = getApiToken();
  if (token) setApiSession(token, user);
  return user;
}

export async function fetchPlans(): Promise<ApiPlan[]> {
  const data = await apiFetch<ApiPlan[] | { data: ApiPlan[] }>('/api/v1/plans');
  if (Array.isArray(data)) return data;
  return Array.isArray(data.data) ? data.data : [];
}

export async function fetchSubscriptionStatus(companyId: number): Promise<SubscriptionStatusPayload> {
  return apiFetch<SubscriptionStatusPayload>(`/api/v1/empresas/${companyId}/subscription`);
}

export async function subscribeCompany(
  companyId: number,
  planId: number | string,
  mode: 'trial' | 'checkout' | 'auto' = 'auto',
): Promise<{
  mode: string;
  checkout?: { checkout_url?: string; session_id?: string; driver?: string } | null;
  has_access?: boolean;
  message?: string;
}> {
  return apiFetch(`/api/v1/empresas/${companyId}/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ plan_id: planId, mode }),
  });
}

export async function fetchProviders(): Promise<
  { id: number; name: string; modeloCorridas?: string }[]
> {
  const data = await apiFetch<
    | { data?: { id: number | string; name: string; settings?: { modeloCorridas?: string } }[] }
    | { id: number | string; name: string; settings?: { modeloCorridas?: string } }[]
  >('/api/v1/fornecedores');
  const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return rows
    .map((c) => ({
      id: Number(c.id),
      name: c.name,
      modeloCorridas: c.settings?.modeloCorridas,
    }))
    .filter((c) => c.id > 0);
}

export async function fetchCompanyDetails(companyId: number): Promise<{
  id: number | string;
  name: string;
  settings?: {
    modeloCorridas?: string;
    acceptInstantRides?: boolean;
    allowScheduling?: boolean;
  };
}> {
  const data = await apiFetch<{ data?: Record<string, unknown> } | Record<string, unknown>>(
    `/api/v1/empresas/${companyId}`,
  );
  const row = (data && typeof data === 'object' && 'data' in data && data.data
    ? data.data
    : data) as Record<string, unknown>;
  return {
    id: row.id as number | string,
    name: String(row.name || ''),
    settings: row.settings as {
      modeloCorridas?: string;
      acceptInstantRides?: boolean;
      allowScheduling?: boolean;
    },
  };
}

export async function updateCompanySettings(
  companyId: number,
  payload: Record<string, unknown>,
): Promise<unknown> {
  return apiFetch(`/api/v1/empresas/${companyId}/settings`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateClientPreferencesApi(
  clientId: number | string,
  payload: { default_provider_mode?: string; default_company_id?: number | null },
): Promise<Record<string, unknown>> {
  return apiFetch(`/api/v1/clientes/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function updateDriverPreferencesApi(
  driverId: number | string,
  payload: { provider_mode?: string; primary_company_id?: number | null },
): Promise<Record<string, unknown>> {
  return apiFetch(`/api/v1/motoristas/${driverId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function switchDriverProviderApi(
  driverId: number | string,
  companyId: number,
): Promise<{ driver: Record<string, unknown>; message?: string }> {
  return apiFetch(`/api/v1/motoristas/${driverId}/switch-provider`, {
    method: 'POST',
    body: JSON.stringify({ company_id: companyId }),
  });
}

export async function revertDriverProviderApi(
  driverId: number | string,
): Promise<{ driver: Record<string, unknown>; message?: string }> {
  return apiFetch(`/api/v1/motoristas/${driverId}/revert-provider`, {
    method: 'POST',
  });
}

export type WhatsAppStatus = {
  status?: string;
  connected?: boolean;
  qr?: string | null;
  phone?: string | null;
  gateway_available?: boolean;
  error?: string;
  provider?: string;
  session_id?: string;
  whatsapp_enabled?: boolean;
  stored_connected?: boolean;
  stored_phone?: string | null;
};

export async function fetchWhatsAppStatus(companyId: number): Promise<WhatsAppStatus> {
  const data = await apiFetch<{ whatsapp: WhatsAppStatus }>(`/api/v1/empresas/${companyId}/whatsapp`);
  return data.whatsapp;
}

export async function connectWhatsApp(companyId: number): Promise<WhatsAppStatus> {
  const data = await apiFetch<{ whatsapp: WhatsAppStatus }>(
    `/api/v1/empresas/${companyId}/whatsapp/connect`,
    { method: 'POST' },
  );
  return data.whatsapp;
}

export async function disconnectWhatsApp(companyId: number): Promise<WhatsAppStatus> {
  const data = await apiFetch<{ whatsapp: WhatsAppStatus }>(
    `/api/v1/empresas/${companyId}/whatsapp`,
    { method: 'DELETE' },
  );
  return data.whatsapp;
}

export async function fetchCompanies(): Promise<{ id: number; name: string }[]> {
  const data = await apiFetch<{ data?: { id: number | string; name: string }[] }>(
    '/api/v1/empresas',
  );
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows
    .map((c) => ({ id: Number(c.id), name: c.name }))
    .filter((c) => c.id > 0);
}

function paginated<T>(data: { data?: T[] } | T[]): T[] {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
}

export async function apiRegisterPerson(payload: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'CLIENTE' | 'MOTORISTA';
  phone?: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  city?: string;
  company_id?: number;
}): Promise<{ email_verification_required?: boolean; email?: string; message?: string }> {
  clearApiSession();
  return apiFetch('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...payload, device_name: 'kinito-web' }),
  });
}

export async function apiRegisterCompany(payload: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  company_name: string;
  cnpj: string;
  company_email?: string;
  company_phone?: string;
  plan_id?: number;
  referral_code?: string;
}): Promise<{
  email_verification_required?: boolean;
  email?: string;
  message?: string;
  company?: { id: number | string; name: string };
}> {
  clearApiSession();
  return apiFetch('/api/v1/empresas/register', {
    method: 'POST',
    body: JSON.stringify({ ...payload, device_name: 'kinito-web' }),
  });
}

export async function verifyEmailApi(params: {
  id: string;
  hash: string;
  expires: string;
  signature: string;
}): Promise<{ message: string; credentials_sent?: boolean; already_verified?: boolean }> {
  const qs = new URLSearchParams({
    expires: params.expires,
    signature: params.signature,
  });
  return apiFetch(`/api/v1/auth/email/verify/${params.id}/${params.hash}?${qs.toString()}`);
}

export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  return apiFetch('/api/v1/auth/email/resend', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiLogout(): Promise<void> {
  try {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' });
  } finally {
    clearApiSession();
  }
}

export async function fetchRides(): Promise<Record<string, unknown>[]> {
  return paginated(await apiFetch('/api/v1/corridas?per_page=100'));
}

export async function fetchPlatformConfig(): Promise<{
  paymentProvider?: string;
  featureFlags?: Record<string, boolean>;
}> {
  return apiFetch('/api/v1/config');
}

export async function fetchMySpendings(): Promise<{
  items: Record<string, unknown>[];
  totalSpent: number;
  ridesCount: number;
}> {
  return apiFetch('/api/v1/financeiro/meus-gastos');
}

export async function createRide(payload: Record<string, unknown>): Promise<{ ride: Record<string, unknown> }> {
  return apiFetch('/api/v1/corridas', { method: 'POST', body: JSON.stringify(payload) });
}

export async function rideAction(
  rideId: string,
  action: 'accept' | 'start' | 'finish' | 'cancel' | 'reassign',
  body: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  return apiFetch(`/api/v1/corridas/${rideId}/${action}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchClientsList(): Promise<Record<string, unknown>[]> {
  return paginated(await apiFetch('/api/v1/clientes?per_page=100'));
}

export async function createClientApi(payload: Record<string, unknown>): Promise<{
  client: Record<string, unknown>;
  invite_pending?: boolean;
  message?: string;
}> {
  return apiFetch('/api/v1/clientes', { method: 'POST', body: JSON.stringify(payload) });
}

export async function createDriverApi(payload: Record<string, unknown>): Promise<{
  driver: Record<string, unknown>;
  invite_pending?: boolean;
  message?: string;
}> {
  return apiFetch('/api/v1/motoristas', { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchDriversList(): Promise<Record<string, unknown>[]> {
  return paginated(await apiFetch('/api/v1/motoristas?per_page=100'));
}

export async function approveDriverApi(id: string, companyId: number): Promise<Record<string, unknown>> {
  return apiFetch(`/api/v1/motoristas/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ company_id: companyId }),
  });
}

export async function blockDriverApi(id: string): Promise<Record<string, unknown>> {
  return apiFetch(`/api/v1/motoristas/${id}/block`, { method: 'POST' });
}

export async function fetchCompaniesFull(): Promise<Record<string, unknown>[]> {
  return paginated(await apiFetch('/api/v1/empresas?per_page=100'));
}

export async function fetchTransactions(): Promise<Record<string, unknown>[]> {
  return paginated(await apiFetch('/api/v1/financeiro/transactions?per_page=100'));
}

export async function fetchNotifications(): Promise<Record<string, unknown>[]> {
  return paginated(await apiFetch('/api/v1/notificacoes'));
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await apiFetch(`/api/v1/notificacoes/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsReadApi(): Promise<void> {
  await apiFetch('/api/v1/notificacoes/read-all', { method: 'POST' });
}

export async function fetchRideLogs(): Promise<Record<string, unknown>[]> {
  return paginated(await apiFetch('/api/v1/logs/rides'));
}

export async function fetchAudits(): Promise<Record<string, unknown>[]> {
  return paginated(await apiFetch('/api/v1/logs/audits?per_page=100'));
}

export async function fetchDashboard(): Promise<{
  role: string;
  metrics: Record<string, number>;
  recentRides: unknown;
}> {
  return apiFetch('/api/v1/dashboard');
}

export async function fetchConsolidatedReport(): Promise<{
  own: { summary: Record<string, number>; items: Record<string, unknown>[] };
  received: { summary: Record<string, number>; items: Record<string, unknown>[] };
  forwarded: { summary: Record<string, number>; items: Record<string, unknown>[] };
  totals: { rides: number; gross: number; companyCut: number };
}> {
  return apiFetch('/api/v1/relatorios/consolidated');
}

export async function patchRideFinance(
  rideId: string,
  payload: {
    gross_value: number;
    platform_commission?: number;
    driver_net?: number;
    company_cut?: number;
    manual_override_notes?: string;
  },
): Promise<Record<string, unknown>> {
  return apiFetch(`/api/v1/corridas/${rideId}/finance`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
