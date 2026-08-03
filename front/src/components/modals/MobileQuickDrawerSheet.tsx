import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  Car,
  ChevronRight,
  CreditCard,
  FileText,
  Hand,
  History,
  LayoutDashboard,
  Moon,
  Search,
  Settings,
  Shield,
  Smartphone,
  Sun,
  User,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const roleProfiles = {
  admin: { name: 'Admin Geral (Veloce)', email: 'admin@velocelog.com.br', badge: 'Administrador Master' },
  empresa: { name: 'Veloce Logística', email: 'contato@velocelog.com.br', badge: 'Empresa' },
  motorista: { name: 'Gabriel Silva', email: 'gabriel.silva@motorista.com', badge: 'Motorista' },
  cliente: { name: 'Lucas Santos', email: 'lucas.santos@gmail.com', badge: 'Cliente VIP' },
};

export const MobileQuickDrawerSheet: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeRole,
    setActiveRole,
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
        {/* Tactile Handle for Mobile Drag gesture feeling */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto -mt-2 mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              V
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Painel Tátil Veloce</h3>
              <p className="text-xs text-slate-400">Controles rápidos para uso com 1 mão</p>
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

        {/* Global Dispatch Button */}
        <button
          onClick={() => {
            setQuickActionSheetOpen(false);
            setNewRideModalOpen(true);
          }}
          className="w-full py-4 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all min-h-[52px]"
        >
          <Car className="w-5 h-5" />
          <span>Solicitar & Despachar Corrida</span>
        </button>

        {/* Quick Search */}
        <button
          onClick={() => {
            setQuickActionSheetOpen(false);
            setCommandPaletteOpen(true);
          }}
          className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-3 hover:bg-white/10 active:scale-95 transition-all min-h-[48px]"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span>Buscar corridas, motoristas, frotas...</span>
        </button>

        {/* Ergonomic Hand Switcher */}
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Hand className="w-3.5 h-3.5 text-indigo-400" /> Posição dos Controles Táteis
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setHandPreference('left')}
              className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all active:scale-95 min-h-[48px] ${
                handPreference === 'left'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <span>Esquerda</span>
            </button>
            <button
              onClick={() => setHandPreference('center')}
              className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all active:scale-95 min-h-[48px] ${
                handPreference === 'center'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <span>Centro</span>
            </button>
            <button
              onClick={() => setHandPreference('right')}
              className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all active:scale-95 min-h-[48px] ${
                handPreference === 'right'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <span>Direita</span>
            </button>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Simular Perfil de Usuário
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['admin', 'empresa', 'motorista', 'cliente'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setActiveRole(r)}
                className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all active:scale-95 min-h-[48px] ${
                  activeRole === r
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <div>
                  <div className="font-bold capitalize">{r}</div>
                  <div className="text-[10px] text-slate-400 truncate">{roleProfiles[r].name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Modules Navigation Links */}
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Módulos do Sistema
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleNavigate('/')}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-2.5 active:scale-95 transition-all min-h-[48px]"
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleNavigate('/corridas')}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-2.5 active:scale-95 transition-all min-h-[48px]"
            >
              <Car className="w-4 h-4 text-indigo-400" />
              <span>Corridas</span>
            </button>
            <button
              onClick={() => handleNavigate('/financeiro')}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-2.5 active:scale-95 transition-all min-h-[48px]"
            >
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span>Financeiro</span>
            </button>
            <button
              onClick={() => handleNavigate('/motoristas')}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-2.5 active:scale-95 transition-all min-h-[48px]"
            >
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Motoristas</span>
            </button>
            <button
              onClick={() => handleNavigate('/clientes')}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-2.5 active:scale-95 transition-all min-h-[48px]"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Clientes</span>
            </button>
            <button
              onClick={() => handleNavigate('/empresas')}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-2.5 active:scale-95 transition-all min-h-[48px]"
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Empresas</span>
            </button>
            <button
              onClick={() => handleNavigate('/relatorios')}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-2.5 active:scale-95 transition-all min-h-[48px]"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Relatórios</span>
            </button>
            <button
              onClick={() => handleNavigate('/configuracoes')}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-medium flex items-center gap-2.5 active:scale-95 transition-all min-h-[48px]"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Configurações</span>
            </button>
          </div>
        </div>

        {/* Financial Mode Switch & Theme Toggle */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
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
