/** Status mappers: API enums → front UI types */

import type { ClientStatus, DriverStatus, PaymentStatus, RideStatus, UserRole } from '../types';

export function mapRideStatus(api: string | undefined): RideStatus {
  switch ((api || '').toUpperCase()) {
    case 'ACEITA':
    case 'AGENDADA':
      return 'atribuida';
    case 'EM_ANDAMENTO':
      return 'em_andamento';
    case 'FINALIZADA':
      return 'concluida';
    case 'CANCELADA':
      return 'cancelada';
    default:
      return 'pendente';
  }
}

export function mapDriverStatus(api: string | undefined): DriverStatus {
  switch ((api || '').toUpperCase()) {
    case 'ATIVO':
      return 'ativo';
    case 'BLOQUEADO':
      return 'bloqueado';
    case 'INDISPONIVEL':
      return 'indisponivel';
    default:
      return 'em_aprovacao';
  }
}

export function mapClientStatus(api: string | undefined): ClientStatus {
  const s = (api || 'ativo').toLowerCase();
  if (s === 'suspenso' || s === 'vip') return s;
  return 'ativo';
}

export function mapPaymentStatus(api: string | undefined): PaymentStatus {
  switch ((api || '').toUpperCase()) {
    case 'PAGO':
    case 'RECEBIDO':
    case 'REPASSADO':
      return 'pago';
    case 'ESTORNADO':
      return 'estornado';
    default:
      return 'pendente';
  }
}

export function rolesFromApi(roles: string[] | undefined): UserRole[] {
  const upper = (roles || []).map((r) => r.toUpperCase());
  const out: UserRole[] = [];
  if (upper.includes('ADMIN')) out.push('admin');
  if (upper.includes('EMPRESA')) out.push('empresa');
  if (upper.includes('MOTORISTA')) out.push('motorista');
  if (upper.includes('CLIENTE')) out.push('cliente');
  return out;
}

export function roleFromApi(roles: string[] | undefined): UserRole {
  return rolesFromApi(roles)[0] ?? 'cliente';
}
