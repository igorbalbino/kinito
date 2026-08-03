import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Plus,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { formatBRL, formatPercent } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { ManualFinancialNotice } from '../components/common/ManualFinancialNotice';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { StripeFlowTimeline } from '../components/common/StripeFlowTimeline';
import { SEOHead } from '../components/common/SEOHead';
import { Footer } from '../components/layout/Footer';
import { RideDetailsModal } from '../components/modals/RideDetailsModal';
import { NewRideModal } from '../components/modals/NewRideModal';
import { Ride } from '../types';
import { useTranslation } from '../hooks/useTranslation';

export const DashboardView: React.FC = () => {
  const { t } = useTranslation();
  const {
    activeRole,
    rides,
    drivers,
    clients,
    companies,
    financialMode,
    updateRideStatus,
    setNewRideModalOpen,
  } = useAppStore();

  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  // Filter calculations based on active view
  const completedRides = rides.filter((r) => r.status === 'concluida');
  const inProgressRides = rides.filter((r) => r.status === 'em_andamento');
  const pendingRides = rides.filter((r) => r.status === 'pendente');
  const cancelledRides = rides.filter((r) => r.status === 'cancelada');

  const totalGrossRevenue = completedRides.reduce((acc, r) => acc + r.grossValue, 0);
  const totalPlatformFees = completedRides.reduce((acc, r) => acc + r.platformCommission, 0);
  const totalStripeFees = completedRides.reduce((acc, r) => acc + r.stripeFee, 0);
  const totalDriverPayouts = completedRides.reduce((acc, r) => acc + r.driverNet, 0);

  // Chart Data for 14 days
  const chartData = [
    { day: '18/07', receita: 4200, corridas: 48, comissao: 630 },
    { day: '19/07', receita: 5800, corridas: 62, comissao: 870 },
    { day: '20/07', receita: 5100, corridas: 55, comissao: 765 },
    { day: '21/07', receita: 6900, corridas: 74, comissao: 1035 },
    { day: '22/07', receita: 7200, corridas: 80, comissao: 1080 },
    { day: '23/07', receita: 8400, corridas: 91, comissao: 1260 },
    { day: '24/07', receita: 6100, corridas: 68, comissao: 915 },
    { day: '25/07', receita: 7900, corridas: 85, comissao: 1185 },
    { day: '26/07', receita: 9300, corridas: 102, comissao: 1395 },
    { day: '27/07', receita: 8800, corridas: 96, comissao: 1320 },
    { day: '28/07', receita: 10200, corridas: 112, comissao: 1530 },
    { day: '29/07', receita: 11400, corridas: 124, comissao: 1710 },
    { day: '30/07', receita: 10800, corridas: 118, comissao: 1620 },
    { day: '31/07', receita: 12500, corridas: 135, comissao: 1875 },
  ];

  const statusPieData = [
    { name: 'Concluídas', value: completedRides.length, color: '#10b981' },
    { name: 'Em Andamento', value: inProgressRides.length, color: '#a855f7' },
    { name: 'Pendentes', value: pendingRides.length, color: '#f59e0b' },
    { name: 'Canceladas', value: cancelledRides.length, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <SEOHead
        title="Dashboard de Operações & Frota"
        description="Painel de controle em tempo real para monitoramento de corridas, despacho tátil de motoristas, receita bruta e comissões do Stripe Connect."
        keywords={['dashboard de transporte', 'faturamento de frota', 'monitoramento em tempo real', 'métrica de corridas', 'stripe connect']}
        category="Dashboard SaaS"
        jsonLdSchema={{
          '@type': 'WebPage',
          'name': 'Dashboard de Operações Kinito',
          'description': 'Visão consolidada de KPIs operacionais, volume de corridas e extrato de repasses.',
        }}
      />

      {/* Top Banner & Notice */}
      <ManualFinancialNotice />

      {/* Header section with Role Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t.dashboard.title} ({activeRole === 'admin' ? 'Master Admin' : activeRole === 'empresa' ? 'Fleet Company' : activeRole === 'motorista' ? 'Driver' : 'Client'})
            </h1>
            <StatusBadge type="stripe_feature" status={financialMode === 'stripe' ? 'confirmed' : 'split'} size="sm" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t.dashboard.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setNewRideModalOpen(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 min-h-[44px] active:scale-95"
          >
            <Plus className="w-4 h-4" /> {t.dashboard.quickNewRide}
          </button>
        </div>
      </div>

      {/* 1. ADMIN DASHBOARD VIEW */}
      {activeRole === 'admin' && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Receita Bruta da Plataforma"
              value={formatBRL(totalGrossRevenue)}
              change="+18.4% este mês"
              icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
              badge={<StatusBadge type="stripe_feature" status={financialMode === 'stripe' ? 'confirmed' : 'split'} size="sm" />}
            />
            <MetricCard
              title="Comissão Líquida da Plataforma"
              value={formatBRL(totalPlatformFees)}
              change="+14.2% vs semana passada"
              subtitle="15% de take rate"
              icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
            />
            <MetricCard
              title="Volume de Corridas"
              value={rides.length}
              change="+22 novas hoje"
              subtitle={`${completedRides.length} concluídas`}
              icon={<Car className="w-5 h-5 text-blue-500" />}
            />
            <MetricCard
              title="Motoristas Ativos"
              value={drivers.filter((d) => d.status === 'ativo').length}
              change="5 em aprovação"
              subtitle={`${drivers.length} cadastrados`}
              icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
            />
          </div>

          {/* Stripe Split Flow Visualizer */}
          <StripeFlowTimeline grossValue={100} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Chart */}
            <div className="lg:col-span-2 p-5 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    Faturamento Bruto & Comissão (Últimos 14 dias)
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Evolução do volume financeiro processado pela plataforma
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  +18.4% Crescimento
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorComissao" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} tickFormatter={(v) => `R$${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                      formatter={(val: any) => [formatBRL(Number(val)), '']}
                    />
                    <Area type="monotone" dataKey="receita" name="Receita Bruta" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorReceita)" />
                    <Area type="monotone" dataKey="comissao" name="Comissão Plataforma" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorComissao)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ride Status Donut Chart */}
            <div className="p-5 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  Distribuição por Status
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Proporção de status das corridas ativas
                </p>
              </div>

              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800">
                {statusPieData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-zinc-600 dark:text-zinc-400 truncate">{s.name}:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Live Rides Table Preview */}
          <div className="p-5 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  Corridas em Tempo Real
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Acompanhamento instantâneo dos últimos despachos e status
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Motorista</th>
                    <th className="py-2.5 px-3">Origem → Destino</th>
                    <th className="py-2.5 px-3">Valor Bruto</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {rides.slice(0, 7).map((ride) => (
                    <tr key={ride.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{ride.code}</td>
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">{ride.clientName}</td>
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">{ride.driverName || 'Pendente'}</td>
                      <td className="py-3 px-3 text-zinc-500 max-w-xs truncate">{ride.origin.neighborhood} → {ride.destination.neighborhood}</td>
                      <td className="py-3 px-3 font-bold text-zinc-900 dark:text-zinc-100">{formatBRL(ride.grossValue)}</td>
                      <td className="py-3 px-3"><StatusBadge type="ride" status={ride.status} size="sm" /></td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedRide(ride)}
                          className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-indigo-600 hover:text-white transition-colors"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 2. EMPRESA / DISTRIBUIDOR DASHBOARD VIEW */}
      {activeRole === 'empresa' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Faturamento da Empresa"
              value={formatBRL(48500.00)}
              change="+12.5% este mês"
              icon={<Building2 className="w-5 h-5 text-blue-500" />}
            />
            <MetricCard
              title="Motoristas da Frota"
              value={32}
              change="28 ativos agora"
              icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
            />
            <MetricCard
              title="Corridas Concluídas"
              value={412}
              change="+38 hoje"
              icon={<Car className="w-5 h-5 text-indigo-500" />}
            />
            <MetricCard
              title="Comissão Retida da Empresa"
              value={formatBRL(4850.00)}
              subtitle="10% de repasse de frota"
              icon={<DollarSign className="w-5 h-5 text-purple-500" />}
            />
          </div>

          <StripeFlowTimeline grossValue={150} />

          <div className="p-5 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Corridas Despachadas da Sua Frota
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Motorista</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Valor Bruto</th>
                    <th className="py-2.5 px-3">Corte da Empresa (10%)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {rides.slice(0, 6).map((ride) => (
                    <tr key={ride.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600">{ride.code}</td>
                      <td className="py-3 px-3 text-zinc-900 dark:text-zinc-100 font-medium">{ride.driverName || 'Sem motorista'}</td>
                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">{ride.clientName}</td>
                      <td className="py-3 px-3 font-bold">{formatBRL(ride.grossValue)}</td>
                      <td className="py-3 px-3 font-semibold text-sky-600">{formatBRL(ride.companyCut)}</td>
                      <td className="py-3 px-3"><StatusBadge type="ride" status={ride.status} size="sm" /></td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedRide(ride)}
                          className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 3. MOTORISTA DASHBOARD VIEW (Gabriel Silva) */}
      {activeRole === 'motorista' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Ganhos de Hoje"
              value={formatBRL(284.50)}
              change="+R$ 42,00 na última corrida"
              icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
            />
            <MetricCard
              title="Saldo Líquido Disponível"
              value={formatBRL(1840.20)}
              subtitle="Repasse automático via Stripe"
              icon={<CreditCard className="w-5 h-5 text-indigo-500" />}
            />
            <MetricCard
              title="Corridas Realizadas Hoje"
              value={8}
              change="Meta diária: 10"
              icon={<Car className="w-5 h-5 text-blue-500" />}
            />
            <MetricCard
              title="Avaliação do Motorista"
              value="4.9 ★"
              subtitle="98.5% de aprovação"
              icon={<Star className="w-5 h-5 text-amber-500" />}
            />
          </div>

          {/* Active Assigned Ride Card */}
          <div className="p-5 rounded-2xl border-2 border-indigo-500/40 bg-indigo-500/10 text-zinc-900 dark:text-zinc-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
                <h3 className="font-bold text-sm text-indigo-700 dark:text-indigo-300">
                  Corrida Atribuída em Andamento (COR-100499)
                </h3>
              </div>
              <StatusBadge type="ride" status="em_andamento" size="sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400 font-semibold">Passageiro: Lucas Santos</p>
                <p className="font-bold text-sm mt-0.5">Origem: Rua Faria Lima, 1200 - Pinheiros</p>
                <p className="font-bold text-sm mt-1 text-emerald-600 dark:text-emerald-400">Destino: Av. Paulista, 1000 - Bela Vista</p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-500/20 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Valor Bruto:</span>
                  <span>R$ 54,20</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold border-t pt-1">
                  <span>Seu Ganho Líquido:</span>
                  <span>R$ 41,80</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  updateRideStatus(rides[0].id, 'concluida');
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" /> Concluir e Receber Pagamento
              </button>
            </div>
          </div>
        </>
      )}

      {/* 4. CLIENTE DASHBOARD VIEW (Lucas Santos) */}
      {activeRole === 'cliente' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Corridas Solicitadas"
              value={24}
              change="Cliente VIP Gold"
              icon={<Car className="w-5 h-5 text-amber-500" />}
            />
            <MetricCard
              title="Gasto Total em Viagens"
              value={formatBRL(1280.40)}
              subtitle="Pagamentos via Stripe"
              icon={<DollarSign className="w-5 h-5 text-indigo-500" />}
            />
            <MetricCard
              title="Endereço Favorito"
              value="Av. Paulista, 1000"
              subtitle="São Paulo, SP"
              icon={<Car className="w-5 h-5 text-blue-500" />}
            />
            <MetricCard
              title="Sua Avaliação Média"
              value="4.9 ★"
              subtitle="Passageiro Recomendado"
              icon={<Star className="w-5 h-5 text-emerald-500" />}
            />
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white space-y-4 shadow-xl">
            <h2 className="text-2xl font-black">Precisa de um carro ou serviço de entrega agora?</h2>
            <p className="text-sm opacity-90 max-w-xl">
              Solicite com um clique. Encontramos o motorista verificado mais próximo da sua localização com cálculo transparente em tempo real.
            </p>
            <button
              onClick={() => setNewRideModalOpen(true)}
              className="px-6 py-3.5 rounded-xl bg-white text-indigo-950 font-extrabold text-sm shadow-lg hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Car className="w-5 h-5" /> Solicitar Corrida Imediata
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      <RideDetailsModal ride={selectedRide} onClose={() => setSelectedRide(null)} />

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
