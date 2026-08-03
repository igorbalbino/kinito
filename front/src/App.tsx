import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { CommandPalette } from './components/layout/CommandPalette';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { MobileBottomDock } from './components/layout/MobileBottomDock';
import { MobileQuickDrawerSheet } from './components/modals/MobileQuickDrawerSheet';
import { TactileFloatingFAB } from './components/common/TactileFloatingFAB';
import { NewRideModal } from './components/modals/NewRideModal';
import { useAppStore } from './store/useAppStore';

import { LandingView } from './views/LandingView';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { ClientesView } from './views/ClientesView';
import { ConfiguracoesView } from './views/ConfiguracoesView';
import { CorridasView } from './views/CorridasView';
import { DashboardView } from './views/DashboardView';
import { EmpresasView } from './views/EmpresasView';
import { FinanceiroView } from './views/FinanceiroView';
import { LogsView } from './views/LogsView';
import { MotoristasView } from './views/MotoristasView';
import { NotificacoesView } from './views/NotificacoesView';
import { PerfilView } from './views/PerfilView';
import { RelatoriosView } from './views/RelatoriosView';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isStandalonePage = ['/', '/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 flex font-sans antialiased selection:bg-indigo-600 selection:text-white relative transition-colors duration-200">
      {!isStandalonePage && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {!isStandalonePage && <Topbar />}

        <main className={isStandalonePage ? 'flex-1 overflow-y-auto' : 'flex-1 p-4 md:p-6 overflow-y-auto'}>
          <Routes>
            <Route path="/" element={<LandingView />} />
            <Route path="/login" element={<LoginView />} />
            <Route path="/register" element={<RegisterView />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/corridas" element={<CorridasView />} />
            <Route path="/clientes" element={<ClientesView />} />
            <Route path="/motoristas" element={<MotoristasView />} />
            <Route path="/empresas" element={<EmpresasView />} />
            <Route path="/financeiro" element={<FinanceiroView />} />
            <Route path="/relatorios" element={<RelatoriosView />} />
            <Route path="/logs" element={<LogsView />} />
            <Route path="/notificacoes" element={<NotificacoesView />} />
            <Route path="/perfil" element={<PerfilView />} />
            <Route path="/configuracoes" element={<ConfiguracoesView />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Ergonomic Touch Dock & FAB */}
      {!isStandalonePage && <MobileBottomDock />}
      <TactileFloatingFAB />

      {/* Mobile Slide-Up Quick Drawer Sheet */}
      <MobileQuickDrawerSheet />

      {/* Global New Ride Modal */}
      <NewRideModal />

      {/* Global Command Palette Search Modal */}
      <CommandPalette />
    </div>
  );
};

export default function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
