import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  Hand,
  MessageCircle,
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
import { WhatsAppConnectPanel } from '../components/settings/WhatsAppConnectPanel';
import { PlanBillingPanel } from '../components/settings/PlanBillingPanel';
import { PageContainer } from '../components/layout/PageContainer';
import { isFleetOperator } from '../lib/navByRole';

type ConfigSection = 'plano' | 'whatsapp' | 'mao' | 'financeiro' | 'flags';

export const ConfiguracoesView: React.FC = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const {
    featureFlags,
    toggleFeatureFlag,
    financialMode,
    setFinancialMode,
    handPreference,
    setHandPreference,
    activeRole,
  } = useAppStore();

  const showFleetSettings = isFleetOperator(activeRole);
  const showAdminFlags = activeRole === 'admin';
  const section = (params.get('sec') as ConfigSection | null) || null;

  const openSection = (sec: ConfigSection) => {
    setParams({ sec });
  };

  const backToHub = () => {
    setParams({});
  };

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

  const menuItems = useMemo(() => {
    const items: { id: ConfigSection; title: string; desc: string; icon: React.ReactNode }[] = [];
    if (showFleetSettings) {
      items.push({
        id: 'plano',
        title: 'Plano e indicações',
        desc: 'Assinatura, trial e código de indicação',
        icon: <CreditCard className="w-5 h-5" />,
      });
      items.push({
        id: 'whatsapp',
        title: 'WhatsApp',
        desc: 'Conectar o número da sua empresa',
        icon: <MessageCircle className="w-5 h-5" />,
      });
    }
    items.push({
      id: 'mao',
      title: 'Mão dominante',
      desc: 'Ajuste de navegação com uma mão no celular',
      icon: <Hand className="w-5 h-5" />,
    });
    if (showFleetSettings) {
      items.push({
        id: 'financeiro',
        title: 'Financeiro',
        desc: 'Modo Stripe ou processamento manual',
        icon: <ShieldCheck className="w-5 h-5" />,
      });
    }
    if (showAdminFlags) {
      items.push({
        id: 'flags',
        title: 'Feature flags',
        desc: 'Interruptores do sistema (admin)',
        icon: <Sliders className="w-5 h-5" />,
      });
    }
    return items;
  }, [showFleetSettings, showAdminFlags]);

  return (
    <PageContainer narrow className="pb-24">
      <PageSEO page="configuracoes" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {t.settingsPage.title}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {section ? 'Ajuste a opção selecionada.' : 'Escolha o que deseja configurar.'}
          </p>
        </div>
        {section && (
          <button
            type="button"
            onClick={backToHub}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Menu
          </button>
        )}
      </div>

      {!section && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openSection(item.id)}
              className="text-left p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-indigo-500/40 transition-all space-y-2 active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                {item.icon}
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.title}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
            </button>
          ))}
        </div>
      )}

      {section === 'plano' && showFleetSettings && <PlanBillingPanel />}
      {section === 'whatsapp' && showFleetSettings && <WhatsAppConnectPanel />}

      {section === 'mao' && (
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">Modo Mão Dominante</h3>
              <p className="text-xs text-slate-400">
                Ajusta o botão flutuante e áreas de toque para fácil alcance do polegar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setHandPreference('right')}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 text-xs font-semibold min-h-[64px] active:scale-95 ${
                handPreference === 'right'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Hand className="w-5 h-5 text-indigo-400" />
              <span>Mão Direita</span>
            </button>

            <button
              type="button"
              onClick={() => setHandPreference('left')}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 text-xs font-semibold min-h-[64px] active:scale-95 ${
                handPreference === 'left'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Hand className="w-5 h-5 text-indigo-400 -scale-x-100" />
              <span>Mão Esquerda</span>
            </button>

            <button
              type="button"
              onClick={() => setHandPreference('center')}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 text-xs font-semibold min-h-[64px] active:scale-95 ${
                handPreference === 'center'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-5 h-5 text-indigo-400" />
              <span>Centralizado</span>
            </button>
          </div>
        </div>
      )}

      {section === 'financeiro' && showFleetSettings && (
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
                  Alterne o fluxo operacional para simular Stripe ou modo manual
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
              <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Stripe (Automático)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Badges de confirmação, webhook e split automático.
              </p>
            </div>

            <div
              onClick={() => setFinancialMode('manual')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                financialMode === 'manual'
                  ? 'border-amber-500 bg-amber-500/10 shadow-lg'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Manual
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Valores editáveis e indicadores pendentes de liquidação.
              </p>
            </div>
          </div>
        </div>
      )}

      {section === 'flags' && showAdminFlags && (
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
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
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
