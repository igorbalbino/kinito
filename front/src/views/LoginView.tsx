import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Building2, Users, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { useAppStore } from '../store/useAppStore';
import { UserRole } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSelector } from '../components/common/LanguageSelector';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setActiveRole } = useAppStore();

  const [email, setEmail] = useState('admin@fleetpulse.com');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const rolePresets = [
    { role: 'admin' as UserRole, label: 'Admin Master', email: 'admin@fleetpulse.com', icon: ShieldCheck },
    { role: 'empresa' as UserRole, label: 'Empresa / Frota', email: 'contato@velocelog.com.br', icon: Building2 },
    { role: 'motorista' as UserRole, label: 'Motorista', email: 'gabriel.silva@motorista.com', icon: UserCheck },
    { role: 'cliente' as UserRole, label: 'Cliente VIP', email: 'lucas.santos@gmail.com', icon: Users },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setActiveRole(selectedRole);
    setTimeout(() => {
      navigate('/dashboard');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      <SEOHead
        title={t.auth.loginTitle}
        description={t.auth.loginSub}
        keywords={['login fleetpulse', 'acesso sistema de frota', 'login despacho de corridas']}
        category="Autenticação SaaS"
        jsonLdSchema={{
          '@type': 'WebPage',
          'name': 'Página de Acesso do Usuário FleetPulse Pro',
          'about': 'Formulário de login pré-renderizado para rápido acesso operacional.',
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
            to="/register"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            {t.auth.createAccount}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Login Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {t.auth.loginTitle}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t.auth.loginSub}
            </p>
          </div>

          {/* Quick Role Switcher Buttons */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Perfil de Acesso
            </label>
            <div className="grid grid-cols-2 gap-2">
              {rolePresets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedRole === preset.role;
                return (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(preset.role);
                      setEmail(preset.email);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="truncate text-xs">
                      <div className="truncate font-semibold">{preset.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Senha
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Recuperação de senha enviada para ' + email); }} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Lembrar neste navegador
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Iniciando sessão...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-center text-xs text-slate-500">
            Ainda não tem conta?{' '}
            <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Cadastre-se gratuitamente
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
