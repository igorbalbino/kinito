import React, { useState } from 'react';
import { Mail, UserPlus, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { createDriverApi, getApiCompanyId } from '../../lib/api';
import { normalizeDriver } from '../../lib/normalize';

interface DriverCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverCreateModal: React.FC<DriverCreateModalProps> = ({ isOpen, onClose }) => {
  const { upsertDriver } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [invitePending, setInvitePending] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setName('');
    setEmail('');
    setPhone('');
    setVehicleModel('');
    setVehiclePlate('');
    setCity('');
    setInvitePending(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setSubmitting(true);
    try {
      const companyId = getApiCompanyId();
      const payload: Record<string, unknown> = {
        name,
        email,
        phone: phone || undefined,
        vehicle_model: vehicleModel || undefined,
        vehicle_plate: vehiclePlate || undefined,
        city: city || undefined,
      };
      if (companyId) payload.company_id = companyId;

      const res = await createDriverApi(payload);
      upsertDriver(normalizeDriver((res.driver || res) as Record<string, unknown>));
      if (res.invite_pending) {
        setInvitePending(true);
      } else {
        resetAndClose();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao criar motorista');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="driver-create-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={resetAndClose}
    >
      <div
        id="driver-create-modal-card"
        className="w-full max-w-md bg-[#121215] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              {invitePending ? <Mail className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">
                {invitePending ? 'Convite enviado' : 'Novo motorista'}
              </h3>
              <p className="text-xs text-slate-400">
                {invitePending
                  ? 'Ele precisa confirmar o e-mail para receber a senha.'
                  : 'Vínculo à frota e convite por e-mail'}
              </p>
            </div>
          </div>
          <button
            type="button"
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
              Enviamos um e-mail de confirmação. Depois que o motorista clicar no link, ele recebe a senha
              temporária e já fica apto a receber corridas da sua empresa.
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
          <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4 text-xs overflow-y-auto" autoComplete="off">
            <div>
              <label className="text-[11px] font-medium text-slate-300">Nome *</label>
              <input
                type="text"
                required
                name="driver_name"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-emerald-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300">E-mail *</label>
              <input
                type="email"
                required
                name="driver_email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-emerald-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300">Telefone</label>
              <input
                type="text"
                name="driver_phone"
                autoComplete="off"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-emerald-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-300">Veículo</label>
                <input
                  type="text"
                  name="vehicle_model"
                  autoComplete="off"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="Ex: Corolla"
                  className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-emerald-500 focus:outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-300">Placa</label>
                <input
                  type="text"
                  name="vehicle_plate"
                  autoComplete="off"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-emerald-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300">Cidade</label>
              <input
                type="text"
                name="city"
                autoComplete="off"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-emerald-500 focus:outline-none min-h-[44px]"
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
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition-all min-h-[48px] flex items-center justify-center disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
