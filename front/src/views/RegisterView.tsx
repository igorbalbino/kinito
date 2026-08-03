import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, UserCheck, Users, ShieldCheck, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { useAppStore } from '../store/useAppStore';
import { UserRole } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSelector } from '../components/common/LanguageSelector';

export const RegisterView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setActiveRole, addNotification } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('empresa');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { role: 'empresa' as UserRole, label: 'Empresa / Gestor de Frota', desc: 'Controle corridas, faturamento e repasses Stripe', icon: Building2 },
    { role: 'motorista' as UserRole, label: 'Motorista Autônomo', desc: 'Envie documentos de CNH e receba repasses em conta', icon: UserCheck },
    { role: 'cliente' as UserRole, label: 'Cliente Corporativo', desc: 'Solicite faturamentos e acompanhe suas viagens', icon: Users },
  ];

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      alert('Você precisa aceitar os termos de uso para criar uma conta.');
      return;
    }
    setLoading(true);

    setActiveRole(role);
    addNotification({
      title: 'Conta Criada com Sucesso',
      message: `Bem-vindo(a) ao FleetPulse Pro, ${name || 'Gestor'}! Sua conta foi ativada.`,
      type: 'success',
      category: 'sistema',
    });

    setTimeout(() => {
      navigate('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      <SEOHead
        title="Cadastro & Nova Conta SaaS"
        description="Crie sua conta no FleetPulse Pro em menos de 1 minuto. Inicie o teste grátis com despacho tátil, split financeiro Stripe e gestão de frotas."
        keywords={['cadastro fleetpulse', 'criar conta frota', 'registrar empresa de transporte']}
        category="Cadastro SaaS"
        jsonLdSchema={{
          '@type': 'WebPage',
          'name': 'Página de Cadastro de Nova Conta FleetPulse Pro',
          'about': 'Formulário de cadastro pré-renderizado para rápido onboarding de parceiros e frotas.',
        }}
        prerenderRoutes={['/', '/login', '/register', '/dashboard']}
      />

      {/* Header Bar */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            FP
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100 block leading-none">
              FleetPulse Pro
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">SaaS de Despacho & Frota</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSelector variant="compact" />
          <Link
            to="/login"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            {t.auth.hasAccount} {t.nav.login}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Register Form */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {t.auth.registerTitle}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t.auth.registerSub}
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Account Type Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Tipo de Perfil
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {roleOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = role === opt.role;
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => setRole(opt.role)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-indigo-500" />
                      <div>
                        <div className="text-xs font-bold leading-tight">{opt.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-snug">
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  E-mail Profissional
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {role === 'empresa' && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Nome da Empresa / Frota
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Veloce Transporte Express"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Crie uma Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  Concordo com os <a href="#" onClick={(e) => { e.preventDefault(); alert('Termos de Uso do FleetPulse Pro'); }} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Termos de Serviço</a> e a Política de Privacidade.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Criando Conta...</span>
              ) : (
                <>
                  <span>Concluir Cadastro e Acessar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-center text-xs text-slate-500">
            Já possui cadastro?{' '}
            <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Fazer login
            </Link>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
        FleetPulse Pro © {new Date().getFullYear()} • Powered by <a href="https://creatioinc.com" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">creatioinc.com</a>
      </footer>
    </div>
  );
};
