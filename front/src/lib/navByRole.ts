import type { UserRole } from '../types';

/** Routes each role may open in the authenticated shell. */
export const ROUTES_BY_ROLE: Record<UserRole, readonly string[]> = {
  cliente: [
    '/dashboard',
    '/corridas',
    '/financeiro',
    '/notificacoes',
    '/configuracoes',
    '/fornecedores',
    '/perfil',
  ],
  motorista: [
    '/dashboard',
    '/corridas',
    '/financeiro',
    '/notificacoes',
    '/configuracoes',
    '/fornecedores',
    '/perfil',
  ],
  empresa: [
    '/dashboard',
    '/corridas',
    '/clientes',
    '/motoristas',
    '/empresas',
    '/financeiro',
    '/relatorios',
    '/notificacoes',
    '/configuracoes',
    '/perfil',
  ],
  admin: [
    '/dashboard',
    '/corridas',
    '/clientes',
    '/motoristas',
    '/empresas',
    '/financeiro',
    '/relatorios',
    '/logs',
    '/notificacoes',
    '/configuracoes',
    '/perfil',
  ],
};

export function canAccessRoute(role: UserRole, path: string): boolean {
  const allowed = ROUTES_BY_ROLE[role] ?? ROUTES_BY_ROLE.cliente;
  const normalized = path.split('?')[0] || path;
  return allowed.some((route) => normalized === route || normalized.startsWith(`${route}/`));
}

export function isFleetOperator(role: UserRole): boolean {
  return role === 'admin' || role === 'empresa';
}

export function isClientRole(role: UserRole): boolean {
  return role === 'cliente';
}
