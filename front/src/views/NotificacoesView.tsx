import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Filter, Plus } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { SEOHead } from '../components/common/SEOHead';
import { Footer } from '../components/layout/Footer';

export const NotificacoesView: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, addNotification } = useAppStore();
  const [filterCategory, setFilterCategory] = useState<string>('todos');

  const filteredNotifs = notifications.filter((n) => {
    if (filterCategory === 'todos') return true;
    return n.category === filterCategory;
  });

  const handleSimulateNewNotification = () => {
    addNotification({
      title: 'Nova Corrida Solicitada no Sistema',
      message: 'O cliente Pedro Rodrigues solicitou um despacho de corrida em Moema, São Paulo.',
      category: 'corrida',
      type: 'info'
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <SEOHead
        title="Central de Notificações & Alertas em Tempo Real"
        description="Histórico de alertas push, notificações de despacho de corridas, webhooks do Stripe Connect e avisos de sistema."
        keywords={['notificações de transporte', 'alertas de corrida', 'push webhooks stripe']}
        category="Módulo de Notificações SaaS"
        jsonLdSchema={{
          '@type': 'WebPage',
          'name': 'Central de Notificações Operacionais',
          'about': 'Alertas operacionais e atualização de status de corridas.',
        }}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            onClick={handleSimulateNewNotification}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Simular Nova Notificação
          </button>
          <button
            onClick={markAllNotificationsRead}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <CheckCheck className="w-4 h-4" /> Marcar Todas como Lidas
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-xs overflow-x-auto">
        {['todos', 'corrida', 'financeiro', 'motorista', 'sistema'].map((cat) => (
          <button
            key={cat}
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
      </div>

      {/* List */}
      <div className="p-5 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-3">
        {filteredNotifs.map((notif) => (
          <div
            key={notif.id}
            onClick={() => markNotificationRead(notif.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${
              !notif.read
                ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500/30'
                : 'bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800/80 opacity-80'
            }`}
          >
            <div className="mt-1">
              {!notif.read ? (
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              ) : (
                <Check className="w-4 h-4 text-zinc-400" />
              )}
            </div>

            <div className="flex-1 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{notif.title}</span>
                <span className="text-[10px] text-zinc-400 font-mono">{formatDate(notif.timestamp)}</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{notif.message}</p>
              <div className="pt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {notif.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
