import React, { useState } from 'react';
import { Building2, Car, DollarSign, Mail, Phone, Users } from 'lucide-react';
import { formatBRL } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { SEOHead } from '../components/common/SEOHead';
import { Footer } from '../components/layout/Footer';
import { Company } from '../types';

export const EmpresasView: React.FC = () => {
  const { companies } = useAppStore();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <SEOHead
        title="Frotas Corporativas & Empresas Distribuidoras"
        description="Gestão de empresas parceiras, frotas terceirizadas e planos corporativos. Acompanhamento de comissões por CNPJ e volumes de chamadas agrupados."
        keywords={['gestão de frotas corporativas', 'empresas de logística', 'plano enterprise transporte', 'split por CNPJ']}
        category="Módulo de Empresas SaaS"
        jsonLdSchema={{
          '@type': 'Table',
          'name': 'Empresas & Frotas Cadastradas',
          'about': 'Lista de empresas parceiras e métricas de desempenho corporativo.',
        }}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Empresas & Frotas Distribuidoras
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
              {companies.length} cadastradas
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Plano corporativo, split de recebíveis por CNPJ e colaboradores com permissão.
          </p>
        </div>
      </div>

      {/* Grid of Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((comp) => (
          <div
            key={comp.id}
            className="p-5 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-4 hover:border-purple-500/50 transition-all shadow-2xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src={comp.logo} alt={comp.name} className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{comp.name}</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">CNPJ: {comp.cnpj}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                comp.tier === 'enterprise' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                comp.tier === 'pro' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
              }`}>
                {comp.tier}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40">
                <div className="text-[10px] text-zinc-400">Motoristas Ativos</div>
                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{comp.activeDrivers}</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40">
                <div className="text-[10px] text-zinc-400">Total de Corridas</div>
                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{comp.totalRides}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400">Faturamento Mês:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 ml-1">{formatBRL(comp.monthlyRevenue)}</span>
              </div>
              <button
                onClick={() => setSelectedCompany(comp)}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
              >
                Colaboradores
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Collaborators Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{selectedCompany.name}</h3>
                <p className="text-zinc-400 text-xs">Colaboradores & Gestores de Frota</p>
              </div>
              <button onClick={() => setSelectedCompany(null)} className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg">Fechar</button>
            </div>

            <div className="space-y-2">
              {selectedCompany.collaborators.map((col) => (
                <div key={col.id} className="p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{col.name}</div>
                    <div className="text-[10px] text-zinc-400">{col.email}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 font-bold text-[10px]">{col.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
