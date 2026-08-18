import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  Car,
  CreditCard,
  FileText,
  Hand,
  LayoutDashboard,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { sessionDisplayProfile } from '../../lib/sessionProfile';
import { canAccessRoute, isClientRole, isFleetOperator } from '../../lib/navByRole';

const MODULES = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/corridas', label: 'Corridas', icon: Car },
  { path: '/financeiro', label: 'Financeiro', icon: CreditCard },
  { path: '/motoristas', label: 'Motoristas', icon: UserCheck },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/empresas', label: 'Empresas', icon: Building2 },
  { path: '/relatorios', label: 'Relatórios', icon: FileText },
  { path: '/notificacoes', label: 'Notificações', icon: Bell },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
  { path: '/perfil', label: 'Perfil', icon: User },
] as const;

export const MobileQuickDrawerSheet: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeRole,
    switchActiveRole,
    theme,
    toggleTheme,
    financialMode,
    setFinancialMode,
    handPreference,
    setHandPreference,
    isQuickActionSheetOpen,
    setQuickActionSheetOpen,
    setCommandPaletteOpen,
    setNewRideModalOpen,
  } = useAppStore();

  if (!isQuickActionSheetOpen) return null;

  const profile = sessionDisplayProfile(activeRole);
  const availableRoles = profile.roles;
  const client = isClientRole(activeRole);
  const modules = MODULES.filter((m) => canAccessRoute(activeRole, m.path));

  const handleNavigate = (path: string) => {
    navigate(path);
    setQuickActionSheetOpen(false);
  };

  return (
    <div
      id="mobile-quick-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200"
      onClick={() => setQuickActionSheetOpen(false)}
    >
      <div
        id="mobile-quick-drawer-card"
        className="w-full max-w-lg bg-[#121215] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 space-y-6 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto -mt-2 mb-2" />

        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md uppercase">
              {profile.name.slice(0, 1)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Painel rápido Kinito</h3>
              <p className="text-xs text-slate-400">{profile.name} · {profile.badge}</p>
            </div>
          </div>
          <button
            onClick={() => setQuickActionSheetOpen(false)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => {
            setQuickActionSheetOpen(false);
            setNewRideModalOpen(true);
          }}
          className="w-full py-4 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all min-h-[52px]"
        >
          <Car className="w-5 h-5" />
          <span>{client ? 'Pedir corrida agora' : 'Solicitar & Despachar Corrida'}</span>
        </button>

        <button
          onClick={() => {
            setQuickActionSheetOpen(false);
            setCommandPaletteOpen(true);
          }}
          className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-3 hover:bg-white/10 active:scale-95 transition-all min-h-[48px]"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span>{client ? 'Buscar minhas corridas...' : 'Buscar corridas, motoristas, frotas...'}</span>
        </button>

        {availableRoles.length > 1 && (
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Papel ativo</label>
            <div className="grid grid-cols-2 gap-2">
              {availableRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => switchActiveRole(r)}
                  className={`p-3 rounded-xl border text-xs font-semibold min-h-[48px] ${
                    activeRole === r
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {sessionDisplayProfile(r).badge}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Hand className="w-3.5 h-3.5 text-indigo-400" /> Posição dos Controles Táteis
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['left', 'center', 'right'] as const).map((side) => (
              <button
                key={side}
                onClick={() => setHandPreference(side)}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all active:scale-95 min-h-[48px] ${
                  handPreference === side
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <span>{side === 'left' ? 'Esquerda' : side === 'center' ? 'Centro' : 'Direita'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {client ? 'Atalhos' : 'Módulos do Sistema'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.path}
                  onClick={() => handleNavigate(mod.path)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-2.5 active:scale-95 transition-all min-h-[48px]"
                >
                  <Icon className="w-4 h-4 text-indigo-400" />
                  <span>{mod.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          {isFleetOperator(activeRole) ? (
            <button
              onClick={() => setFinancialMode(financialMode === 'stripe' ? 'manual' : 'stripe')}
              className={`flex-1 p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 min-h-[48px] active:scale-95 transition-all ${
                financialMode === 'stripe'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${financialMode === 'stripe' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{financialMode === 'stripe' ? 'Modo Stripe Ativo' : 'Modo Manual'}</span>
            </button>
          ) : (
            <button
              onClick={() => handleNavigate('/perfil')}
              className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Zap className="w-4 h-4 text-indigo-400" />
              Meu perfil
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center min-h-[48px] min-w-[48px] active:scale-95 transition-all"
            title="Alternar Tema"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
