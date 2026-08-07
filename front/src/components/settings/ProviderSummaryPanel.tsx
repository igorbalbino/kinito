import React, { useMemo } from 'react';
import { Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { getStoredApiUser } from '../../lib/api';
import { isClientRole } from '../../lib/navByRole';

export const ProviderSummaryPanel: React.FC = () => {
  const { activeRole, companies, drivers } = useAppStore();
  const apiUser = getStoredApiUser();
  const clientMode = isClientRole(activeRole);

  const summary = useMemo(() => {
    if (clientMode) {
      const prefs = (apiUser?.client as { preferences?: { defaultProviderMode?: string; defaultCompanyId?: string | null } } | undefined)
        ?.preferences;
      const mode = prefs?.defaultProviderMode || 'ALL';
      if (mode === 'ALL') {
        return { label: 'Todos / marketplace', detail: 'Você escolhe o fornecedor a cada corrida.' };
      }
      const id = String(prefs?.defaultCompanyId || '');
      const name = companies.find((c) => c.id === id)?.name
        || (apiUser?.client as { companyName?: string } | undefined)?.companyName
        || 'Empresa vinculada';
      return { label: name, detail: 'Fornecedor principal das suas corridas.' };
    }

    const driver = (apiUser?.driver as {
      primaryCompanyId?: string;
      companyName?: string;
      providerSwitchPending?: boolean;
      previousPrimaryCompanyName?: string;
    } | undefined) || drivers[0];

    if (driver?.providerSwitchPending) {
      return {
        label: driver.companyName || 'Aguardando aceite',
        detail: `Troca pendente${driver.previousPrimaryCompanyName ? ` — anterior: ${driver.previousPrimaryCompanyName}` : ''}.`,
      };
    }

    return {
      label: driver?.companyName || 'Nenhum fornecedor',
      detail: 'Empresa da qual você recebe corridas.',
    };
  }, [apiUser, clientMode, companies, drivers]);

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base text-slate-100">Fornecedor principal</h3>
          <p className="text-xs text-slate-400">{summary.detail}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">Atual</div>
        <div className="text-sm font-bold text-slate-100 mt-1">{summary.label}</div>
      </div>

      <Link
        to="/fornecedores"
        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold min-h-[44px]"
      >
        Gerenciar fornecedores <ExternalLink className="w-4 h-4" />
      </Link>
    </div>
  );
};
