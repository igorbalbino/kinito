import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  User,
  Zap,
} from 'lucide-react';
import { formatShortDate } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';
import { LanguageSelector } from '../common/LanguageSelector';
import { useTranslation } from '../../hooks/useTranslation';

export const Topbar: React.FC = () => {
  const { t } = useTranslation();
  const {
    theme,
    toggleTheme,
    activeRole,
    setActiveRole,
    financialMode,
    setFinancialMode,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setCommandPaletteOpen,
  } = useAppStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleProfiles = {
    admin: { name: 'Administrador Master', email: 'admin@kinito.test', badge: 'Admin Master' },
    empresa: { name: 'Veloce Logística', email: 'contato@velocelog.com.br', badge: 'Empresa' },
    motorista: { name: 'Gabriel Silva', email: 'gabriel.silva@motorista.com', badge: 'Motorista' },
    cliente: { name: 'Lucas Santos', email: 'lucas.santos@gmail.com', badge: 'Cliente VIP' },
  };

  const currentProfile = roleProfiles[activeRole];

  return (
    <header className="h-16 px-6 border-b bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-slate-200 dark:border-white/10 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Global Search Bar Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition-all text-xs w-36 sm:w-64 md:w-80 group min-h-[40px] active:scale-95"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
          <span className="truncate">{t.common.searchPlaceholder}</span>
          <kbd className="ml-auto hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/10">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Language Selector Dropdown */}
        <LanguageSelector variant="compact" />

        {/* Financial Mode Badge & Quick Switcher */}
        <button
          onClick={() => setFinancialMode(financialMode === 'stripe' ? 'manual' : 'stripe')}
          className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
            financialMode === 'stripe'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title="Clique para alterar o modo de processamento financeiro"
        >
          <span className={`w-2 h-2 rounded-full ${financialMode === 'stripe' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{financialMode === 'stripe' ? t.common.stripeConnected : t.common.manualMode}</span>
        </button>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-transparent hover:border-slate-300 dark:hover:border-white/10"
          title="Alternar Tema Claro / Escuro"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Notifications Popover Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors relative border border-slate-200 dark:border-transparent hover:border-slate-300 dark:hover:border-white/10"
            title="Central de Notificações"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 shadow-2xl py-2 z-50 text-xs text-slate-900 dark:text-slate-100">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Marcar todas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                {notifications.slice(0, 6).map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    className={`p-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors flex items-start gap-3 ${
                      !notif.read ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''
                    }`}
                  >
                    <div className="mt-0.5">
                      {!notif.read ? (
                        <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 dark:text-slate-200">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{formatShortDate(notif.timestamp)}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-snug">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 border-t border-slate-200 dark:border-white/10 text-center">
                <NavLink
                  to="/notificacoes"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Ver Central Completa
                </NavLink>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
              {currentProfile.name.slice(0, 2)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-none">
                {currentProfile.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {currentProfile.badge}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 shadow-2xl py-2 z-50 text-xs text-slate-900 dark:text-slate-100">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{currentProfile.name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">{currentProfile.email}</p>
              </div>

              <div className="p-2 space-y-1">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 py-1">
                  Trocar Perfil / Role
                </div>
                {(['admin', 'empresa', 'motorista', 'cliente'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setActiveRole(r);
                      setIsProfileMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium flex items-center justify-between border ${
                      activeRole === r
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{roleProfiles[r].name}</span>
                    <span className="text-[10px] opacity-75">{roleProfiles[r].badge}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-200 dark:border-white/10 pt-2 px-2 space-y-1">
                <NavLink
                  to="/perfil"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <User className="w-3.5 h-3.5" />
                  Meu Perfil & Segurança
                </NavLink>
                <NavLink
                  to="/configuracoes"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Configurações Gerais
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
