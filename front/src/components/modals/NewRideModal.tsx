import React, { useEffect, useState } from 'react';
import { Car, MapPin, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { createRide, fetchProviders } from '../../lib/api';
import { normalizeRide } from '../../lib/normalize';
import { unwrapResource } from '../../lib/sessionProfile';
import { SafeSelect } from '../common/SafeSelect';

interface NewRideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const NewRideModal: React.FC<NewRideModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const {
    clients,
    companies,
    drivers,
    upsertRide,
    isNewRideModalOpen,
    setNewRideModalOpen,
  } = useAppStore();

  const isModalOpen = propIsOpen !== undefined ? propIsOpen : isNewRideModalOpen;

  const handleClose = () => {
    propOnClose?.();
    setNewRideModalOpen(false);
  };

  const [providerOptions, setProviderOptions] = useState<{ id: string; name: string }[]>(
    () => companies.map((c) => ({ id: c.id, name: c.name })),
  );
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [driverId, setDriverId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [originAddr, setOriginAddr] = useState('');
  const [destAddr, setDestAddr] = useState('');
  const [city, setCity] = useState('');
  const [distanceKm, setDistanceKm] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | 'faturado' | 'dinheiro'>('pix');

  useEffect(() => {
    if (!isModalOpen) return;
    fetchProviders()
      .then((list) => {
        if (!list.length) return;
        const opts = list.map((c) => ({ id: String(c.id), name: c.name }));
        setProviderOptions(opts);
        setCompanyId((prev) => (opts.some((o) => o.id === prev) ? prev : opts[0].id));
      })
      .catch(() => undefined);
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        client_id: Number(clientId || clients[0]?.id),
        company_id: Number(companyId),
        origin: { address: originAddr, lat: 0, lng: 0, city, neighborhood: '' },
        destination: { address: destAddr, lat: 0, lng: 0, city, neighborhood: '' },
        distance_km: distanceKm,
        payment_method: paymentMethod,
      };
      if (driverId) payload.driver_id = Number(driverId);

      const res = await createRide(payload);
      upsertRide(normalizeRide(unwrapResource(res)));
      handleClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao criar corrida');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="new-ride-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        id="new-ride-modal-card"
        className="w-full max-w-xl bg-[#121215] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Nova Corrida</h2>
              <p className="text-xs text-slate-400">Origem, destino e despacho</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors active:scale-90"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1" autoComplete="off">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300">Cliente</label>
              <SafeSelect
                className="mt-1.5"
                label="Cliente"
                value={clientId}
                onChange={setClientId}
                sanitizeLabels
                buttonClassName="bg-white/5 border-white/10 text-slate-100"
                options={clients.slice(0, 20).map((c) => ({
                  value: String(c.id),
                  label: `${c.name} (${c.email})`,
                }))}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300">Empresa</label>
              <SafeSelect
                className="mt-1.5"
                label="Empresa"
                value={companyId}
                onChange={setCompanyId}
                sanitizeLabels
                buttonClassName="bg-white/5 border-white/10 text-slate-100"
                options={providerOptions.map((comp) => ({
                  value: String(comp.id),
                  label: comp.name,
                }))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Origem
              </label>
              <input
                type="text"
                name="ride_origin"
                autoComplete="off"
                value={originAddr}
                onChange={(e) => setOriginAddr(e.target.value)}
                required
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Destino
              </label>
              <input
                type="text"
                name="ride_destination"
                autoComplete="off"
                value={destAddr}
                onChange={(e) => setDestAddr(e.target.value)}
                required
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300">Cidade</label>
              <input
                type="text"
                name="ride_city"
                autoComplete="off"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300">Distância (km)</label>
              <input
                type="number"
                step="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 1)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300">Pagamento</label>
              <SafeSelect
                className="mt-1.5"
                label="Pagamento"
                value={paymentMethod}
                onChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
                buttonClassName="bg-white/5 border-white/10 text-slate-100"
                options={[
                  { value: 'credit_card', label: 'Cartão' },
                  { value: 'pix', label: 'PIX' },
                  { value: 'faturado', label: 'Faturado' },
                  { value: 'dinheiro', label: 'Dinheiro' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300">Motorista (opcional)</label>
            <SafeSelect
              className="mt-1.5"
              label="Motorista"
              value={driverId}
              onChange={setDriverId}
              sanitizeLabels
              buttonClassName="bg-white/5 border-white/10 text-slate-100"
              options={[
                { value: '', label: 'Pendente' },
                ...drivers
                  .filter((d) => d.status === 'ativo')
                  .map((d) => ({
                    value: String(d.id),
                    label: `${d.name} • ${d.vehicleModel} (${d.vehiclePlate})`,
                  })),
              ]}
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 sticky bottom-0 bg-[#121215]">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-3 rounded-xl text-slate-400 font-medium hover:text-white hover:bg-white/5 active:scale-95 transition-all min-h-[48px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? 'Criando...' : 'Criar corrida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
