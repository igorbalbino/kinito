import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { isClientRole } from '../../lib/navByRole';

export const ManualFinancialNotice: React.FC = () => {
  const { financialMode, activeRole } = useAppStore();

  if (isClientRole(activeRole)) return null;
  if (financialMode !== 'manual') return null;

  return (
    <div className="p-4 mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Modo de Processamento Financeiro Manual Ativo</h4>
            <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium">
              Não Confirmado
            </span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1">
            As métricas financeiras, comissões e repasses dependem de confirmação manual e são tratadas como estimativas pendentes. As automações via Stripe estão temporariamente desativadas.
          </p>
        </div>
      </div>
    </div>
  );
};
