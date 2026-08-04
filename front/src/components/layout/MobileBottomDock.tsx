import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, Plus, DollarSign, Menu } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

export const MobileBottomDock: React.FC = () => {
  const location = useLocation();
  const {
    handPreference,
    setNewRideModalOpen,
    isQuickActionSheetOpen,
    setQuickActionSheetOpen,
    rides,
  } = useAppStore();

  const pendingCount = rides.filter((r) => r.status === 'pendente').length;

  const navItems = [
    {
      label: 'Início',
      path: '/dashboard',
      icon: LayoutDashboard,
      active: location.pathname === '/dashboard',
    },
    {
      label: 'Corridas',
      path: '/corridas',
      icon: Car,
      active: location.pathname === '/corridas',
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      label: 'Financeiro',
      path: '/financeiro',
      icon: DollarSign,
      active: location.pathname === '/financeiro',
    },
  ];

  return (
    <>
      <nav
        id="mobile-bottom-dock"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0a0a0d]/95 backdrop-blur-xl border-t border-white/10 px-3 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] select-none"
      >
        <div className="flex items-center justify-between max-w-md mx-auto relative h-14">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center h-full py-1 rounded-xl transition-all active:scale-90',
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Painel</span>
          </NavLink>

          <NavLink
            to="/corridas"
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center h-full py-1 rounded-xl transition-all active:scale-90 relative',
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )
            }
          >
            <div className="relative">
              <Car className="w-5 h-5 mb-0.5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-[#0a0a0d]">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Corridas</span>
          </NavLink>

          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setNewRideModalOpen(true)}
              className={cn(
                'w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-85 transition-all duration-150 border border-indigo-400/30',
                handPreference === 'left' ? '-translate-x-1' : handPreference === 'right' ? 'translate-x-1' : ''
              )}
              title="Nova Corrida (Ação de Uma Mão)"
              aria-label="Nova Corrida"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          <NavLink
            to="/financeiro"
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center h-full py-1 rounded-xl transition-all active:scale-90',
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )
            }
          >
            <DollarSign className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Financeiro</span>
          </NavLink>

          <button
            onClick={() => setQuickActionSheetOpen(!isQuickActionSheetOpen)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center h-full py-1 rounded-xl transition-all active:scale-90',
              isQuickActionSheetOpen ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <div className="relative">
              <Menu className="w-5 h-5 mb-0.5" />
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <span className="text-[10px] tracking-tight">Menu 🖐️</span>
          </button>
        </div>
      </nav>
    </>
  );
};
