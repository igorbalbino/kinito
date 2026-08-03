import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  XCircle,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DriverStatus, PaymentStatus, RideStatus } from '../../types';

interface StatusBadgeProps {
  type: 'ride' | 'driver' | 'payment' | 'webhook' | 'stripe_feature';
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  status,
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium gap-1',
    md: 'px-2.5 py-1 text-xs font-medium gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-semibold gap-2',
  }[size];

  if (type === 'ride') {
    const s = status as RideStatus;
    switch (s) {
      case 'pendente':
        return (
          <span className={cn('inline-flex items-center rounded-full bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20', sizeClasses, className)}>
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Pendente
          </span>
        );
      case 'atribuida':
        return (
          <span className={cn('inline-flex items-center rounded-full bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20', sizeClasses, className)}>
            <Zap className="w-3.5 h-3.5 shrink-0" />
            Atribuída
          </span>
        );
      case 'em_andamento':
        return (
          <span className={cn('inline-flex items-center rounded-full bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20 animate-pulse', sizeClasses, className)}>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Em Andamento
          </span>
        );
      case 'concluida':
        return (
          <span className={cn('inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20', sizeClasses, className)}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Concluída
          </span>
        );
      case 'cancelada':
        return (
          <span className={cn('inline-flex items-center rounded-full bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20', sizeClasses, className)}>
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            Cancelada
          </span>
        );
      default:
        return null;
    }
  }

  if (type === 'driver') {
    const d = status as DriverStatus;
    switch (d) {
      case 'ativo':
        return (
          <span className={cn('inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20', sizeClasses, className)}>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Ativo
          </span>
        );
      case 'em_aprovacao':
        return (
          <span className={cn('inline-flex items-center rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20', sizeClasses, className)}>
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Em Aprovação
          </span>
        );
      case 'indisponivel':
        return (
          <span className={cn('inline-flex items-center rounded-full bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-500/20', sizeClasses, className)}>
            Indisponível
          </span>
        );
      case 'bloqueado':
        return (
          <span className={cn('inline-flex items-center rounded-full bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20', sizeClasses, className)}>
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            Bloqueado
          </span>
        );
    }
  }

  if (type === 'payment') {
    switch (status) {
      case 'pago':
      case 'confirmado':
        return (
          <span className={cn('inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20', sizeClasses, className)}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Pago
          </span>
        );
      case 'pendente':
        return (
          <span className={cn('inline-flex items-center rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20', sizeClasses, className)}>
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Pendente
          </span>
        );
      case 'estornado':
        return (
          <span className={cn('inline-flex items-center rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20', sizeClasses, className)}>
            Estornado
          </span>
        );
      default:
        return (
          <span className={cn('inline-flex items-center rounded-full bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20', sizeClasses, className)}>
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Falhou
          </span>
        );
    }
  }

  if (type === 'stripe_feature') {
    switch (status) {
      case 'webhook':
        return (
          <span className={cn('inline-flex items-center rounded-md bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300 border border-indigo-500/30', sizeClasses, className)}>
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
            Webhook Recebido
          </span>
        );
      case 'confirmed':
        return (
          <span className={cn('inline-flex items-center rounded-md bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/30', sizeClasses, className)}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            Pagamento Confirmado
          </span>
        );
      case 'split':
        return (
          <span className={cn('inline-flex items-center rounded-md bg-sky-500/10 text-sky-600 dark:bg-sky-400/20 dark:text-sky-300 border border-sky-500/30', sizeClasses, className)}>
            <Zap className="w-3.5 h-3.5 shrink-0 text-sky-500" />
            Repasse Calculado
          </span>
        );
      case 'auto_commission':
        return (
          <span className={cn('inline-flex items-center rounded-md bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300 border border-purple-500/30', sizeClasses, className)}>
            <Zap className="w-3.5 h-3.5 shrink-0 text-purple-500" />
            Comissão Automática
          </span>
        );
      default:
        return null;
    }
  }

  return null;
};
