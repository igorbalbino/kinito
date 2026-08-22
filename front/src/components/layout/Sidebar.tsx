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
  LayoutDashboard,
  LogOut,
  Bell,
  Settings,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../hooks/useTranslation';
import { apiLogout } from '../../lib/api';
import { ROLE_LABELS, sessionDisplayProfile } from '../../lib/sessionProfile';
import { canAccessRoute } from '../../lib/navByRole';
import { useNavigate } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    activeRole,
    switchActiveRole,
    financialMode,
    notifications,
    resetDomainData,
  } = useAppStore();

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore */
    }
    resetDomainData();
    navigate('/login');
  };
  const unreadCount = notifications.filter((n) => !n.read).length;
  const profile = sessionDisplayProfile(activeRole);
  const availableRoles = profile.roles;

  const navItems = [
    { path: '/dashboard', label: t.nav.dashboardLong, icon: LayoutDashboard },
    { path: '/corridas', label: t.nav.rides, icon: Car },
    { path: '/clientes', label: t.nav.clients, icon: Users },
    { path: '/motoristas', label: t.nav.drivers, icon: UserCheck },
    { path: '/empresas', label: t.nav.companies, icon: Building2 },
    { path: '/financeiro', label: t.nav.financial, icon: CreditCard },
    { path: '/relatorios', label: t.nav.reports, icon: BarChart3 },
    { path: '/logs', label: t.nav.logs, icon: Activity },
    {
      path: '/notificacoes',
      label: t.nav.notifications,
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { path: '/configuracoes', label: t.nav.settings, icon: Settings },
    { path: '/fornecedores', label: 'Fornecedores', icon: Building2 },
    { path: '/perfil', label: t.nav.profile, icon: Zap },
  ].filter((item) => canAccessRoute(activeRole, item.path));

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen z-30 hidden md:flex flex-col border-r bg-white dark:bg-[#09090b] border-slate-200 dark:border-white/10 transition-all duration-300 select-none shrink-0',
        isSidebarCollapsed ? 'w-[4.5rem]' : 'w-64'
      )}
    >
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

      {!isSidebarCollapsed && (
        <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5 px-1">
            Sessão
          </div>
          <div className={`mb-2 px-2.5 py-1.5 rounded-md border text-xs font-semibold ${ROLE_LABELS[activeRole].color}`}>
            {profile.name}
            <div className="text-[10px] font-medium opacity-80">{profile.badge}</div>
          </div>
          {availableRoles.length > 1 && (
            <div className="space-y-1" role="listbox" aria-label="Papel da sessão">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  role="option"
                  aria-selected={activeRole === role}
                  onClick={() => switchActiveRole(role)}
                  className={cn(
                    'w-full text-left text-xs font-medium py-1.5 px-2.5 rounded-md border transition-colors',
                    activeRole === role
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30 font-semibold'
                      : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-indigo-500/40'
                  )}
                >
                  {ROLE_LABELS[role].label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
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

              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-white dark:bg-[#121215] text-slate-900 dark:text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-200 dark:border-white/10 shadow-xl">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

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

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="w-full flex items-center gap-2.5 p-2 rounded-md border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 text-xs text-slate-500 hover:text-rose-400 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isSidebarCollapsed && <span className="font-semibold">{t.nav.logout}</span>}
        </button>

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
