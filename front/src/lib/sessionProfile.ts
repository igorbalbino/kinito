import { roleFromApi, rolesFromApi } from './mappers';
import { getStoredApiUser, listSessionCompanies, sanitizePersonName } from './api';
import type { UserRole } from '../types';

const ROLE_BADGES: Record<UserRole, string> = {
  admin: 'Admin',
  empresa: 'Empresa',
  motorista: 'Motorista',
  cliente: 'Cliente',
};

const ROLE_TITLES: Record<UserRole, string> = {
  admin: 'Administrador do Sistema',
  empresa: 'Gestor da Empresa',
  motorista: 'Motorista Parceiro',
  cliente: 'Cliente',
};

export const ROLE_LABELS: Record<UserRole, { label: string; color: string }> = {
  admin: {
    label: 'Administrador',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  empresa: {
    label: 'Empresa',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  motorista: {
    label: 'Motorista',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  cliente: {
    label: 'Cliente',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
};

export function sessionDisplayProfile(activeRole?: UserRole) {
  const user = getStoredApiUser();
  const role = activeRole ?? (user ? roleFromApi(user.roles) : 'cliente');
  const companies = listSessionCompanies(user).map((c) => ({
    ...c,
    name: sanitizePersonName(c.name, 'Empresa'),
  }));
  const companyHint = companies[0]?.name;
  const roles = rolesFromApi(user?.roles);
  const emailFallback = user?.email?.includes('@') ? user.email.split('@')[0]! : 'Usuário';

  return {
    name: sanitizePersonName(user?.name, emailFallback),
    email: user?.email || '',
    badge: companyHint && role === 'empresa' ? companyHint : ROLE_BADGES[role],
    roleTitle: ROLE_TITLES[role],
    role,
    roles: roles.length ? roles : ([role] as UserRole[]),
    companies,
  };
}

export function unwrapResource<T extends Record<string, unknown>>(payload: unknown): T {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Resposta vazia da API');
  }
  const obj = payload as Record<string, unknown>;
  if (obj.ride && typeof obj.ride === 'object') {
    const ride = obj.ride as Record<string, unknown>;
    if (ride.data && typeof ride.data === 'object' && !Array.isArray(ride.data)) {
      return ride.data as T;
    }
    return ride as T;
  }
  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    return obj.data as T;
  }
  return obj as T;
}
