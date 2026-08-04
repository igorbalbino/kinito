import React, { useState } from 'react';
import { KeyRound, Shield, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { PageSEO } from '../components/common/PageSEO';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';
import { sessionDisplayProfile } from '../lib/sessionProfile';
import { changePassword, isApiConfigured, getApiToken } from '../lib/api';

export const PerfilView: React.FC = () => {
  const { activeRole } = useAppStore();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const profile = sessionDisplayProfile(activeRole);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);

    if (newPassword || confirmPassword || currentPassword) {
      if (newPassword !== confirmPassword) {
        setPwdError('A confirmação de senha não confere.');
        return;
      }
      if (isApiConfigured() && getApiToken()) {
        try {
          await changePassword(currentPassword, newPassword);
        } catch (err) {
          setPwdError(err instanceof Error ? err.message : 'Falha ao alterar senha');
          return;
        }
      }
    }

    setSavedSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <PageContainer narrow>
      <PageSEO page="perfil" />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Meu Perfil & Configurações de Segurança
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Gerencie seus dados pessoais, credenciais de acesso e autenticação de dois fatores (2FA).
        </p>
      </div>

      <form onSubmit={handleSave} autoComplete="off" className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-6 text-xs">
        <div className="flex items-center gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl uppercase shadow-md">
            {profile.name.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{profile.name}</h3>
            <p className="text-zinc-500 font-medium">{profile.roleTitle}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500">
              Sessão Ativa Autenticada
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Nome de Exibição</label>
            <input
              type="text"
              name="display_name"
              autoComplete="off"
              defaultValue={profile.name}
              className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Endereço de E-mail</label>
            <input
              type="email"
              name="display_email"
              autoComplete="off"
              defaultValue={profile.email}
              className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-500" /> Alterar Senha de Acesso
          </h4>

          {pwdError && <p className="text-xs text-rose-500 font-medium">{pwdError}</p>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Senha Atual</label>
              <input
                type="password"
                name="kinito_pwd_current"
                autoComplete="off"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Nova Senha</label>
              <input
                type="password"
                name="kinito_pwd_new"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Confirmar Nova Senha</label>
              <input
                type="password"
                name="kinito_pwd_confirm"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            <Shield className="w-4 h-4 text-emerald-500" /> Conta autenticada via API
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Alterações salvas!
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </form>

      <Footer />
    </PageContainer>
  );
};
