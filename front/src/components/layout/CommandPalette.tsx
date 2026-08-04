import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Car,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { formatBRL } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    rides,
    drivers,
    clients,
    companies,
  } = useAppStore();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredRides = rides
    .filter(
      (r) =>
        r.code.toLowerCase().includes(query.toLowerCase()) ||
        r.clientName.toLowerCase().includes(query.toLowerCase()) ||
        (r.driverName && r.driverName.toLowerCase().includes(query.toLowerCase())) ||
        r.origin.address.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 4);

  const filteredDrivers = drivers
    .filter((d) => d.name.toLowerCase().includes(query.toLowerCase()) || d.vehiclePlate.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  const filteredClients = clients
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  const filteredCompanies = companies
    .filter((comp) => comp.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite o código da corrida, nome do cliente, motorista ou empresa..."
            autoFocus
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          {filteredRides.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-indigo-500" /> Corridas ({filteredRides.length})
              </div>
              <div className="space-y-1">
                {filteredRides.map((ride) => (
                  <div
                    key={ride.id}
                    onClick={() => {
                      setCommandPaletteOpen(false);
                      navigate('/corridas');
                    }}
                    className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <span>{ride.code}</span>
                        <span className="font-normal text-zinc-500">({ride.clientName})</span>
                      </div>
                      <div className="text-zinc-400 text-[11px] truncate max-w-sm">
                        {ride.origin.address} → {ride.destination.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{formatBRL(ride.grossValue)}</div>
                      <div className="text-[10px] text-indigo-500 font-medium uppercase">{ride.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredDrivers.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400 px-2 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Motoristas ({filteredDrivers.length})
              </div>
              <div className="space-y-1">
                {filteredDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    onClick={() => {
                      setCommandPaletteOpen(false);
                      navigate('/motoristas');
                    }}
                    className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={driver.avatar} alt={driver.name} className="w-7 h-7 rounded-full bg-zinc-200" />
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{driver.name}</div>
                        <div className="text-zinc-400 text-[11px]">{driver.vehicleModel} • {driver.vehiclePlate}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-500">★ {driver.rating}</div>
                      <div className="text-[10px] text-zinc-400">{driver.companyName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredClients.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" /> Clientes ({filteredClients.length})
              </div>
              <div className="space-y-1">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => {
                      setCommandPaletteOpen(false);
                      navigate('/clientes');
                    }}
                    className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={client.avatar} alt={client.name} className="w-7 h-7 rounded-full bg-zinc-200" />
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{client.name}</div>
                        <div className="text-zinc-400 text-[11px]">{client.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{client.totalRides} corridas</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredCompanies.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-500" /> Empresas ({filteredCompanies.length})
              </div>
              <div className="space-y-1">
                {filteredCompanies.map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => {
                      setCommandPaletteOpen(false);
                      navigate('/empresas');
                    }}
                    className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={comp.logo} alt={comp.name} className="w-7 h-7 rounded-lg bg-zinc-200" />
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{comp.name}</div>
                        <div className="text-zinc-400 text-[11px]">{comp.cnpj}</div>
                      </div>
                    </div>
                    <div className="text-right font-medium text-purple-500">
                      {comp.activeDrivers} motoristas
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[11px] text-zinc-400 flex items-center justify-between">
          <span>Pressione <kbd className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded">ESC</kbd> para sair</span>
          <span>Pesquisa Global em Tempo Real</span>
        </div>
      </div>
    </div>
  );
};
