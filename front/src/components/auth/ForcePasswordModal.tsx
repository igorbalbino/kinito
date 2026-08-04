import React, { useEffect, useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { changePassword, getStoredApiUser, isApiConfigured } from '../../lib/api';

export const ForcePasswordModal: React.FC = () => {
  const user = getStoredApiUser();
  const mustChange = Boolean(isApiConfigured() && user?.mustChangePassword);
  const [open, setOpen] = useState(mustChange);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOpen(mustChange);
  }, [mustChange]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await changePassword(currentPassword, password);
      setCurrentPassword('');
      setPassword('');
      setConfirm('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao trocar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={(e) => void submit(e)}
        autoComplete="off"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121215] p-6 space-y-4 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-white">Troca de senha obrigatória</h2>
            <p className="text-xs text-slate-400">Defina uma nova senha para continuar usando o Kinito.</p>
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Senha atual / temporária</span>
          <input
            type="password"
            name="kinito_pwd_current"
            autoComplete="off"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Nova senha</span>
          <input
            type="password"
            name="kinito_pwd_new"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Confirmar nova senha</span>
          <input
            type="password"
            name="kinito_pwd_confirm"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white"
          />
        </label>

        {error && (
          <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar nova senha
        </button>
      </form>
    </div>
  );
};
