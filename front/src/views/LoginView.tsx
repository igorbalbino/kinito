import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { SEOHead } from '../components/common/SEOHead';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { apiLogin, clearApiSession, isApiConfigured } from '../lib/api';
import { roleFromApi } from '../lib/mappers';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setActiveRole } = useAppStore();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isApiConfigured()) {
      setError('Configure VITE_API_URL para autenticar na API.');
      setLoading(false);
      return;
    }

    try {
      const { user } = await apiLogin(login, password);
      setPassword('');
      setActiveRole(roleFromApi(user.roles));
      navigate('/dashboard');
    } catch (err) {
      const e = err as Error & { email_unverified?: boolean; email?: string };
      if (e.email_unverified && e.email) {
        navigate(`/verificar-email-pendente?email=${encodeURIComponent(e.email)}`);
        return;
      }
      setError(e instanceof Error ? e.message : 'Falha no login da API');
      clearApiSession();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      <SEOHead
        title={t.seo.login.title}
        description={t.seo.login.description}
        keywords={t.seo.login.keywords}
        category={t.seo.login.category}
        canonicalUrl="/login"
      />

      <header className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-3 group">
          <BrandLogo className="w-10 h-10 shadow-lg group-hover:scale-105 transition-transform" />
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100 block leading-none">
              Kinito
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Gestão de Corridas & Frota</span>
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                E-mail ou telefone
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="seu@email.com ou telefone"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Senha
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Recuperação de senha enviada para ' + login); }} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

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

      <footer className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Kinito © {new Date().getFullYear()} • Powered by <a href="https://creatioinc.com" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">creatioinc.com</a>
      </footer>
    </div>
  );
};
