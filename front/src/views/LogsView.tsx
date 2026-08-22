import React, { useState } from 'react';
import { formatDate } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { PageSEO } from '../components/common/PageSEO';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';
import { SafeSelect } from '../components/common/SafeSelect';

export const LogsView: React.FC = () => {
  const { logs, audits } = useAppStore();
  const [activeTab, setActiveTab] = useState<'logs' | 'audit'>('logs');
  const [levelFilter, setLevelFilter] = useState<string>('todos');

  const filteredLogs = logs.filter((l) => {
    if (levelFilter === 'todos') return true;
    return l.level === levelFilter;
  });

  return (
    <PageContainer>
      <PageSEO page="logs" />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Logs & Trilha de Auditoria do Sistema
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Registro detalhado de eventos operacionais, segurança, chamadas de Webhooks e alterações de configuração.
          </p>
        </div>

        <div className="p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'logs' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500'
            }`}
          >
            Logs do Sistema ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'audit' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500'
            }`}
          >
            Auditoria de Segurança ({audits.length})
          </button>
        </div>
      </header>

      {activeTab === 'logs' && (
        <section aria-labelledby="logs-eventos" className="p-5 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="logs-eventos" className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Eventos em Tempo Real</h2>
            <SafeSelect
              value={levelFilter}
              onChange={setLevelFilter}
              label="Nível"
              buttonClassName="bg-zinc-50 dark:bg-zinc-800"
              options={[
                { value: 'todos', label: 'Todos os Níveis' },
                { value: 'info', label: 'Info' },
                { value: 'warning', label: 'Aviso' },
                { value: 'security', label: 'Segurança' },
              ]}
            />
          </div>

          <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.level === 'info' ? 'bg-blue-500/10 text-blue-500' :
                    log.level === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-purple-500/10 text-purple-500'
                  }`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">{formatDate(log.timestamp)}</span>
                </div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{log.message}</div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{log.category}</span>
                  <span>{log.actor} · {log.ip}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Nível</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3">Mensagem do Log</th>
                  <th className="py-2.5 px-3">Ator</th>
                  <th className="py-2.5 px-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.level === 'info' ? 'bg-blue-500/10 text-blue-500' :
                        log.level === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-purple-500/10 text-purple-500'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-700 dark:text-zinc-300">{log.category}</td>
                    <td className="py-2.5 px-3 font-medium text-zinc-900 dark:text-zinc-100">{log.message}</td>
                    <td className="py-2.5 px-3 text-zinc-500">{log.actor}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'audit' && (
        <section aria-labelledby="logs-auditoria" className="p-5 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-4">
          <h2 id="logs-auditoria" className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            Trilha de Auditoria de Ações Críticas
          </h2>

          <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {audits.map((aud) => (
              <div key={aud.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">{aud.action}</span>
                  <span className="text-[11px] text-zinc-400 font-mono">{formatDate(aud.timestamp)}</span>
                </div>
                <div className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold">{aud.user}</div>
                <div className="text-[11px] text-zinc-500">{aud.targetResource}</div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>
                    <span className="text-rose-500">{aud.previousValue || '-'}</span> → <span className="text-emerald-500 font-bold">{aud.newValue || '-'}</span>
                  </span>
                  <span className="text-zinc-400">{aud.ip}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Ação Crítica</th>
                  <th className="py-2.5 px-3">Usuário</th>
                  <th className="py-2.5 px-3">Recurso Alvo</th>
                  <th className="py-2.5 px-3">Valor Anterior → Novo</th>
                  <th className="py-2.5 px-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono text-[11px]">
                {audits.map((aud) => (
                  <tr key={aud.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">{formatDate(aud.timestamp)}</td>
                    <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">{aud.action}</td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">{aud.user}</td>
                    <td className="py-2.5 px-3 text-zinc-500">{aud.targetResource}</td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-300">
                      <span className="text-rose-500">{aud.previousValue || '-'}</span> → <span className="text-emerald-500 font-bold">{aud.newValue || '-'}</span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400">{aud.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Footer />
    </PageContainer>
  );
};
