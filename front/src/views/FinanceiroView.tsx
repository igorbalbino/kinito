import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { downloadCSV, formatBRL, formatDate } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { ManualFinancialNotice } from '../components/common/ManualFinancialNotice';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { StripeFlowTimeline } from '../components/common/StripeFlowTimeline';
import { PageSEO } from '../components/common/PageSEO';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';
import { SafeSelect } from '../components/common/SafeSelect';
import { RideDetailsModal } from '../components/modals/RideDetailsModal';
import { isClientRole } from '../lib/navByRole';
import { downloadRideReceiptPdf } from '../lib/rideReceiptPdf';
import type { Ride } from '../types';

export const FinanceiroView: React.FC = () => {
  const {
    financialMode,
    setFinancialMode,
    transactions,
    rides,
    activeRole,
  } = useAppStore();
  const clientMode = isClientRole(activeRole);

  const [filterType, setFilterType] = useState<string>('todos');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  useEffect(() => {
    if (!selectedRide) return;
    const latestRide = rides.find((r) => r.id === selectedRide.id);
    if (latestRide && latestRide !== selectedRide) {
      setSelectedRide(latestRide);
    }
  }, [rides, selectedRide]);

  const completedRides = rides.filter((r) => r.status === 'concluida');
  const totalGross = completedRides.reduce((acc, r) => acc + r.grossValue, 0);
  const totalStripeFees = financialMode === 'stripe' ? completedRides.reduce((acc, r) => acc + r.stripeFee, 0) : 0;
  const totalPlatformCut = completedRides.reduce((acc, r) => acc + r.platformCommission, 0);
  const totalCompanyCut = completedRides.reduce((acc, r) => acc + r.companyCut, 0);
  const totalDriverNet = completedRides.reduce((acc, r) => acc + r.driverNet, 0);

  const clientSpendRides = useMemo(
    () =>
      [...rides]
        .filter((r) => r.status !== 'cancelada' || r.grossValue > 0)
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()),
    [rides],
  );
  const clientTotalSpent = clientSpendRides
    .filter((r) => r.status === 'concluida' || r.status === 'em_andamento' || r.status === 'atribuida')
    .reduce((acc, r) => acc + r.grossValue, 0);

  const filteredTx = transactions.filter((tx) => {
    if (filterType === 'todos') return true;
    return tx.type === filterType;
  });

  const handleExportCSV = () => {
    if (clientMode) {
      const rows = clientSpendRides.map((r) => ({
        Codigo: r.code,
        Origem: r.origin.address,
        Destino: r.destination.address,
        Valor: r.grossValue,
        Status: r.status,
        Data: r.requestedAt,
      }));
      downloadCSV('meus_gastos_kinito.csv', rows);
      return;
    }
    const rows = filteredTx.map((tx) => ({
      Codigo: tx.code,
      Tipo: tx.type,
      ValorBruto: tx.amount,
      Remetente: tx.sender,
      Destinatario: tx.recipient,
      Status: tx.status,
      ModoProcessamento: tx.paymentMode,
      Data: tx.createdAt,
    }));
    downloadCSV('extrato_financeiro_kinito.csv', rows);
  };

  if (clientMode) {
    return (
      <PageContainer>
        <PageSEO page="financeiro" />

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Meus gastos
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Valores das suas corridas. Baixe o recibo em PDF no detalhe.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </header>

        <section aria-label="Resumo de gastos" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MetricCard title="Total gasto" value={formatBRL(clientTotalSpent)} subtitle="Corridas ativas e concluídas" />
          <MetricCard title="Corridas" value={String(clientSpendRides.length)} subtitle="No histórico" />
        </section>

        {financialMode === 'manual' && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs font-medium">
            Pagamentos em modo manual: pague ao motorista ao final da corrida.
          </div>
        )}

        <section aria-label="Histórico de gastos" className="rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {clientSpendRides.map((ride) => (
              <div key={ride.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-indigo-600 text-xs">{ride.code}</span>
                  <StatusBadge type="ride" status={ride.status} size="sm" />
                </div>
                <div className="text-[11px] text-zinc-500 truncate">
                  {ride.origin.address} → {ride.destination.address}
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="font-bold">{formatBRL(ride.grossValue)}</span>
                  <div className="flex gap-2">
                    {(ride.status === 'concluida' || ride.status === 'cancelada') && (
                      <button
                        type="button"
                        onClick={() => downloadRideReceiptPdf(ride, financialMode)}
                        className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-zinc-100 dark:bg-zinc-800 font-semibold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> PDF
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedRide(ride)}
                      className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-indigo-600 text-white font-semibold"
                    >
                      Detalhe
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!clientSpendRides.length && (
              <p className="p-6 text-xs text-zinc-500">Nenhum gasto registrado ainda.</p>
            )}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Trajeto</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {clientSpendRides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{ride.code}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-zinc-600 dark:text-zinc-400">
                      {ride.origin.address} → {ride.destination.address}
                    </td>
                    <td className="py-3 px-4 font-bold">{formatBRL(ride.grossValue)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge type="ride" status={ride.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{formatDate(ride.requestedAt)}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {(ride.status === 'concluida' || ride.status === 'cancelada') && (
                        <button
                          type="button"
                          onClick={() => downloadRideReceiptPdf(ride, financialMode)}
                          className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-zinc-100 dark:bg-zinc-800 font-semibold inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedRide(ride)}
                        className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-indigo-600 text-white font-semibold"
                      >
                        Detalhe
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <RideDetailsModal ride={selectedRide} onClose={() => setSelectedRide(null)} />
        <Footer />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageSEO page="financeiro" />

      <ManualFinancialNotice />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Módulo Financeiro & Repasses
            </h1>
            <button
              type="button"
              onClick={() => setFinancialMode(financialMode === 'stripe' ? 'manual' : 'stripe')}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                financialMode === 'stripe'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              {financialMode === 'stripe' ? '⚡ Stripe Connect Ativo' : '⚠️ Processamento Manual'}
            </button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Gestão do Split de pagamentos, comissões da plataforma, repasses para motoristas e extratos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Exportar Extrato CSV
          </button>
        </div>
      </header>

      {financialMode === 'stripe' ? (
        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Automação Stripe Connect Ativa:
          </span>
          <StatusBadge type="stripe_feature" status="confirmed" size="sm" />
          <StatusBadge type="stripe_feature" status="webhook" size="sm" />
          <StatusBadge type="stripe_feature" status="split" size="sm" />
          <StatusBadge type="stripe_feature" status="auto_commission" size="sm" />
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Status Geral: Todos os registros estão sinalizados como "Pendente / Estimativa Manual".</span>
        </div>
      )}

      <section aria-label="Métricas financeiras" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
        <MetricCard
          title="Valor Bruto Processado"
          value={formatBRL(totalGross)}
          subtitle={financialMode === 'stripe' ? 'Confirmado via Stripe' : 'Estimativa Não Confirmada'}
        />
        <MetricCard
          title="Taxa Stripe (3.9% + R$0.50)"
          value={financialMode === 'stripe' ? formatBRL(totalStripeFees) : 'R$ 0,00'}
          subtitle={financialMode === 'stripe' ? 'Deduzido na Origem' : 'Desativado no Modo Manual'}
        />
        <MetricCard
          title="Comissão Plataforma (15%)"
          value={formatBRL(totalPlatformCut)}
          subtitle={financialMode === 'stripe' ? 'Retenção Automática' : 'Pendente de Confirmação'}
        />
        <MetricCard
          title="Comissão Empresas (10%)"
          value={formatBRL(totalCompanyCut)}
          subtitle="Repasse Frota"
        />
        <MetricCard
          title="Líquido Motoristas"
          value={formatBRL(totalDriverNet)}
          subtitle="Saldo a Pagar"
        />
        <MetricCard
          title="Saldo Disponível"
          value={formatBRL(totalPlatformCut + totalCompanyCut)}
          badge={financialMode === 'stripe' ? <span className="text-[10px] bg-emerald-500/20 text-emerald-500 font-bold px-1.5 py-0.5 rounded">Liberado</span> : <span className="text-[10px] bg-amber-500/20 text-amber-500 font-bold px-1.5 py-0.5 rounded">Pendente</span>}
        />
      </section>

      <section aria-labelledby="financeiro-extrato" className="p-5 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 id="financeiro-extrato" className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Extrato Detalhado de Lançamentos
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Histórico completo de pagamentos, repasses, comissões e taxas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SafeSelect
              value={filterType}
              onChange={setFilterType}
              label="Tipo"
              buttonClassName="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
              options={[
                { value: 'todos', label: 'Todos os Tipos' },
                { value: 'corrida', label: 'Corridas' },
                { value: 'repasse', label: 'Repasses' },
                { value: 'comissao', label: 'Comissões' },
                { value: 'estorno', label: 'Estornos' },
              ]}
            />
          </div>
        </div>

        <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          {filteredTx.map((tx) => (
            <div key={tx.id} className="p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-indigo-600 text-xs">{tx.code}</span>
                <StatusBadge type="payment" status={financialMode === 'stripe' ? tx.status : 'pendente'} size="sm" />
              </div>
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{tx.description}</div>
              <div className="text-[11px] text-zinc-500 truncate">{tx.sender} → {tx.recipient}</div>
              <div className="flex justify-between text-xs pt-1">
                <span className="font-bold">{formatBRL(tx.amount)}</span>
                <span className="text-zinc-400">{formatDate(tx.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium bg-zinc-50/50 dark:bg-zinc-900/50">
                <th className="py-3 px-4">Código TX</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Remetente → Destinatário</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4">Status & Modo</th>
                <th className="py-3 px-4 text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredTx.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{tx.code}</td>
                  <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{tx.description}</td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                    {tx.sender} → <strong className="text-zinc-900 dark:text-zinc-100">{tx.recipient}</strong>
                  </td>
                  <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">{formatBRL(tx.amount)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge type="payment" status={financialMode === 'stripe' ? tx.status : 'pendente'} size="sm" />
                      <span className="text-[10px] text-zinc-400 font-mono">
                        ({financialMode === 'stripe' ? 'Stripe Connect' : 'Manual'})
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-400">{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <summary className="px-5 py-4 cursor-pointer font-semibold text-sm text-zinc-900 dark:text-zinc-100 select-none hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
          Modelo de recebimento — fluxo financeiro por corrida
        </summary>
        <div className="px-1 pb-1">
          <StripeFlowTimeline grossValue={250} />
        </div>
      </details>

      <Footer />
    </PageContainer>
  );
};
