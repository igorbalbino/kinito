import React, { useState } from 'react';
import {
  Car,
  CheckCircle2,
  Clock,
  FileCheck,
  Search,
  ShieldAlert,
  Star,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { formatBRL } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { DriverApprovalModal } from '../components/modals/DriverApprovalModal';
import { SEOHead } from '../components/common/SEOHead';
import { Footer } from '../components/layout/Footer';
import { Driver } from '../types';

export const MotoristasView: React.FC = () => {
  const { drivers, updateDriverStatus } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedDriverForApproval, setSelectedDriverForApproval] = useState<Driver | null>(null);

  const pendingDrivers = drivers.filter((d) => d.status === 'em_aprovacao');

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <SEOHead
        title="Frota de Motoristas & Validação de CNH/CRLV"
        description="Controle e auditoria de parceiros motoristas. Módulo de aprovação de documentos obrigatórios (CNH, CRLV, antecedentes), status de frota e controle de repasses."
        keywords={['auditoria de motoristas', 'aprovação de CNH', 'validação CRLV frota', 'cadastro motorista parceiro']}
        category="Módulo de Motoristas SaaS"
        jsonLdSchema={{
          '@type': 'Table',
          'name': 'Frota de Motoristas Cadastrados',
          'about': 'Auditoria de conformidade de documentos e avaliação de motoristas ativos.',
        }}
      />

      {/* Header */}
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
      </div>

      {/* Pending Approvals Warning Card if any */}
      {pendingDrivers.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">
                Existem {pendingDrivers.length} motorista(s) aguardando validação de documentos
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300/90">
                Revise CNH, CRLV e laudo de vistoria para aprovar o cadastro no sistema.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedDriverForApproval(pendingDrivers[0])}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-xs"
          >
            Analisar Agora
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar motorista por nome, placa do veículo ou empresa..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 font-medium"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="em_aprovacao">Em Aprovação</option>
            <option value="indisponivel">Indisponível</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
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
              {filteredDrivers.slice(0, 15).map((driver) => (
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
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      Documentos
                    </button>
                    {driver.status === 'ativo' ? (
                      <button
                        onClick={() => updateDriverStatus(driver.id, 'bloqueado')}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 font-semibold hover:bg-rose-600 hover:text-white transition-colors"
                      >
                        Bloquear
                      </button>
                    ) : (
                      <button
                        onClick={() => updateDriverStatus(driver.id, 'ativo')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-semibold hover:bg-emerald-600 hover:text-white transition-colors"
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

      {/* Approval Modal */}
      <DriverApprovalModal driver={selectedDriverForApproval} onClose={() => setSelectedDriverForApproval(null)} />

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
