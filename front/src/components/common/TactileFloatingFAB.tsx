import React, { useState } from 'react';
import { Plus, Search, Hand, X, Zap, Car } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

export const TactileFloatingFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    handPreference,
    setHandPreference,
    setNewRideModalOpen,
    setCommandPaletteOpen,
  } = useAppStore();

  const handleToggleHand = () => {
    if (handPreference === 'right') setHandPreference('left');
    else if (handPreference === 'left') setHandPreference('center');
    else setHandPreference('right');
  };

  // Position alignment based on hand dominance
  const positionClass =
    handPreference === 'left'
      ? 'left-4 bottom-20'
      : handPreference === 'right'
      ? 'right-4 bottom-20'
      : 'left-1/2 -translate-x-1/2 bottom-20';

  return (
    <div
      id="tactile-floating-fab-container"
      className={cn('fixed z-40 md:hidden flex flex-col items-center transition-all duration-300', positionClass)}
    >
      {/* Expanded Quick Action Wheel Arc */}
      {isOpen && (
        <div className="mb-3 flex flex-col gap-2.5 animate-in slide-in-from-bottom duration-200">
          <button
            onClick={() => {
              setIsOpen(false);
              setNewRideModalOpen(true);
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-indigo-600 text-white font-semibold text-xs shadow-xl border border-indigo-400/40 active:scale-90 transition-transform"
          >
            <Car className="w-4 h-4" />
            <span>Nova Corrida</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              setCommandPaletteOpen(true);
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#18181b] text-slate-200 font-semibold text-xs shadow-xl border border-white/10 active:scale-90 transition-transform"
          >
            <Search className="w-4 h-4 text-indigo-400" />
            <span>Buscar ⌘K</span>
          </button>

          <button
            onClick={handleToggleHand}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#18181b] text-slate-200 font-semibold text-xs shadow-xl border border-white/10 active:scale-90 transition-transform"
          >
            <Hand className="w-4 h-4 text-amber-400" />
            <span>
              Mão: {handPreference === 'left' ? 'Canhoto 🖐️' : handPreference === 'right' ? 'Destro ✋' : 'Centro ⚖️'}
            </span>
          </button>
        </div>
      )}

      {/* Main Trigger FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-200 active:scale-85 border border-white/20',
          isOpen
            ? 'bg-rose-600 shadow-rose-600/50 rotate-45'
            : 'bg-indigo-600 shadow-indigo-600/50 hover:bg-indigo-500'
        )}
        title="Menu Tátil de Ação Rápida"
        aria-label="Abrir Ações Rápidas"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>
    </div>
  );
};
