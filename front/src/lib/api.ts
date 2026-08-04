const TOKEN_KEY = 'kinito_api_token';
const USER_KEY = 'kinito_api_user';
const COMPANY_KEY = 'kinito_api_company_id';

export type ApiUser = {
  id: number | string;
  name: string;
  email: string;
  phone?: string | null;
  mustChangePassword?: boolean;
  roles?: string[];
  companies?: { id: number | string; name: string }[];
  ownedCompanies?: { id: number | string; name: string }[];
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

export function getStoredApiUser(): ApiUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiUser;
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
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  const fromUser = Number(user.ownedCompanies?.[0]?.id ?? user.companies?.[0]?.id ?? 0);
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

  const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      (data as { message?: string }).message ||
        (data as { error?: string }).error ||
        `HTTP ${res.status}`,
    ) as Error & { code?: string; status?: number };
    err.code = (data as { code?: string }).code;
    err.status = res.status;
    throw err;
  }

  return data as T;
}

export async function apiLogin(login: string, password: string): Promise<{ token: string; user: ApiUser }> {
  const data = await apiFetch<{ token: string; user: ApiUser }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password, device_name: 'kinito-web' }),
  });
  setApiSession(data.token, data.user);
  return data;
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
  const token = getApiToken();
  if (token) setApiSession(token, data.user);
  return data.user;
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

export async function fetchProviders(): Promise<{ id: number; name: string }[]> {
  const data = await apiFetch<{ data?: { id: number | string; name: string }[] } | { id: number | string; name: string }[]>(
    '/api/v1/fornecedores',
  );
  const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return rows.map((c) => ({ id: Number(c.id), name: c.name })).filter((c) => c.id > 0);
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
