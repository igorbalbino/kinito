import React, { useEffect, useState } from 'react';
import { Car, MapPin, Navigation, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { fetchProviders, getApiToken, isApiConfigured } from '../../lib/api';

interface NewRideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const NewRideModal: React.FC<NewRideModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const {
    clients,
    companies,
    drivers,
    addRide,
    financialMode,
    isNewRideModalOpen,
    setNewRideModalOpen,
  } = useAppStore();

  const isModalOpen = propIsOpen !== undefined ? propIsOpen : isNewRideModalOpen;

  const handleClose = () => {
    if (propOnClose) propOnClose();
    setNewRideModalOpen(false);
  };

  const [providerOptions, setProviderOptions] = useState<{ id: string; name: string }[]>(
    () => companies.map((c) => ({ id: c.id, name: c.name })),
  );
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [driverId, setDriverId] = useState('');

  useEffect(() => {
    if (!isModalOpen || !isApiConfigured() || !getApiToken()) return;
    fetchProviders()
      .then((list) => {
        if (!list.length) return;
        const opts = list.map((c) => ({ id: String(c.id), name: c.name }));
        setProviderOptions(opts);
        setCompanyId((prev) => (opts.some((o) => o.id === prev) ? prev : opts[0].id));
      })
      .catch(() => undefined);
  }, [isModalOpen]);

  const [originAddr, setOriginAddr] = useState('Av. Paulista, 1000 - Bela Vista');
  const [destAddr, setDestAddr] = useState('Rua Faria Lima, 1800 - Pinheiros');
  const [city, setCity] = useState('São Paulo, SP');
  const [distanceKm, setDistanceKm] = useState(12.5);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | 'faturado' | 'dinheiro'>('credit_card');

  if (!isModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedClient = clients.find((c) => c.id === clientId) || clients[0];
    const selectedCompany =
      companies.find((comp) => comp.id === companyId) ||
      ({ id: companyId, name: providerOptions.find((p) => p.id === companyId)?.name || 'Fornecedor' } as (typeof companies)[0]);
    const selectedDriver = drivers.find((d) => d.id === driverId);

    const grossValue = parseFloat((12.50 + distanceKm * 3.40).toFixed(2));
    const stripeFee = financialMode === 'stripe' ? parseFloat((grossValue * 0.039 + 0.50).toFixed(2)) : 0;
    const platformCommission = parseFloat((grossValue * 0.15).toFixed(2));
    const companyCut = parseFloat((grossValue * 0.10).toFixed(2));
    const driverNet = parseFloat((grossValue - stripeFee - platformCommission - companyCut).toFixed(2));

    addRide({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      clientAvatar: selectedClient.avatar,
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      driverId: selectedDriver?.id,
      driverName: selectedDriver?.name,
      driverPhone: selectedDriver?.phone,
      driverAvatar: selectedDriver?.avatar,
      driverVehicle: selectedDriver ? `${selectedDriver.vehicleModel} (${selectedDriver.vehiclePlate})` : undefined,
      origin: {
        address: originAddr,
        lat: -23.5505,
        lng: -46.6333,
        city,
        neighborhood: 'Centro'
      },
      destination: {
        address: destAddr,
        lat: -23.5605,
        lng: -46.6433,
        city,
        neighborhood: 'Pinheiros'
      },
      status: selectedDriver ? 'atribuida' : 'pendente',
      distanceKm,
      durationMin: Math.round(distanceKm * 2.2),
      grossValue,
      stripeFee,
      platformCommission,
      companyCut,
      driverNet,
      paymentMethod,
      paymentStatus: 'pendente',
      notes: 'Despacho tátil imediato via painel mobile/desktop'
    });

    handleClose();
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
        {/* Tactile Handle for Mobile */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Nova Corrida & Despacho</h2>
              <p className="text-xs text-slate-400">Insira a rota para atribuir e calcular splits em tempo real</p>
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300">Cliente Solicitante</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
              >
                {clients.slice(0, 20).map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#121215] text-slate-100">
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300">Empresa Responsável</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
              >
                {providerOptions.map((comp) => (
                  <option key={comp.id} value={comp.id} className="bg-[#121215] text-slate-100">
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Endereço de Origem
              </label>
              <input
                type="text"
                value={originAddr}
                onChange={(e) => setOriginAddr(e.target.value)}
                required
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Endereço de Destino
              </label>
              <input
                type="text"
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
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300">Distância Estimated (KM)</label>
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
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
              >
                <option value="credit_card" className="bg-[#121215]">Cartão de Crédito (Stripe)</option>
                <option value="pix" className="bg-[#121215]">PIX Instantâneo</option>
                <option value="faturado" className="bg-[#121215]">Faturado Corporativo</option>
                <option value="dinheiro" className="bg-[#121215]">Dinheiro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300">Atribuir Motorista Imediato (Opcional)</label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-medium focus:border-indigo-500 focus:outline-none min-h-[44px]"
            >
              <option value="" className="bg-[#121215]">Deixar Pendente (Atribuição Automática por Raio)</option>
              {drivers
                .filter((d) => d.status === 'ativo')
                .map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#121215]">
                    {d.name} • {d.vehicleModel} ({d.vehiclePlate})
                  </option>
                ))}
            </select>
          </div>

          {/* Bottom Thumb Buttons */}
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
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all min-h-[48px] flex items-center justify-center gap-2"
            >
              <span>Criar & Despachar Corrida</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
