import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Filter, CheckCircle2 } from 'lucide-react';
import { downloadCSV, formatBRL } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { SEOHead } from '../components/common/SEOHead';
import { Footer } from '../components/layout/Footer';

export const RelatoriosView: React.FC = () => {
  const { rides, drivers, clients, companies } = useAppStore();
  const [reportType, setReportType] = useState('receita_faturamento');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = () => {
    let rows: Record<string, any>[] = [];

    if (reportType === 'receita_faturamento') {
      rows = rides.map((r) => ({
        CodigoCorrida: r.code,
        Cliente: r.clientName,
        Empresa: r.companyName,
        Motorista: r.driverName || 'Pendente',
        ValorBruto: r.grossValue,
        TaxaStripe: r.stripeFee,
        ComissaoPlataforma: r.platformCommission,
        LiquidoMotorista: r.driverNet,
        Status: r.status,
        DataSolicitacao: r.requestedAt,
      }));
    } else if (reportType === 'desempenho_motoristas') {
      rows = drivers.map((d) => ({
        NomeMotorista: d.name,
        Empresa: d.companyName,
        Veiculo: d.vehicleModel,
        Placa: d.vehiclePlate,
        Avaliacao: d.rating,
        TotalCorridas: d.totalRides,
        GanhosTotais: d.totalEarnings,
        Status: d.status,
      }));
    } else {
      rows = clients.map((c) => ({
        NomeCliente: c.name,
        Email: c.email,
        EmpresaCorporativa: c.companyName || 'Nenhuma',
        TotalCorridas: c.totalRides,
        GastoTotal: c.totalSpent,
        Status: c.status,
      }));
    }

    downloadCSV(`relatorio_${reportType}_kinito.csv`, rows);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <SEOHead
        title="Central de Relatórios & Business Intelligence"
        description="Geração e exportação de relatórios gerenciais CSV. Análise de faturamento bruto, margens de lucro, comissões de parceiros e produtividade da frota."
        keywords={['relatórios de frota', 'business intelligence transporte', 'exportação CSV faturamento']}
        category="Módulo de Relatórios SaaS"
        jsonLdSchema={{
          '@type': 'WebPage',
          'name': 'Central de Exportação de Relatórios de Transportes',
          'about': 'Ferramenta de exportação de dados analíticos em lote para contabilidade e auditoria.',
        }}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Central de Relatórios & Business Intelligence
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Gere e exporte relatórios consolidados de receitas, desempenho de motoristas e volume de serviços.
          </p>
        </div>
      </div>

      {/* Report Builder Controls */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-5">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
          Selecione o Modelo de Relatório para Exportação
        </h3>

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
            <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Relatório Financeiro & Receita</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Consolidado de valores brutos, comissão de 15%, taxas Stripe e líquido de motoristas.
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
            <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Desempenho da Frota</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Corridas realizadas por motorista, avaliações dos clientes e totais repassados.
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
            <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Atividade dos Clientes</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Histórico de uso, gastos totais por cliente corporativo e engajamento.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Formato de Saída: <strong>CSV / Excel Compatível</strong>
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

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
