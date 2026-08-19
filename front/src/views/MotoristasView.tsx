import React, { useState } from 'react';
import { Clock, Plus, Search } from 'lucide-react';
import { formatBRL } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { DriverApprovalModal } from '../components/modals/DriverApprovalModal';
import { DriverCreateModal } from '../components/modals/DriverCreateModal';
import { PageSEO } from '../components/common/PageSEO';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';
import { Driver } from '../types';
import {
  approveDriverApi,
  blockDriverApi,
  getApiCompanyId,
} from '../lib/api';
import { SafeSelect } from '../components/common/SafeSelect';
import { normalizeDriver } from '../lib/normalize';
import { unwrapResource } from '../lib/sessionProfile';

export const MotoristasView: React.FC = () => {
  const { drivers, upsertDriver, selectedCompanyId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedDriverForApproval, setSelectedDriverForApproval] = useState<Driver | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pendingDrivers = drivers.filter((d) => d.status === 'em_aprovacao');

  const filteredDrivers = drivers.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      d.name.toLowerCase().includes(q) ||
      d.vehiclePlate.toLowerCase().includes(q) ||
      d.companyName.toLowerCase().includes(q);
    return matchesSearch && (statusFilter === 'todos' || d.status === statusFilter);
  });

  const companyId = getApiCompanyId() || Number(selectedCompanyId || 0) || 0;

  const handleBlock = async (driver: Driver) => {
    setBusyId(driver.id);
    try {
      const res = await blockDriverApi(driver.id);
      upsertDriver(normalizeDriver(unwrapResource(res)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao bloquear');
    } finally {
      setBusyId(null);
    }
  };

  const handleActivate = async (driver: Driver) => {
    if (!companyId) {
      alert('Empresa não selecionada para aprovação.');
      return;
    }
    setBusyId(driver.id);
    try {
      const res = await approveDriverApi(driver.id, companyId);
      upsertDriver(normalizeDriver(unwrapResource(res)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao ativar');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageContainer>
      <PageSEO page="motoristas" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Frota de Motoristas
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {drivers.length} cadastrados
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Aprovação de documentação, liberação de acesso e extrato de ganhos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-sm min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Novo motorista
        </button>
      </div>

      {pendingDrivers.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">
                {pendingDrivers.length} motorista(s) aguardando validação
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300/90">
                Revise a documentação para aprovar o cadastro.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedDriverForApproval(pendingDrivers[0])}
            className="px-3.5 py-1.5 min-h-[36px] rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-xs"
          >
            Analisar
          </button>
        </div>
      )}

      <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, placa ou empresa..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
          />
        </div>
        <SafeSelect
          value={statusFilter}
          onChange={setStatusFilter}
          label="Status"
          buttonClassName="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
          options={[
            { value: 'todos', label: 'Todos os Status' },
            { value: 'ativo', label: 'Ativo' },
            { value: 'em_aprovacao', label: 'Em Aprovação' },
            { value: 'indisponivel', label: 'Indisponível' },
            { value: 'bloqueado', label: 'Bloqueado' },
          ]}
        />
      </div>

      <div className="rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-hidden min-w-0">
        <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          {filteredDrivers.map((driver) => (
            <div key={driver.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img src={driver.avatar} alt="" className="w-9 h-9 rounded-full bg-zinc-200 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{driver.name}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{driver.vehicleModel} · {driver.vehiclePlate}</div>
                </div>
                <StatusBadge type="driver" status={driver.status} size="sm" />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-amber-500 font-bold">★ {driver.rating}</span>
                <span className="font-bold text-emerald-600">{formatBRL(driver.totalEarnings)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDriverForApproval(driver)}
                  className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold min-h-[40px]"
                >
                  Documentos
                </button>
                {driver.status === 'ativo' ? (
                  <button
                    type="button"
                    disabled={busyId === driver.id}
                    onClick={() => void handleBlock(driver)}
                    className="px-3 py-2 rounded-lg bg-rose-500/10 text-rose-600 text-xs font-semibold min-h-[40px] disabled:opacity-50"
                  >
                    Bloquear
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === driver.id}
                    onClick={() => void handleActivate(driver)}
                    className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-semibold min-h-[40px] disabled:opacity-50"
                  >
                    Ativar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium bg-zinc-50/50 dark:bg-zinc-900/50">
                <th className="py-3 px-4">Motorista</th>
                <th className="py-3 px-4">Veículo & Placa</th>
                <th className="py-3 px-4">Empresa Vinc.</th>
                <th className="py-3 px-4">Avaliação</th>
                <th className="py-3 px-4">Ganhos Totais</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={driver.avatar} alt={driver.name} className="w-8 h-8 rounded-full bg-zinc-200 shrink-0" />
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{driver.name}</div>
                        <div className="text-[10px] text-zinc-400">{driver.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                    <div>{driver.vehicleModel}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">Placa: {driver.vehiclePlate}</div>
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">{driver.companyName}</td>
                  <td className="py-3 px-4 font-bold text-amber-500">★ {driver.rating}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(driver.totalEarnings)}</td>
                  <td className="py-3 px-4">
                    <StatusBadge type="driver" status={driver.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedDriverForApproval(driver)}
                      className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      Documentos
                    </button>
                    {driver.status === 'ativo' ? (
                      <button
                        disabled={busyId === driver.id}
                        onClick={() => void handleBlock(driver)}
                        className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-rose-500/10 text-rose-600 font-semibold hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
                      >
                        Bloquear
                      </button>
                    ) : (
                      <button
                        disabled={busyId === driver.id}
                        onClick={() => void handleActivate(driver)}
                        className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-emerald-500/10 text-emerald-600 font-semibold hover:bg-emerald-600 hover:text-white transition-colors disabled:opacity-50"
                      >
                        Ativar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DriverApprovalModal driver={selectedDriverForApproval} onClose={() => setSelectedDriverForApproval(null)} />
      <DriverCreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <Footer />
    </PageContainer>
  );
};
