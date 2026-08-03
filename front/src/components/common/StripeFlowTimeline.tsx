import React from 'react';
import { ArrowRight, Building2, CreditCard, ShieldCheck, User, UserCheck, Wallet } from 'lucide-react';
import { formatBRL, formatPercent } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';

interface StripeFlowTimelineProps {
  grossValue?: number;
}

export const StripeFlowTimeline: React.FC<StripeFlowTimelineProps> = ({ grossValue = 100 }) => {
  const { financialMode } = useAppStore();

  const stripeFee = financialMode === 'stripe' ? parseFloat((grossValue * 0.039 + 0.50).toFixed(2)) : 0;
  const platformRate = 15;
  const companyRate = 10;
  
  const platformFee = parseFloat((grossValue * (platformRate / 100)).toFixed(2));
  const companyFee = parseFloat((grossValue * (companyRate / 100)).toFixed(2));
  const driverNet = parseFloat((grossValue - stripeFee - platformFee - companyFee).toFixed(2));

  return (
    <div className="p-5 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            Fluxo de Distribuição Financeira {financialMode === 'stripe' ? '(Stripe Connect Split)' : '(Calculado Manualmente)'}
          </h3>
        </div>
        {financialMode === 'stripe' ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Split Automático Ativo
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Estimativa Pendente
          </span>
        )}
      </div>

      {/* Flow Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {/* Node 1: Cliente */}
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-1.5 text-center">
          <div className="w-8 h-8 mx-auto rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">1. Cliente</div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatBRL(grossValue)}</div>
          <div className="text-[10px] text-zinc-400">Valor Bruto</div>
        </div>

        {/* Node 2: Stripe Gateway */}
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-1.5 text-center">
          <div className="w-8 h-8 mx-auto rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">2. Stripe Gateway</div>
          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {financialMode === 'stripe' ? `- ${formatBRL(stripeFee)}` : 'R$ 0,00'}
          </div>
          <div className="text-[10px] text-zinc-400">Taxa Processamento</div>
        </div>

        {/* Node 3: Plataforma */}
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-1.5 text-center">
          <div className="w-8 h-8 mx-auto rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">3. Plataforma</div>
          <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
            + {formatBRL(platformFee)}
          </div>
          <div className="text-[10px] text-zinc-400">Comissão ({formatPercent(platformRate)})</div>
        </div>

        {/* Node 4: Empresa Distribuidora */}
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-1.5 text-center">
          <div className="w-8 h-8 mx-auto rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">4. Empresa</div>
          <div className="text-sm font-bold text-sky-600 dark:text-sky-400">
            + {formatBRL(companyFee)}
          </div>
          <div className="text-[10px] text-zinc-400">Comissão ({formatPercent(companyRate)})</div>
        </div>

        {/* Node 5: Motorista */}
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/10 space-y-1.5 text-center">
          <div className="w-8 h-8 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">5. Motorista</div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {formatBRL(driverNet)}
          </div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">Líquido Disponível</div>
        </div>
      </div>

      {/* Breakdown Bar */}
      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <span>Detalhamento do Split da Corrida</span>
          <span>Total: {formatBRL(grossValue)}</span>
        </div>
        <div className="h-3 w-full rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-800">
          <div style={{ width: `${(driverNet / grossValue) * 100}%` }} className="bg-emerald-500 h-full" title="Motorista" />
          <div style={{ width: `${(platformFee / grossValue) * 100}%` }} className="bg-purple-500 h-full" title="Plataforma" />
          <div style={{ width: `${(companyFee / grossValue) * 100}%` }} className="bg-sky-500 h-full" title="Empresa" />
          {financialMode === 'stripe' && (
            <div style={{ width: `${(stripeFee / grossValue) * 100}%` }} className="bg-indigo-500 h-full" title="Taxa Stripe" />
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Motorista: {formatBRL(driverNet)} ({((driverNet / grossValue) * 100).toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Plataforma: {formatBRL(platformFee)} ({platformRate}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Empresa: {formatBRL(companyFee)} ({companyRate}%)</span>
          </div>
          {financialMode === 'stripe' && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Stripe: {formatBRL(stripeFee)} ({((stripeFee / grossValue) * 100).toFixed(1)}%)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
