import React, { useEffect, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import { downloadCSV, formatBRL } from '../lib/utils';
import { fetchConsolidatedReport } from '../lib/api';
import { PageSEO } from '../components/common/PageSEO';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';

type ReportItem = {
  code?: string;
  status?: string;
  client?: string;
  driver?: string;
  company?: string;
  partnerCompany?: string;
  grossValue?: number;
  companyCut?: number;
  driverNet?: number;
  requestedAt?: string;
};

export const RelatoriosView: React.FC = () => {
  const [reportType, setReportType] = useState('receita_faturamento');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [items, setItems] = useState<ReportItem[]>([]);
  const [totals, setTotals] = useState({ rides: 0, gross: 0, companyCut: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void fetchConsolidatedReport()
      .then((res) => {
        const all = [...(res.own?.items ?? []), ...(res.received?.items ?? []), ...(res.forwarded?.items ?? [])];
        setItems(all);
        setTotals(res.totals ?? { rides: 0, gross: 0, companyCut: 0 });
        setLoadError(null);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Falha ao carregar relatórios');
      });
  }, []);

  const handleExport = () => {
    const rows = items.map((r) => ({
      CodigoCorrida: r.code,
      Cliente: r.client,
      Empresa: r.company,
      Parceira: r.partnerCompany || '',
      Motorista: r.driver || 'Pendente',
      ValorBruto: r.grossValue,
      CorteEmpresa: r.companyCut,
      LiquidoMotorista: r.driverNet,
      Status: r.status,
      DataSolicitacao: r.requestedAt,
    }));
    downloadCSV(`relatorio_${reportType}_kinito.csv`, rows);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <PageContainer>
      <PageSEO page="relatorios" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Central de Relatórios
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Dados consolidados da API: próprias, recebidas e encaminhadas.
          </p>
        </div>
      </div>

      {loadError && <p className="text-xs text-rose-600 font-medium">{loadError}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-[11px] text-zinc-500">Corridas no consolidado</p>
          <p className="text-lg font-bold">{totals.rides}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-[11px] text-zinc-500">Valor bruto</p>
          <p className="text-lg font-bold">{formatBRL(totals.gross)}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-[11px] text-zinc-500">Corte da empresa</p>
          <p className="text-lg font-bold">{formatBRL(totals.companyCut)}</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-5">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Exportar CSV</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => setReportType('receita_faturamento')}
            className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
              reportType === 'receita_faturamento'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Relatório financeiro</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {items.length} corridas no consolidado (own + received + forwarded).
            </p>
          </div>

          <div
            onClick={() => setReportType('desempenho_motoristas')}
            className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
              reportType === 'desempenho_motoristas'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Por motorista</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              O CSV inclui o motorista de cada corrida do consolidado.
            </p>
          </div>

          <div
            onClick={() => setReportType('base_clientes')}
            className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
              reportType === 'base_clientes'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Por cliente</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              O CSV inclui o cliente de cada corrida do consolidado.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Formato de Saída: <strong>CSV</strong> — fonte GET /relatorios/consolidated
          </div>

          <div className="flex items-center gap-3">
            {downloadSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Arquivo baixado com sucesso!
              </span>
            )}
            <button
              onClick={handleExport}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Download className="w-4 h-4" /> Gerar & Baixar Relatório CSV
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </PageContainer>
  );
};
