import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Building2,
  Car,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileText,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Bell,
  Settings,
  ShieldAlert,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../hooks/useTranslation';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    activeRole,
    setActiveRole,
    financialMode,
    featureFlags,
    notifications,
  } = useAppStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabels = {
    admin: { label: 'Administrador', badge: 'Admin Master', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    empresa: { label: 'Empresa / Distribuidor', badge: 'Veloce Logística', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    motorista: { label: 'Motorista', badge: 'Gabriel Silva', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    cliente: { label: 'Cliente', badge: 'Lucas Santos', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  };

  const navItems = [
    { path: '/', label: t.nav.home, icon: Home, flag: null },
    { path: '/dashboard', label: t.nav.dashboardLong, icon: LayoutDashboard, flag: null },
    { path: '/corridas', label: t.nav.rides, icon: Car, flag: null },
    { path: '/clientes', label: t.nav.clients, icon: Users, flag: 'moduloClientes' as const },
    { path: '/motoristas', label: t.nav.drivers, icon: UserCheck, flag: 'moduloMotoristas' as const },
    { path: '/empresas', label: t.nav.companies, icon: Building2, flag: null },
    { path: '/financeiro', label: t.nav.financial, icon: CreditCard, flag: null },
    { path: '/relatorios', label: t.nav.reports, icon: BarChart3, flag: 'relatoriosFinanceiros' as const },
    { path: '/logs', label: t.nav.logs, icon: Activity, flag: 'logsAvancados' as const },
    {
      path: '/notificacoes',
      label: t.nav.notifications,
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      flag: 'notificacoesPush' as const,
    },
    { path: '/configuracoes', label: t.nav.settings, icon: Settings, flag: null },
    { path: '/perfil', label: t.nav.profile, icon: Zap, flag: null },
  ];

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen z-30 hidden md:flex flex-col border-r bg-white dark:bg-[#09090b] border-slate-200 dark:border-white/10 transition-all duration-300 select-none shrink-0',
        isSidebarCollapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3 overflow-hidden">
          <BrandLogo className="w-8 h-8 rounded-lg shadow-md" />
          {!isSidebarCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-slate-100 truncate">
                Kinito
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Gestão de Corridas
              </span>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          title={isSidebarCollapsed ? 'Expandir Sidebar' : 'Recolher Sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Profile Badge & Quick Selector */}
      {!isSidebarCollapsed && (
        <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5 px-1">
            Visão de Perfil Ativa
          </div>
          <div className="relative">
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as any)}
              className="w-full text-xs font-medium py-1.5 px-2.5 rounded-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 cursor-pointer hover:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="admin" className="bg-white dark:bg-[#121215] text-slate-900 dark:text-slate-100">👨‍💼 Administrador Master</option>
              <option value="empresa" className="bg-white dark:bg-[#121215] text-slate-900 dark:text-slate-100">🏢 Empresa / Distribuidor</option>
              <option value="motorista" className="bg-white dark:bg-[#121215] text-slate-900 dark:text-slate-100">🚗 Motorista (Gabriel Silva)</option>
              <option value="cliente" className="bg-white dark:bg-[#121215] text-slate-900 dark:text-slate-100">👤 Cliente (Lucas Santos)</option>
            </select>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // If flag exists and is disabled
          if (item.flag && !featureFlags[item.flag]) {
            return null;
          }

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all relative group border',
                  isActive
                    ? 'bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-white border-indigo-200 dark:border-white/10 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}

              {item.badge !== undefined && (
                <span
                  className={cn(
                    'ml-auto rounded-full text-[10px] font-bold px-1.5 py-0.2 shrink-0 border border-indigo-500/30',
                    isSidebarCollapsed ? 'absolute top-1 right-1' : '',
                    'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  )}
                >
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapsed hover */}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-white dark:bg-[#121215] text-slate-900 dark:text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-200 dark:border-white/10 shadow-xl">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Financial Processing Indicator at Bottom */}
      <div className="p-3 border-t border-white/10 bg-white/[0.02] space-y-2">
        <NavLink
          to="/configuracoes"
          className={cn(
            'flex items-center gap-2.5 p-2 rounded-md border text-xs transition-all',
            financialMode === 'stripe'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          )}
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              financialMode === 'stripe' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            )}
          />
          {!isSidebarCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-[11px] truncate">
                {financialMode === 'stripe' ? 'Stripe Connected' : 'Processamento Manual'}
              </span>
              <span className="text-[10px] opacity-70 truncate">
                {financialMode === 'stripe' ? 'Automated Payouts' : 'Estimativa Não Confirmada'}
              </span>
            </div>
          )}
        </NavLink>

        {!isSidebarCollapsed && (
          <div className="pt-1 text-[10px] text-center text-slate-500">
            <a
              href="https://creatioinc.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              made by creatioinc.com
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>
    </aside>
  );
};
