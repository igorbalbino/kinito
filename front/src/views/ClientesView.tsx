import React, { useState } from 'react';
import { Mail, Phone, Search, UserPlus } from 'lucide-react';
import { formatBRL } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { ClientModal } from '../components/modals/ClientModal';
import { PageSEO } from '../components/common/PageSEO';
import { Footer } from '../components/layout/Footer';
import { PageContainer } from '../components/layout/PageContainer';
import { Client } from '../types';

export const ClientesView: React.FC = () => {
  const { clients } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <PageContainer>
      <PageSEO page="clientes" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Base de Clientes
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {clients.length} cadastrados
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Gerenciamento de contas de clientes corporativos e individuais.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 min-h-[44px] active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Cadastrar Cliente
        </button>
      </div>

      <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar cliente por nome, e-mail ou empresa..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-hidden min-w-0">
        <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          {filteredClients.slice(0, 20).map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => setSelectedClient(client)}
              className="w-full text-left p-4 space-y-2 active:bg-zinc-50 dark:active:bg-zinc-800/40"
            >
              <div className="flex items-center gap-3">
                <img src={client.avatar} alt="" className="w-9 h-9 rounded-full bg-zinc-200 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{client.name}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{client.email}</div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  client.status === 'vip' ? 'bg-amber-500/10 text-amber-500' :
                  client.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-500' :
                  'bg-rose-500/10 text-rose-500'
                }`}>
                  {client.status}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>{client.totalRides} corridas</span>
                <span className="font-bold text-emerald-600">{formatBRL(client.totalSpent)}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium bg-zinc-50/50 dark:bg-zinc-900/50">
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4">Empresa Vinc.</th>
                <th className="py-3 px-4">Total Corridas</th>
                <th className="py-3 px-4">Gasto Total</th>
                <th className="py-3 px-4">Avaliação</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredClients.slice(0, 20).map((client) => (
                <tr key={client.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={client.avatar} alt={client.name} className="w-8 h-8 rounded-full bg-zinc-200 shrink-0" />
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{client.name}</div>
                        <div className="text-[10px] text-zinc-400">ID: {client.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 space-y-0.5">
                    <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-zinc-400" /> {client.email}</div>
                    <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-zinc-400" /> {client.phone}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                    {client.companyName || 'Individual'}
                  </td>
                  <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">{client.totalRides}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(client.totalSpent)}</td>
                  <td className="py-3 px-4 font-bold text-amber-500">★ {client.rating}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      client.status === 'vip' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      client.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}>
                      {client.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      Ver Histórico
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <img src={selectedClient.avatar} alt={selectedClient.name} className="w-10 h-10 rounded-full" />
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{selectedClient.name}</h3>
                  <p className="text-zinc-400">{selectedClient.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg">Fechar</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                <div className="text-zinc-400">Total de Corridas</div>
                <div className="font-bold text-lg">{selectedClient.totalRides}</div>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                <div className="text-xs">Gasto Total</div>
                <div className="font-bold text-lg">{formatBRL(selectedClient.totalSpent)}</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-2">Endereços Favoritos do Cliente</h4>
              <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                {selectedClient.favoriteAddresses.map((addr, idx) => (
                  <li key={idx}>{addr}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </PageContainer>
  );
};
