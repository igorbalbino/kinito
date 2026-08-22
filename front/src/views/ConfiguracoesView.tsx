import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CreditCard,
  Hand,
  MessageCircle,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { PageSEO } from '../components/common/PageSEO';
import { Footer } from '../components/layout/Footer';
import { useTranslation } from '../hooks/useTranslation';
import { WhatsAppConnectPanel } from '../components/settings/WhatsAppConnectPanel';
import { PlanBillingPanel } from '../components/settings/PlanBillingPanel';
import { RideModelPanel } from '../components/settings/RideModelPanel';
import { ProviderSummaryPanel } from '../components/settings/ProviderSummaryPanel';
import { PageContainer } from '../components/layout/PageContainer';
import { isClientRole, isFleetOperator } from '../lib/navByRole';

type ConfigSection = 'plano' | 'whatsapp' | 'mao' | 'financeiro' | 'modelo' | 'fornecedor';

export const ConfiguracoesView: React.FC = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const {
    financialMode,
    handPreference,
    setHandPreference,
    activeRole,
  } = useAppStore();

  const showFleetSettings = isFleetOperator(activeRole);
  const showProviderSettings = isClientRole(activeRole) || activeRole === 'motorista';
  const section = (params.get('sec') as ConfigSection | null) || null;

  const openSection = (sec: ConfigSection) => {
    setParams({ sec });
  };

  const backToHub = () => {
    setParams({});
  };

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
        id: 'modelo',
        title: 'Modelo de negócio',
        desc: 'Instantâneo, agendamento ou ambos',
        icon: <CalendarClock className="w-5 h-5" />,
      });
      items.push({
        id: 'whatsapp',
        title: 'WhatsApp',
        desc: 'Conectar o número da sua empresa',
        icon: <MessageCircle className="w-5 h-5" />,
      });
    }
    if (showProviderSettings) {
      items.push({
        id: 'fornecedor',
        title: 'Fornecedor principal',
        desc: 'Empresa padrão para corridas',
        icon: <Building2 className="w-5 h-5" />,
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
        desc: 'Status Stripe / manual (somente leitura)',
        icon: <ShieldCheck className="w-5 h-5" />,
      });
    }
    return items;
  }, [showFleetSettings, showProviderSettings]);

  return (
    <PageContainer narrow className="pb-24">
      <PageSEO page="configuracoes" />

      <header className="flex items-start justify-between gap-3">
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
      </header>

      {!section && (
        <section aria-label="Menu de configurações" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </section>
      )}

      {section === 'plano' && showFleetSettings && <PlanBillingPanel />}
      {section === 'modelo' && showFleetSettings && <RideModelPanel />}
      {section === 'whatsapp' && showFleetSettings && <WhatsAppConnectPanel />}
      {section === 'fornecedor' && showProviderSettings && <ProviderSummaryPanel />}

      {section === 'mao' && (
        <section aria-labelledby="config-mao" className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 id="config-mao" className="font-semibold text-base text-slate-100">Modo Mão Dominante</h2>
              <p className="text-xs text-slate-400">
                Ajusta o botão flutuante e áreas de toque para fácil alcance do polegar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setHandPreference('right')}
              aria-pressed={handPreference === 'right'}
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
              aria-pressed={handPreference === 'left'}
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
              aria-pressed={handPreference === 'center'}
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
        </section>
      )}

      {section === 'financeiro' && showFleetSettings && (
        <section aria-labelledby="config-financeiro" className="p-6 rounded-2xl border border-indigo-500/40 bg-white/5 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 id="config-financeiro" className="font-semibold text-base text-slate-100">
                  Processamento Financeiro
                </h2>
                <p className="text-xs text-slate-400">
                  Status definido pela plataforma (PAYMENT_PROVIDER) — somente leitura
                </p>
              </div>
            </div>
            <StatusBadge
              type="stripe_feature"
              status={financialMode === 'stripe' ? 'confirmed' : 'split'}
              size="sm"
            />
          </div>

          <div
            className={`p-5 rounded-2xl border-2 space-y-2 ${
              financialMode === 'stripe'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-amber-500 bg-amber-500/10'
            }`}
          >
            <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {financialMode === 'stripe' ? 'Stripe (Automático)' : 'Manual'}
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {financialMode === 'stripe'
                ? 'Webhooks, PaymentIntent e split automático ativos.'
                : 'Sem taxa de plataforma/Stripe. Valores estimados até conferência manual.'}
            </p>
          </div>
        </section>
      )}

      <Footer />
    </PageContainer>
  );
};
