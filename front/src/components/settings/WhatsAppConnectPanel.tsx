import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MessageCircle, QrCode, RefreshCw, Unplug } from 'lucide-react';
import {
  connectWhatsApp,
  disconnectWhatsApp,
  fetchCompanies,
  fetchWhatsAppStatus,
  getApiCompanyId,
  getApiToken,
  isApiConfigured,
  listSessionCompanies,
  setApiCompanyId,
  WhatsAppStatus,
} from '../../lib/api';

function statusLabel(wa: WhatsAppStatus | null): string {
  if (!wa) return '—';
  if (wa.error === 'gateway_not_configured') return 'Gateway não configurado';
  if (wa.error === 'gateway_error') return 'Gateway indisponível';
  if (wa.connected || wa.status === 'connected') return 'Conectado';
  if (wa.qr || wa.status === 'qr' || wa.status === 'connecting') return 'Aguardando QR';
  return wa.status || 'Desconectado';
}

export const WhatsAppConnectPanel: React.FC = () => {
  const [companyId, setCompanyId] = useState<number | null>(() => getApiCompanyId());
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>(() => listSessionCompanies());
  const [wa, setWa] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiReady = isApiConfigured() && Boolean(getApiToken());

  const refresh = useCallback(async () => {
    if (!apiReady || !companyId) return;
    setError(null);
    try {
      const status = await fetchWhatsAppStatus(companyId);
      setWa(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao consultar WhatsApp');
    }
  }, [apiReady, companyId]);

  useEffect(() => {
    if (!apiReady) return;
    const local = listSessionCompanies();
    if (local.length) {
      setCompanies(local);
      if (!companyId && local[0]) {
        setCompanyId(local[0].id);
        setApiCompanyId(local[0].id);
      }
      return;
    }
    fetchCompanies()
      .then((list) => {
        setCompanies(list);
        if (!companyId && list[0]) {
          setCompanyId(list[0].id);
          setApiCompanyId(list[0].id);
        }
      })
      .catch(() => undefined);
  }, [apiReady, companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Poll while waiting for QR scan
  useEffect(() => {
    if (!apiReady || !companyId) return;
    const waiting = Boolean(wa?.qr) || wa?.status === 'qr' || wa?.status === 'connecting';
    if (!waiting || wa?.connected) return;

    const id = window.setInterval(() => {
      void refresh();
    }, 3000);
    return () => window.clearInterval(id);
  }, [apiReady, companyId, wa?.qr, wa?.status, wa?.connected, refresh]);

  const onConnect = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const status = await connectWhatsApp(companyId);
      setWa(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao conectar');
    } finally {
      setLoading(false);
    }
  };

  const onDisconnect = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const status = await disconnectWhatsApp(companyId);
      setWa(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao desconectar');
    } finally {
      setLoading(false);
    }
  };

  const connected = Boolean(wa?.connected || wa?.status === 'connected');
  const qrSrc = wa?.qr
    ? wa.qr.startsWith('data:')
      ? wa.qr
      : `data:image/png;base64,${wa.qr}`
    : null;

  return (
    <div className="p-6 rounded-2xl border border-emerald-500/30 bg-white dark:bg-white/5 space-y-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              WhatsApp da empresa
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conecte o número da frota via QR (gateway Baileys provisório). Usado para notificações até a API oficial.
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
            connected
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
          }`}
        >
          {connected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
          {statusLabel(wa)}
        </span>
      </div>

      {!isApiConfigured() && (
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
          Defina <code className="font-mono">VITE_API_URL</code> no front (ex.: http://127.0.0.1:8000) e faça login de novo.
        </p>
      )}

      {isApiConfigured() && !getApiToken() && (
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
          Faça login com a API ativa (e-mail/senha do seed, ex. empresa1@kinito.test / password) para conectar o WhatsApp.
        </p>
      )}

      {apiReady && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Empresa</span>
              {companies.length > 0 ? (
                <select
                  value={companyId ?? ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setCompanyId(id);
                    setApiCompanyId(id);
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (#{c.id})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min={1}
                  value={companyId ?? ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setCompanyId(id || null);
                    if (id) setApiCompanyId(id);
                  }}
                  placeholder="ID da empresa"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-xs"
                />
              )}
            </label>

            <div className="flex flex-col justify-end gap-2 sm:items-end">
              {(wa?.phone || wa?.stored_phone) && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Número: <strong>{wa.phone || wa.stored_phone}</strong>
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Atualizar
                </button>
                {!connected ? (
                  <button
                    type="button"
                    disabled={loading || !companyId}
                    onClick={() => void onConnect()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                    Gerar QR / Conectar
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading || !companyId}
                    onClick={() => void onDisconnect()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unplug className="w-3.5 h-3.5" />}
                    Desconectar
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {qrSrc && !connected && (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10">
              <img
                src={qrSrc}
                alt="QR Code WhatsApp"
                className="w-52 h-52 rounded-lg bg-white p-2 shadow-sm"
              />
              <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside">
                <li>Abra o WhatsApp no celular da empresa.</li>
                <li>Menu → Aparelhos conectados → Conectar um aparelho.</li>
                <li>Escaneie o QR. Esta tela atualiza sozinha.</li>
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
};
