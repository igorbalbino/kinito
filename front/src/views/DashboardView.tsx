import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Building2,
  Car,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Plus,
  Star,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { formatBRL, formatDate } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { ManualFinancialNotice } from '../components/common/ManualFinancialNotice';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { PageSEO } from '../components/common/PageSEO';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';
import { RideDetailsModal } from '../components/modals/RideDetailsModal';
import { Ride } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { rideAction, fetchDashboard } from '../lib/api';
import { normalizeRide } from '../lib/normalize';
import { unwrapResource } from '../lib/sessionProfile';
import { isClientRole } from '../lib/navByRole';
import { useNavigate } from 'react-router-dom';

export const DashboardView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    activeRole,
    rides,
    drivers,
    financialMode,
    upsertRide,
    setNewRideModalOpen,
    dataLoading,
    dataError,
    dataLoaded,
  } = useAppStore();

  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [apiMetrics, setApiMetrics] = useState<Record<string, number> | null>(null);
  const clientMode = isClientRole(activeRole);

  useEffect(() => {
    void fetchDashboard()
      .then((res) => setApiMetrics(res.metrics || null))
      .catch(() => setApiMetrics(null));
  }, [activeRole, dataLoaded]);

  const completedRides = rides.filter((r) => r.status === 'concluida');
  const inProgressRides = rides.filter((r) => r.status === 'em_andamento' || r.status === 'atribuida');
  const pendingRides = rides.filter((r) => r.status === 'pendente');
  const cancelledRides = rides.filter((r) => r.status === 'cancelada');

  const totalGrossRevenue = apiMetrics?.grossRevenue ?? apiMetrics?.monthlyRevenue ?? completedRides.reduce((acc, r) => acc + r.grossValue, 0);
  const totalPlatformFees = apiMetrics?.platformCommission ?? completedRides.reduce((acc, r) => acc + r.platformCommission, 0);
  const totalStripeFees = completedRides.reduce((acc, r) => acc + r.stripeFee, 0);
  const totalDriverPayouts = apiMetrics?.totalEarnings ?? completedRides.reduce((acc, r) => acc + r.driverNet, 0);

  const activeDriverRide =
    rides.find((r) => r.status === 'em_andamento') ||
    rides.find((r) => r.status === 'atribuida') ||
    null;

  const handleFinishActive = async () => {
    if (!activeDriverRide) return;
    try {
      const res = await rideAction(activeDriverRide.id, 'finish');
      upsertRide(normalizeRide(unwrapResource(res)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao concluir corrida');
    }
  };

  const chartData = (() => {
    const byDay = new Map<string, { receita: number; corridas: number; comissao: number }>();
    for (const r of completedRides) {
      const day = (r.completedAt || r.requestedAt || '').slice(0, 10);
      if (!day) continue;
      const cur = byDay.get(day) || { receita: 0, corridas: 0, comissao: 0 };
      cur.receita += r.grossValue;
      cur.corridas += 1;
      cur.comissao += r.platformCommission;
      byDay.set(day, cur);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([day, v]) => ({ day: day.slice(5), ...v }));
  })();
  const chartSeries = chartData.length
    ? chartData
    : [{ day: '—', receita: 0, corridas: 0, comissao: 0 }];

  const statusPieData = [
    { name: 'Concluídas', value: completedRides.length, color: '#10b981' },
    { name: 'Em Andamento', value: inProgressRides.length, color: '#a855f7' },
    { name: 'Pendentes', value: pendingRides.length, color: '#f59e0b' },
    { name: 'Canceladas', value: cancelledRides.length, color: '#f43f5e' },
  ];

  return (
    <PageContainer>
      <PageSEO page="dashboard" />

      {dataLoading && (
        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Carregando dados da API…</div>
      )}
      {dataError && (
        <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">{dataError}</div>
      )}

      {!clientMode && <ManualFinancialNotice />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 break-words">
              {clientMode
                ? 'Olá! Pronto para sua próxima corrida?'
                : `${t.dashboard.title} (${activeRole === 'admin' ? 'Master Admin' : activeRole === 'empresa' ? 'Fleet Company' : activeRole === 'motorista' ? 'Driver' : 'Client'})`}
            </h1>
            {!clientMode && (
              <StatusBadge type="stripe_feature" status={financialMode === 'stripe' ? 'confirmed' : 'split'} size="sm" />
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {clientMode ? 'Peça uma corrida em poucos toques e acompanhe o histórico.' : t.dashboard.subtitle}
          </p>
        </div>

        {!clientMode && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setNewRideModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 min-h-[44px] active:scale-95"
            >
              <Plus className="w-4 h-4" /> {t.dashboard.quickNewRide}
            </button>
          </div>
        )}
      </div>

      {activeRole === 'admin' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Receita Bruta da Plataforma"
              value={formatBRL(totalGrossRevenue)}
              change={`${completedRides.length} concluídas`}
              icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
              badge={<StatusBadge type="stripe_feature" status={financialMode === 'stripe' ? 'confirmed' : 'split'} size="sm" />}
            />
            <MetricCard
              title="Comissão Líquida da Plataforma"
              value={formatBRL(totalPlatformFees)}
              change={financialMode === 'stripe' ? `Stripe fees ${formatBRL(totalStripeFees)}` : 'Modo manual'}
              subtitle="Take rate da plataforma"
              icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
            />
            <MetricCard
              title="Volume de Corridas"
              value={rides.length}
              change={`${inProgressRides.length} em andamento`}
              subtitle={`${pendingRides.length} pendentes`}
              icon={<Car className="w-5 h-5 text-blue-500" />}
            />
            <MetricCard
              title="Motoristas Ativos"
              value={drivers.filter((d) => d.status === 'ativo').length}
              change={`${drivers.filter((d) => d.status === 'em_aprovacao').length} em aprovação`}
              subtitle={`${drivers.length} cadastrados`}
              icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <AreaChart data={chartSeries}>
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

          <div className="p-4 sm:p-5 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-4 overflow-hidden min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  Corridas em Tempo Real
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Acompanhamento instantâneo dos últimos despachos e status
                </p>
              </div>
            </div>

            <div className="md:hidden space-y-3">
              {rides.slice(0, 7).map((ride) => (
                <button
                  key={ride.id}
                  type="button"
                  onClick={() => setSelectedRide(ride)}
                  className="w-full text-left p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/30 space-y-2 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">{ride.code}</span>
                    <StatusBadge type="ride" status={ride.status} size="sm" />
                  </div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{ride.clientName}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{ride.origin.neighborhood} → {ride.destination.neighborhood}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">{ride.driverName || 'Pendente'}</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatBRL(ride.grossValue)}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto -mx-1 px-1">
              <table className="w-full min-w-[720px] text-left text-xs">
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
                          className="px-2.5 py-1.5 min-h-[36px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-indigo-600 hover:text-white transition-colors"
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

      {activeRole === 'empresa' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Faturamento da Empresa"
              value={formatBRL(totalGrossRevenue)}
              change={`${completedRides.length} concluídas`}
              icon={<Building2 className="w-5 h-5 text-blue-500" />}
            />
            <MetricCard
              title="Motoristas da Frota"
              value={drivers.length}
              change={`${drivers.filter((d) => d.status === 'ativo').length} ativos`}
              icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
            />
            <MetricCard
              title="Corridas"
              value={rides.length}
              change={`${inProgressRides.length} em andamento`}
              icon={<Car className="w-5 h-5 text-indigo-500" />}
            />
            <MetricCard
              title="Corte da Empresa"
              value={formatBRL(completedRides.reduce((acc, r) => acc + r.companyCut, 0))}
              subtitle="Repasse de frota"
              icon={<DollarSign className="w-5 h-5 text-purple-500" />}
            />
          </div>

          <div className="p-4 sm:p-5 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-4 overflow-hidden min-w-0">
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Corridas Despachadas da Sua Frota
            </h3>

            <div className="md:hidden space-y-3">
              {rides.slice(0, 6).map((ride) => (
                <button
                  key={ride.id}
                  type="button"
                  onClick={() => setSelectedRide(ride)}
                  className="w-full text-left p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/30 space-y-2 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-indigo-600 text-xs">{ride.code}</span>
                    <StatusBadge type="ride" status={ride.status} size="sm" />
                  </div>
                  <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{ride.driverName || 'Sem motorista'}</div>
                  <div className="text-[11px] text-zinc-500">{ride.clientName}</div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold">{formatBRL(ride.grossValue)}</span>
                    <span className="font-semibold text-sky-600">Corte {formatBRL(ride.companyCut)}</span>
                  </div>
                </button>
              ))}
              {rides.length === 0 && (
                <p className="text-xs text-zinc-500 py-4 text-center">Nenhuma corrida na frota ainda.</p>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto -mx-1 px-1">
              <table className="w-full min-w-[720px] text-left text-xs">
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
                          className="px-2.5 py-1.5 min-h-[36px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold"
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

      {activeRole === 'motorista' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Ganhos concluídos"
              value={formatBRL(totalDriverPayouts)}
              change={`${completedRides.length} corridas`}
              icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
            />
            <MetricCard
              title="Em andamento"
              value={inProgressRides.length}
              subtitle="Atribuídas ou ativas"
              icon={<CreditCard className="w-5 h-5 text-indigo-500" />}
            />
            <MetricCard
              title="Pendentes"
              value={pendingRides.length}
              icon={<Car className="w-5 h-5 text-blue-500" />}
            />
            <MetricCard
              title="Total na fila"
              value={rides.length}
              subtitle={dataLoading ? 'Carregando…' : dataError || 'Dados da API'}
              icon={<Star className="w-5 h-5 text-amber-500" />}
            />
          </div>

          {activeDriverRide ? (
            <div className="p-5 rounded-2xl border-2 border-indigo-500/40 bg-indigo-500/10 text-zinc-900 dark:text-zinc-100 space-y-4 overflow-hidden min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping shrink-0" />
                  <h3 className="font-bold text-sm text-indigo-700 dark:text-indigo-300 truncate">
                    Corrida ativa ({activeDriverRide.code})
                  </h3>
                </div>
                <StatusBadge type="ride" status={activeDriverRide.status} size="sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400 font-semibold">
                    Passageiro: {activeDriverRide.clientName}
                  </p>
                  <p className="font-bold text-sm mt-0.5">Origem: {activeDriverRide.origin.address}</p>
                  <p className="font-bold text-sm mt-1 text-emerald-600 dark:text-emerald-400">
                    Destino: {activeDriverRide.destination.address}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-500/20 space-y-2">
                  <div className="flex justify-between font-bold">
                    <span>Valor Bruto:</span>
                    <span>{formatBRL(activeDriverRide.grossValue)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold border-t pt-1">
                    <span>Seu Ganho Líquido:</span>
                    <span>{formatBRL(activeDriverRide.driverNet)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => void handleFinishActive()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" /> Concluir Corrida
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
              Nenhuma corrida ativa no momento.
            </div>
          )}
        </>
      )}

      {activeRole === 'cliente' && (
        <>
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 text-white space-y-4 shadow-xl">
            <h2 className="text-2xl font-black">Pedir corrida agora</h2>
            <p className="text-sm opacity-90 max-w-xl">
              Informe origem e destino. Em poucos cliques sua solicitação está no ar.
            </p>
            <button
              type="button"
              onClick={() => setNewRideModalOpen(true)}
              className="px-6 py-3.5 rounded-xl bg-white text-indigo-950 font-extrabold text-sm shadow-lg hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Car className="w-5 h-5" /> Pedir corrida
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Minhas corridas"
              value={rides.length}
              change={`${completedRides.length} concluídas`}
              icon={<Car className="w-5 h-5 text-amber-500" />}
            />
            <MetricCard
              title="Gasto total"
              value={formatBRL(totalGrossRevenue)}
              subtitle="Corridas concluídas"
              icon={<DollarSign className="w-5 h-5 text-indigo-500" />}
            />
            <MetricCard
              title="Em andamento"
              value={inProgressRides.length + pendingRides.length}
              subtitle="Aguardando ou ativas"
              icon={<Car className="w-5 h-5 text-blue-500" />}
            />
          </div>

          <div className="p-4 sm:p-5 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Últimas corridas</h3>
              <button
                type="button"
                onClick={() => navigate('/corridas')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Ver todas
              </button>
            </div>
            {rides.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">Nenhuma corrida ainda. Peça a primeira!</p>
            ) : (
              <div className="space-y-2">
                {rides.slice(0, 5).map((ride) => (
                  <button
                    key={ride.id}
                    type="button"
                    onClick={() => setSelectedRide(ride)}
                    className="w-full text-left p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/40 space-y-1 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-indigo-600 text-xs">{ride.code}</span>
                      <StatusBadge type="ride" status={ride.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      {ride.origin.neighborhood || ride.origin.address} → {ride.destination.neighborhood || ride.destination.address}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">{formatDate(ride.requestedAt)}</span>
                      <span className="font-bold">{formatBRL(ride.grossValue)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => navigate('/financeiro')}
                className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold min-h-[40px]"
              >
                Meus gastos
              </button>
              <button
                type="button"
                onClick={() => navigate('/corridas')}
                className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold min-h-[40px]"
              >
                Histórico completo
              </button>
            </div>
          </div>
        </>
      )}

      <RideDetailsModal ride={selectedRide} onClose={() => setSelectedRide(null)} />

      <Footer />
    </PageContainer>
  );
};
