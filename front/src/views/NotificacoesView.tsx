import React, { useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { formatDate } from '../lib/utils';
import {
  acceptProviderTransferApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  rejectProviderTransferApi,
} from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { PageSEO } from '../components/common/PageSEO';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';

export const NotificacoesView: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredNotifs = notifications.filter((n) => {
    if (filterCategory === 'todos') return true;
    return n.category === filterCategory;
  });

  const onRead = async (id: string) => {
    markNotificationRead(id);
    try {
      await markNotificationReadApi(id);
    } catch {
      /* keep local */
    }
  };

  const onReadAll = async () => {
    markAllNotificationsRead();
    try {
      await markAllNotificationsReadApi();
    } catch {
      /* keep local */
    }
  };

  const onTransfer = async (notifId: string, transferId: number, accept: boolean) => {
    setBusyId(notifId);
    try {
      if (accept) await acceptProviderTransferApi(transferId);
      else await rejectProviderTransferApi(transferId);
      await onRead(notifId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao responder vínculo');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageContainer>
      <PageSEO page="notificacoes" />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Central de Notificações
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {notifications.filter((n) => !n.read).length} não lidas
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Notificações operacionais, eventos de webhook Stripe e alertas do sistema.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void onReadAll()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <CheckCheck className="w-4 h-4" /> Marcar Todas como Lidas
          </button>
        </div>
      </header>

      <section aria-label="Filtros de categoria" className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-xs overflow-x-auto">
        {['todos', 'corrida', 'financeiro', 'motorista', 'sistema'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all ${
              filterCategory === cat
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </section>

      <section aria-label="Lista de notificações" className="p-5 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-3">
        {filteredNotifs.map((notif) => {
          const transferId =
            notif.meta?.type === 'provider_transfer' && notif.meta.transfer_id
              ? Number(notif.meta.transfer_id)
              : null;

          return (
            <div
              key={notif.id}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                !notif.read
                  ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500/30'
                  : 'bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800/80 opacity-80'
              }`}
            >
              <button
                type="button"
                onClick={() => void onRead(notif.id)}
                className="mt-1 shrink-0"
                aria-label="Marcar como lida"
              >
                {!notif.read ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                ) : (
                  <Check className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              <div className="flex-1 space-y-1 text-xs min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{notif.title}</span>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">{formatDate(notif.timestamp)}</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{notif.message}</p>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {notif.category}
                  </span>
                  {transferId != null && !notif.read && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === notif.id}
                        onClick={() => void onTransfer(notif.id, transferId, true)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold disabled:opacity-60"
                      >
                        Aceitar vínculo
                      </button>
                      <button
                        type="button"
                        disabled={busyId === notif.id}
                        onClick={() => void onTransfer(notif.id, transferId, false)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-[11px] font-bold disabled:opacity-60"
                      >
                        Recusar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <Footer />
    </PageContainer>
  );
};
