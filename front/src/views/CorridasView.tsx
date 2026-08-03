import React, { useState } from 'react';
import {
  Calendar,
  Car,
  Clock,
  Filter,
  Grid,
  List,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react';
import { formatBRL, formatDate } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { RideDetailsModal } from '../components/modals/RideDetailsModal';
import { SEOHead } from '../components/common/SEOHead';
import { Footer } from '../components/layout/Footer';
import { Ride, RideStatus } from '../types';

export const CorridasView: React.FC = () => {
  const { rides, financialMode, setNewRideModalOpen } = useAppStore();

  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'timeline'>('table');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');

  // Filtered dataset
  const filteredRides = rides.filter((r) => {
    const matchesSearch =
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.driverName && r.driverName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.origin.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destination.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || r.status === statusFilter;
    const matchesPayment = paymentFilter === 'todos' || r.paymentMethod === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <SEOHead
        title="Gestão de Corridas & Despacho Tátil"
        description="Painel de controle de chamadas em tempo real. Filtre corridas por status (pendente, aceita, em andamento, concluída), atribua motoristas instantaneamente e consulte taxas de split."
        keywords={['despacho de corridas', 'atribuição de motoristas', 'gestão de trajetos GPS', 'corridas corporativas']}
        category="Módulo de Corridas SaaS"
        jsonLdSchema={{
          '@type': 'Table',
          'name': 'Lista de Corridas & Serviços de Transporte',
          'about': 'Tabela interativa de despacho e rastreamento de serviços executivos e frotas.',
        }}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Gestão de Corridas & Despacho
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {filteredRides.length} de {rides.length}
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Visualização em Tabela, Cards e Timeline em Tempo Real de Todos os Serviços.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Visão em Tabela"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Visão em Cards"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Visão em Timeline"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setNewRideModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 min-h-[44px] active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nova Corrida
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código, cliente, motorista, endereço..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Status Select */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="atribuida">Atribuída</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Payment Method Select */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
            >
              <option value="todos">Todas as Formas de Pgto</option>
              <option value="credit_card">Cartão de Crédito</option>
              <option value="pix">PIX</option>
              <option value="faturado">Faturado Corporativo</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: TABLE */}
      {viewMode === 'table' && (
        <div className="rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Motorista & Veículo</th>
                  <th className="py-3 px-4">Origem → Destino</th>
                  <th className="py-3 px-4">Distância</th>
                  <th className="py-3 px-4">Valor Bruto</th>
                  <th className="py-3 px-4">Líquido Motorista</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredRides.slice(0, 15).map((ride) => (
                  <tr key={ride.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{ride.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{ride.clientName}</div>
                      <div className="text-[10px] text-zinc-400">{ride.companyName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{ride.driverName || 'Nenhum atribuído'}</div>
                      <div className="text-[10px] text-zinc-400">{ride.driverVehicle || '-'}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-zinc-600 dark:text-zinc-400">
                      {ride.origin.neighborhood} → {ride.destination.neighborhood}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">{ride.distanceKm} km</td>
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">{formatBRL(ride.grossValue)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(ride.driverNet)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge type="ride" status={ride.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRide(ride)}
                        className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CARDS GRID */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRides.slice(0, 12).map((ride) => (
            <div
              key={ride.id}
              onClick={() => setSelectedRide(ride)}
              className="p-5 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 cursor-pointer space-y-4 transition-all shadow-2xs hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">{ride.code}</span>
                <StatusBadge type="ride" status={ride.status} size="sm" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{ride.origin.address}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold ml-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{ride.destination.address}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-zinc-400">Cliente</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{ride.clientName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400">Valor Bruto</div>
                  <div className="font-bold text-base text-zinc-900 dark:text-zinc-100">{formatBRL(ride.grossValue)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW MODE 3: TIMELINE */}
      {viewMode === 'timeline' && (
        <div className="p-6 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-6">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            Linha do Tempo de Execução dos Serviços
          </h3>
          <div className="relative border-l-2 border-indigo-500/30 ml-4 space-y-6">
            {filteredRides.slice(0, 10).map((ride) => (
              <div key={ride.id} className="ml-6 relative group">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white dark:border-zinc-900" />
                <div
                  onClick={() => setSelectedRide(ride)}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 bg-zinc-50/50 dark:bg-zinc-800/40 cursor-pointer transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-600">{ride.code} • {ride.clientName}</span>
                    <span className="text-[11px] text-zinc-400">{formatDate(ride.requestedAt)}</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Origem: <strong>{ride.origin.address}</strong> → Destino: <strong>{ride.destination.address}</strong>
                  </p>
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatBRL(ride.grossValue)}</span>
                    <StatusBadge type="ride" status={ride.status} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details Modal */}
      <RideDetailsModal ride={selectedRide} onClose={() => setSelectedRide(null)} />

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
