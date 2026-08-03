import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose }) => {
  const { addClient, companies } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyId, setCompanyId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const company = companies.find((comp) => comp.id === companyId);

    addClient({
      name,
      email,
      phone: phone || '(11) 99999-8888',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      companyId: company?.id,
      companyName: company?.name,
      favoriteAddresses: ['Av. Paulista, 1000', 'Aeroporto de Congonhas'],
      status: 'ativo',
    });

    onClose();
  };

  return (
    <div
      id="client-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="client-modal-card"
        className="w-full max-w-md bg-[#121215] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tactile Handle for Mobile */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">
                Cadastrar Novo Cliente
              </h3>
              <p className="text-xs text-slate-400">
                Insira os dados do cliente corporativo ou individual.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-90"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-300">
              Nome Completo do Cliente *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos Eduardo"
              className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300">
              E-mail de Contato *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos@empresa.com"
              className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300">
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99887-6655"
              className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300">
              Empresa Associada (Opcional)
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
            >
              <option value="" className="bg-[#121215]">Pessoa Física (Individal)</option>
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id} className="bg-[#121215]">
                  {comp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-slate-400 font-medium hover:text-white hover:bg-white/5 active:scale-95 transition-all min-h-[48px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all min-h-[48px] flex items-center justify-center"
            >
              Salvar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
