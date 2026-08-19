import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, MailWarning, XCircle } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { PageSEO } from '../components/common/PageSEO';
import { resendVerificationEmail, verifyEmailApi } from '../lib/api';

export const VerifyEmailView: React.FC = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('Confirmando seu e-mail…');
  const [credentialsSent, setCredentialsSent] = useState(false);

  useEffect(() => {
    const id = params.get('id');
    const hash = params.get('hash');
    const expires = params.get('expires');
    const signature = params.get('signature');

    if (!id || !hash || !expires || !signature) {
      setStatus('error');
      setMessage('Link de confirmação incompleto ou inválido.');
      return;
    }

    verifyEmailApi({ id, hash, expires, signature })
      .then((res) => {
        setStatus('ok');
        setMessage(res.message || 'E-mail verificado com sucesso.');
        setCredentialsSent(Boolean(res.credentials_sent));
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Não foi possível confirmar o e-mail.');
      });
  }, [params]);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 flex flex-col">
      <PageSEO page="verifyEmail" />
      <header className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-3">
          <BrandLogo className="w-10 h-10" />
          <span className="font-extrabold text-lg">Kinito</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-3xl p-8 space-y-4 text-center shadow-2xl">
          {status === 'loading' && <Loader2 className="w-10 h-10 text-indigo-500 mx-auto animate-spin" />}
          {status === 'ok' && <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />}
          {status === 'error' && <XCircle className="w-10 h-10 text-rose-500 mx-auto" />}
          <h1 className="text-xl font-black">
            {status === 'loading' ? 'Confirmando…' : status === 'ok' ? 'E-mail confirmado' : 'Falha na confirmação'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
          {credentialsSent && (
            <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
              Enviamos a senha temporária para o seu e-mail. Use-a no login e troque no primeiro acesso.
            </p>
          )}
          {status !== 'loading' && (
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm"
            >
              Ir para o login
            </Link>
          )}
        </div>
      </main>
    </div>
  );
};

export const PendingVerificationView: React.FC = () => {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resend = async () => {
    if (!email) return;
    setSending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await resendVerificationEmail(email);
      setInfo(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao reenviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 flex flex-col">
      <PageSEO page="pendingVerification" />
      <header className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-3">
          <BrandLogo className="w-10 h-10" />
          <span className="font-extrabold text-lg">Kinito</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-3xl p-8 space-y-4 text-center shadow-2xl">
          <MailWarning className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="text-xl font-black">Confira sua caixa de entrada</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enviamos um link de confirmação
            {email ? (
              <>
                {' '}
                para <strong className="text-slate-900 dark:text-slate-100">{email}</strong>
              </>
            ) : null}
            . Clique no link para ativar a conta.
          </p>
          {info && (
            <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
              {info}
            </p>
          )}
          {error && (
            <p className="text-xs text-rose-600 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{error}</p>
          )}
          <div className="flex flex-col gap-2 pt-2">
            {email && (
              <button
                type="button"
                disabled={sending}
                onClick={() => void resend()}
                className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold disabled:opacity-50"
              >
                {sending ? 'Reenviando…' : 'Reenviar e-mail'}
              </button>
            )}
            <Link
              to="/login"
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm inline-flex items-center justify-center"
            >
              Já confirmei — ir ao login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
