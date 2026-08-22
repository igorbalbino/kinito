import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CommandPalette } from './components/layout/CommandPalette';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { MobileBottomDock } from './components/layout/MobileBottomDock';
import { MobileQuickDrawerSheet } from './components/modals/MobileQuickDrawerSheet';
import { TactileFloatingFAB } from './components/common/TactileFloatingFAB';
import { ScreenHelpFab } from './components/common/ScreenHelpFab';
import { RouteFallback } from './components/common/RouteFallback';
import { NewRideModal } from './components/modals/NewRideModal';
import { ForcePasswordModal } from './components/auth/ForcePasswordModal';
import { RequireAuth } from './components/auth/RequireAuth';
import { RequireRole } from './components/auth/RequireRole';
import { useAppStore } from './store/useAppStore';
import { RequireCompanySubscription } from './components/auth/RequireCompanySubscription';
import { useBootstrapApiData } from './hooks/useBootstrapApiData';

import { LandingView } from './views/LandingView';
import { LandingEmpresasView } from './views/LandingEmpresasView';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { RegisterEmpresaView } from './views/RegisterEmpresaView';
import { VerifyEmailView, PendingVerificationView } from './views/VerifyEmailView';

const PlanSelectionView = lazy(() =>
  import('./views/PlanSelectionView').then((m) => ({ default: m.PlanSelectionView }))
);
const ClientesView = lazy(() => import('./views/ClientesView').then((m) => ({ default: m.ClientesView })));
const ConfiguracoesView = lazy(() =>
  import('./views/ConfiguracoesView').then((m) => ({ default: m.ConfiguracoesView }))
);
const CorridasView = lazy(() => import('./views/CorridasView').then((m) => ({ default: m.CorridasView })));
const DashboardView = lazy(() => import('./views/DashboardView').then((m) => ({ default: m.DashboardView })));
const EmpresasView = lazy(() => import('./views/EmpresasView').then((m) => ({ default: m.EmpresasView })));
const FinanceiroView = lazy(() => import('./views/FinanceiroView').then((m) => ({ default: m.FinanceiroView })));
const LogsView = lazy(() => import('./views/LogsView').then((m) => ({ default: m.LogsView })));
const MotoristasView = lazy(() => import('./views/MotoristasView').then((m) => ({ default: m.MotoristasView })));
const NotificacoesView = lazy(() =>
  import('./views/NotificacoesView').then((m) => ({ default: m.NotificacoesView }))
);
const PerfilView = lazy(() => import('./views/PerfilView').then((m) => ({ default: m.PerfilView })));
const FornecedoresView = lazy(() =>
  import('./views/FornecedoresView').then((m) => ({ default: m.FornecedoresView }))
);
const RelatoriosView = lazy(() => import('./views/RelatoriosView').then((m) => ({ default: m.RelatoriosView })));

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useBootstrapApiData(true);

  return (
    <div className="min-h-dvh w-full max-w-full flex bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-indigo-600 selection:text-white relative transition-colors duration-200 overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-dvh pb-20 md:pb-0">
        <Topbar />
        <main className="flex-1 w-full min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
      <MobileBottomDock />
      <TactileFloatingFAB />
      <ScreenHelpFab />
      <MobileQuickDrawerSheet />
      <NewRideModal />
      <ForcePasswordModal />
      <CommandPalette />
    </div>
  );
};

function Authed({ children, path }: { children: React.ReactNode; path?: string }) {
  return (
    <RequireAuth>
      <RequireRole path={path}>
        <RequireCompanySubscription>
          <AppShell>{children}</AppShell>
        </RequireCompanySubscription>
      </RequireRole>
    </RequireAuth>
  );
}

function AuthedBare({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export default function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingView />} />
          <Route path="/para-empresas" element={<LandingEmpresasView />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />
          <Route path="/register/empresa" element={<RegisterEmpresaView />} />
          <Route path="/verificar-email" element={<VerifyEmailView />} />
          <Route path="/verificar-email-pendente" element={<PendingVerificationView />} />
          <Route path="/escolher-plano" element={<AuthedBare><PlanSelectionView /></AuthedBare>} />
          <Route path="/dashboard" element={<Authed path="/dashboard"><DashboardView /></Authed>} />
          <Route path="/corridas" element={<Authed path="/corridas"><CorridasView /></Authed>} />
          <Route path="/clientes" element={<Authed path="/clientes"><ClientesView /></Authed>} />
          <Route path="/motoristas" element={<Authed path="/motoristas"><MotoristasView /></Authed>} />
          <Route path="/empresas" element={<Authed path="/empresas"><EmpresasView /></Authed>} />
          <Route path="/financeiro" element={<Authed path="/financeiro"><FinanceiroView /></Authed>} />
          <Route path="/relatorios" element={<Authed path="/relatorios"><RelatoriosView /></Authed>} />
          <Route path="/logs" element={<Authed path="/logs"><LogsView /></Authed>} />
          <Route path="/notificacoes" element={<Authed path="/notificacoes"><NotificacoesView /></Authed>} />
          <Route path="/perfil" element={<Authed path="/perfil"><PerfilView /></Authed>} />
          <Route path="/configuracoes" element={<Authed path="/configuracoes"><ConfiguracoesView /></Authed>} />
          <Route path="/fornecedores" element={<Authed path="/fornecedores"><FornecedoresView /></Authed>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
