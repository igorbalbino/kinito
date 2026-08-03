import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileCheck,
  Hand,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  Navigation,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { BrandLogo } from '../components/common/BrandLogo';
import { SEOHead } from '../components/common/SEOHead';
import { StatusBadge } from '../components/common/StatusBadge';
import { Footer } from '../components/layout/Footer';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSelector } from '../components/common/LanguageSelector';

export const LandingView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    rides,
    drivers,
    clients,
    companies,
    financialMode,
    setFinancialMode,
    setNewRideModalOpen,
    handPreference,
    setHandPreference,
  } = useAppStore();

  const totalCompleted = rides.filter((r) => r.status === 'concluida').length;
  const totalGross = rides.reduce((acc, r) => acc + r.grossValue, 0);
  const activeDrivers = drivers.filter((d) => d.status === 'ativo').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* Page SEO & AEO Data */}
      <SEOHead
        title="Início & Apresentação"
        description="Plataforma SaaS para despacho tátil de corridas em tempo real, gestão de frotas e repasse financeiro automático via Stripe Connect. Desenvolvido para operabilidade com uma mão."
        keywords={[
          'sistema de despacho de corridas',
          'gestão de frotas',
          'split financeiro stripe',
          'despacho tátil 1 mão',
          'plataforma para frotas de táxi e executivos',
          'creatioinc',
        ]}
        category="Apresentação SaaS & Logística"
        prerenderRoutes={['/', '/login', '/register', '/dashboard']}
        jsonLdSchema={{
          '@type': 'FAQPage',
          'mainEntity': [
            {
              '@type': 'Question',
              'name': 'O que é o Kinito?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'O Kinito é um software SaaS completo para empresas de logística, distribuidoras e frotas de transporte de passageiros ou cargas. Oferece despacho em tempo real, gestão de parceiros e split de pagamento via Stripe ou modo manual.',
              },
            },
            {
              '@type': 'Question',
              'name': 'Como funciona a tecnologia de uso com apenas uma mão?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'A interface foi desenhada ergonomicamente para operadores no celular em trânsito. O botão flutuante e gavetas móveis ajustam a zona de toque para o polegar esquerdo, direito ou ambidestro.',
              },
            },
            {
              '@type': 'Question',
              'name': 'Como o split financeiro via Stripe calcula os repasses?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Cada corrida calcula automaticamente a taxa do gateway (Stripe), a comissão retida da plataforma (15%), a fatia da empresa parceira e o valor líquido exato repassado ao motorista.',
              },
            },
          ],
        }}
      />

      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl px-4 lg:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <BrandLogo className="w-9 h-9 shadow-lg" />
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Kinito <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">SaaS</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">Gestão Inteligente de Corridas & Frotas</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="compact" />

            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white font-bold text-xs active:scale-95 transition-all min-h-[40px]"
            >
              {t.nav.login}
            </button>
            <button
              onClick={() => navigate('/register')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-600/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-500/10 active:scale-95 transition-all min-h-[40px]"
            >
              {t.nav.register}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-2 min-h-[40px]"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t.nav.dashboard}</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 px-4 lg:px-8 overflow-hidden bg-gradient-to-b from-indigo-950/20 via-[#09090b] to-[#09090b]">
        {/* Glow effect background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold animate-in fade-in duration-500">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.landing.tag}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-100 leading-[1.15]">
            {t.landing.titleLine1} <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-indigo-500">
              {t.landing.titleLine2}
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {t.landing.subtitle}
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-3 min-h-[52px]"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>{t.landing.accessDashboard}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setNewRideModalOpen(true)}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 text-slate-100 font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[52px]"
            >
              <Car className="w-5 h-5 text-indigo-400" />
              <span>{t.landing.createNewRide}</span>
            </button>
          </div>

          {/* Live System Metrics Strip */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xs text-slate-400 font-medium">Corridas Registradas</div>
              <div className="text-xl font-bold text-slate-100 mt-1">{rides.length} serviços</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">{totalCompleted} concluídas</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xs text-slate-400 font-medium">Volume Bruto Movimentado</div>
              <div className="text-xl font-bold text-slate-100 mt-1">
                R$ {totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-indigo-400 mt-0.5">Com split automatizado</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xs text-slate-400 font-medium">Motoristas Habilitados</div>
              <div className="text-xl font-bold text-slate-100 mt-1">{drivers.length} ativos</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">{activeDrivers} com CNH auditada</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xs text-slate-400 font-medium">Empresas Parceiras</div>
              <div className="text-xl font-bold text-slate-100 mt-1">{companies.length} frotas</div>
              <div className="text-[10px] text-amber-400 mt-0.5">{clients.length} clientes cadastrados</div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE VALUE PROPOSITIONS & EXPLANATORY CARDS */}
      <section className="py-12 px-4 lg:px-8 max-w-7xl mx-auto space-y-12 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Como o Kinito transforma a gestão da sua frota
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Projetado para eliminar erros operacionais, perdas de tempo no telefone e atrasos em repasses financeiros.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Ergonomia Tátil 1 Mão */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 hover:border-indigo-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Hand className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                1. Operação Tátil com 1 Mão
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Operadores em campo e motoristas utilizam o sistema no celular sem precisar das duas mãos. Botão
                flutuante ajustável para o polegar esquerdo ou direito e gavetas com puxadores táteis.
              </p>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-indigo-400">
              <span>Ajuste a Mão Dominante</span>
              <Smartphone className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Split Financeiro Stripe */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                2. Split Financeiro Stripe
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Cada corrida dividida com precisão cirúrgica: comissão de 15% retida na origem, repasse líquido ao
                motorista e taxas do gateway deduzidas automaticamente via webhook.
              </p>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Status Stripe Transparente</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Auditoria de Motoristas */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                3. Auditoria de CNH & Documentos
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Workflow completo para aprovação ou rejeição de documentação obrigatoria (CNH, CRLV, Prontuário, Antecedentes).
                Garanta 100% da sua frota regularizada.
              </p>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Validação em Segundos</span>
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* QUICK NAVIGATION MODULES GRID */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-[#121215] to-[#121215] border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                Módulos Integrados da Plataforma
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clique para navegar diretamente para a funcionalidade desejada
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 active:scale-95 transition-all self-start sm:self-auto"
            >
              <span>Ver Todos no Painel</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <button
              onClick={() => navigate('/corridas')}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-200 hover:text-white transition-all text-left space-y-2 group"
            >
              <Car className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="font-bold">Corridas & Despacho</div>
              <div className="text-[10px] text-slate-400">Atribuição por raio</div>
            </button>

            <button
              onClick={() => navigate('/financeiro')}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-200 hover:text-white transition-all text-left space-y-2 group"
            >
              <CreditCard className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="font-bold">Financeiro & Split</div>
              <div className="text-[10px] text-slate-400">Extratos Stripe</div>
            </button>

            <button
              onClick={() => navigate('/motoristas')}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-200 hover:text-white transition-all text-left space-y-2 group"
            >
              <UserCheck className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="font-bold">Motoristas</div>
              <div className="text-[10px] text-slate-400">Validação de CNH</div>
            </button>

            <button
              onClick={() => navigate('/clientes')}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-200 hover:text-white transition-all text-left space-y-2 group"
            >
              <Users className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="font-bold">Clientes VIP</div>
              <div className="text-[10px] text-slate-400">Histórico de viagens</div>
            </button>

            <button
              onClick={() => navigate('/empresas')}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-200 hover:text-white transition-all text-left space-y-2 group"
            >
              <Building2 className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <div className="font-bold">Frotas & Empresas</div>
              <div className="text-[10px] text-slate-400">Distribuição SaaS</div>
            </button>

            <button
              onClick={() => navigate('/configuracoes')}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-200 hover:text-white transition-all text-left space-y-2 group"
            >
              <Zap className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
              <div className="font-bold">Ergonomia & Flags</div>
              <div className="text-[10px] text-slate-400">Modo 1-Mão</div>
            </button>
          </div>
        </div>

        {/* HUMAN FAQ SECTION - AEO / Answer Engine Optimization */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Perguntas Frequentes & Entendimento do Sistema</h3>
              <p className="text-xs text-slate-400">Respostas claras para operadores, gestores de frota e motoristas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Como funciona o Despacho com Apenas Uma Mão?
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Desenvolvemos o sistema pensando no operador em trânsito ou segurando pranchistas/celulares. O botão
                flutuante e ações de criação ajustam-se dinamicamente ao alcance do seu polegar (esquerdo ou direito),
                garantindo que qualquer despacho seja concluído em menos de 3 toques.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Como o Split de Pagamento do Stripe evita conflitos?
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Ao finalizar uma corrida, o valor bruto é retido e fragmentado automaticamente: 15% para a plataforma,
                fatia da empresa parceira e o saldo exato transferido para a conta bancária do motorista via Stripe Connect,
                sem dependência de planilhas manuais.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Posso testar sem conectar chaves de API do Stripe?
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Sim! No menu de Configurações você pode alternar entre o modo <strong>Stripe Automático</strong> e o modo
                <strong> Manual</strong> para visualizar como a aplicação se comporta com estimativas ou pagamentos presenciais em dinheiro/faturado.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Como é feita a auditoria de motoristas?
              </h4>
              <p className="text-slate-300 leading-relaxed">
                No módulo de Motoristas, a equipe de checagem analisa os 4 documentos regulamentares (CNH, CRLV, Antecedentes e Foto).
                Se algum documento for rejeitado, o motorista não recebe chamadas até regularizar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Required Footer */}
      <Footer />
    </div>
  );
};
