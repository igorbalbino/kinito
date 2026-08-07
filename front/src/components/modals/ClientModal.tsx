import React, { useState } from 'react';
import { Mail, UserPlus, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { createClientApi } from '../../lib/api';
import { normalizeClient } from '../../lib/normalize';
import { SafeSelect } from '../common/SafeSelect';

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
  const [submitting, setSubmitting] = useState(false);
  const [invitePending, setInvitePending] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompanyId('');
    setInvitePending(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        email,
        phone: phone || undefined,
      };
      if (companyId) payload.company_id = Number(companyId);

      const res = await createClientApi(payload);
      addClient(normalizeClient((res.client || res) as Record<string, unknown>));
      if (res.invite_pending) {
        setInvitePending(true);
      } else {
        resetAndClose();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao criar cliente');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="client-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={resetAndClose}
    >
      <div
        id="client-modal-card"
        className="w-full max-w-md bg-[#121215] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              {invitePending ? <Mail className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">
                {invitePending ? 'Convite enviado' : 'Novo cliente'}
              </h3>
              <p className="text-xs text-slate-400">
                {invitePending
                  ? 'Ele precisa confirmar o e-mail para receber a senha.'
                  : 'Dados de contato e vínculo'}
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-90"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {invitePending ? (
          <div className="p-6 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
              Enviamos um e-mail de confirmação para o cliente. Depois que ele clicar no link, recebe a senha
              temporária por e-mail e troca no primeiro acesso.
            </div>
            <button
              type="button"
              onClick={resetAndClose}
              className="w-full py-3 rounded-xl bg-white/10 text-white font-bold min-h-[48px]"
            >
              Entendi, fechar
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4 text-xs" autoComplete="off">
            <div>
              <label className="text-[11px] font-medium text-slate-300">Nome *</label>
              <input
                type="text"
                required
                name="client_name"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300">E-mail *</label>
              <input
                type="email"
                required
                name="client_email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300">Telefone</label>
              <input
                type="text"
                name="client_phone"
                autoComplete="off"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300">Empresa (opcional)</label>
              <SafeSelect
                className="mt-1.5"
                label="Empresa"
                value={companyId}
                onChange={setCompanyId}
                sanitizeLabels
                buttonClassName="bg-white/5 border-white/10 text-slate-100 p-3 min-h-[44px]"
                options={[
                  { value: '', label: 'Pessoa física' },
                  ...companies.map((comp) => ({
                    value: String(comp.id),
                    label: comp.name,
                  })),
                ]}
              />
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-5 py-3 rounded-xl text-slate-400 font-medium hover:text-white hover:bg-white/5 active:scale-95 transition-all min-h-[48px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all min-h-[48px] flex items-center justify-center disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
