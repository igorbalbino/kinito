import React from 'react';
import {
  AlertTriangle,
  CreditCard,
  Globe,
  Hand,
  ShieldCheck,
  Sliders,
  Smartphone,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { PageSEO } from '../components/common/PageSEO';
import { Footer } from '../components/layout/Footer';
import { FeatureFlags } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Language } from '../i18n/translations';
import { WhatsAppConnectPanel } from '../components/settings/WhatsAppConnectPanel';
import { PlanBillingPanel } from '../components/settings/PlanBillingPanel';
import { PageContainer } from '../components/layout/PageContainer';
import { isClientRole, isFleetOperator } from '../lib/navByRole';

export const ConfiguracoesView: React.FC = () => {
  const { t, language, setLanguage, options } = useTranslation();
  const {
    featureFlags,
    toggleFeatureFlag,
    financialMode,
    setFinancialMode,
    handPreference,
    setHandPreference,
    activeRole,
  } = useAppStore();

  const clientMode = isClientRole(activeRole);
  const showFleetSettings = isFleetOperator(activeRole);
  const showAdminFlags = activeRole === 'admin';

  const flagLabels: { key: keyof FeatureFlags; title: string; desc: string }[] = [
    { key: 'saasMode', title: 'Modo SaaS Multi-tenant', desc: 'Isolamento de dados por empresas distribuidoras e frotas.' },
    { key: 'stripe', title: 'Integração Processamento Stripe', desc: 'Habilita Split de Pagamentos e Webhooks automáticos.' },
    { key: 'comissaoAutomatica', title: 'Comissão Automática de Plataforma', desc: 'Calcula retenção de 15% na origem da transação.' },
    { key: 'geolocalizacao', title: 'Geolocalização & Roteamento GPS', desc: 'Rastreio em tempo real de motoristas por coordenadas.' },
    { key: 'apiPublica', title: 'API Pública de Integração (REST/Webhooks)', desc: 'Fornece chaves de API para ERPs de terceiros.' },
    { key: 'logsAvancados', title: 'Logs Avançados do Sistema', desc: 'Registra eventos detalhados de requisições e retornos.' },
    { key: 'notificacoesPush', title: 'Notificações em Tempo Real', desc: 'Alertas sonoros e visuais para despacho de corridas.' },
    { key: 'moduloClientes', title: 'Módulo de Gestão de Clientes', desc: 'Exibe telas e relatórios de clientes na sidebar.' },
    { key: 'moduloMotoristas', title: 'Módulo de Aprovação de Motoristas', desc: 'Habilita workflow de validação de CNH e CRLV.' },
    { key: 'relatoriosFinanceiros', title: 'Relatórios Financeiros Consolidados', desc: 'Permite exportação de relatórios em formato CSV/Excel.' },
    { key: 'auditoriaSistema', title: 'Trilha de Auditoria de Segurança', desc: 'Registra IP, data e usuário em alterações de estado.' },
  ];

  return (
    <PageContainer narrow className="pb-24">
      <PageSEO page="configuracoes" />

      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {t.settingsPage.title}
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          {clientMode
            ? 'Preferências do seu painel: idioma e navegação no celular.'
            : t.settingsPage.subtitle}
        </p>
      </div>

      {showFleetSettings && (
        <>
          <PlanBillingPanel />
          <WhatsAppConnectPanel />
        </>
      )}

      <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {t.settingsPage.languageTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione o idioma de preferência do painel operacional (Português, English, Español, Italiano).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {options.map((opt) => {
            const isSelected = opt.code === language;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code as Language)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-600 text-indigo-700 dark:text-white shadow-md font-bold'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <span className="text-3xl">{opt.flag}</span>
                <span className="text-xs font-bold">{opt.label}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{opt.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-100">
              Modo Mão Dominante (Navegação Tátil com 1 Mão)
            </h3>
            <p className="text-xs text-slate-400">
              Ajusta o botão flutuante e áreas de toque para fácil alcance do polegar direito ou esquerdo no celular.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setHandPreference('right')}
            className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 text-xs font-semibold min-h-[64px] active:scale-95 ${
              handPreference === 'right'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Hand className="w-5 h-5 text-indigo-400" />
            <span>Mão Direita (Polegar no Canto Direito)</span>
          </button>

          <button
            onClick={() => setHandPreference('left')}
            className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 text-xs font-semibold min-h-[64px] active:scale-95 ${
              handPreference === 'left'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Hand className="w-5 h-5 text-indigo-400 -scale-x-100" />
            <span>Mão Esquerda (Polegar no Canto Esquerdo)</span>
          </button>

          <button
            onClick={() => setHandPreference('center')}
            className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 text-xs font-semibold min-h-[64px] active:scale-95 ${
              handPreference === 'center'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <span>Centralizado (Acesso Ambidestro)</span>
          </button>
        </div>
      </div>

      {showFleetSettings && (
        <div className="p-6 rounded-2xl border border-indigo-500/40 bg-white/5 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-slate-100">
                  Processamento Financeiro (Stripe vs Manual)
                </h3>
                <p className="text-xs text-slate-400">
                  Alterne o fluxo operacional para simular chamadas e webhooks reais do Stripe
                </p>
              </div>
            </div>

            <StatusBadge
              type="stripe_feature"
              status={financialMode === 'stripe' ? 'confirmed' : 'split'}
              size="sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setFinancialMode('stripe')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                financialMode === 'stripe'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Opção 1: Stripe (Automático)
                </span>
                {financialMode === 'stripe' && (
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Exibe badges <strong>"Pagamento Confirmado"</strong>, <strong>"Webhook Recebido"</strong>, <strong>"Repasse Calculado"</strong> e <strong>"Comissão Automática"</strong>. Calcula automaticamente taxas de processamento, split por empresa e repasse direto do motorista.
              </p>

              {financialMode === 'stripe' && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  <StatusBadge type="stripe_feature" status="confirmed" size="sm" />
                  <StatusBadge type="stripe_feature" status="webhook" size="sm" />
                  <StatusBadge type="stripe_feature" status="split" size="sm" />
                  <StatusBadge type="stripe_feature" status="auto_commission" size="sm" />
                </div>
              )}
            </div>

            <div
              onClick={() => setFinancialMode('manual')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                financialMode === 'manual'
                  ? 'border-amber-500 bg-amber-500/10 shadow-lg'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Opção 2: Manual (Incompleto)
                </span>
                {financialMode === 'manual' && (
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Oculta os badges do Stripe. Exibe campos editáveis para Valor da Corrida, Valor do Motorista e Comissão. Todos os indicadores financeiros passam a ser sinalizados como <strong>"Pendente"</strong> ou <strong>"Incompleto"</strong> com alertas visuais.
              </p>

              {financialMode === 'manual' && (
                <div className="pt-2">
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                    ⚠️ Estimativas Pendentes de Confirmação Manual
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAdminFlags && (
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
          <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Feature Flags do Sistema
          </h3>

          <div className="divide-y divide-white/10">
            {flagLabels.map((flag) => {
              const isChecked = featureFlags[flag.key];

              return (
                <div key={flag.key} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-xs text-slate-200">{flag.title}</h4>
                    <p className="text-[11px] text-slate-400">{flag.desc}</p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleFeatureFlag(flag.key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Footer />
    </PageContainer>
  );
};
