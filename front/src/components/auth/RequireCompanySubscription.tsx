import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  fetchSubscriptionStatus,
  getApiCompanyId,
  getApiToken,
  isApiConfigured,
  listSessionCompanies,
  setApiCompanyId,
} from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';

const BYPASS_PATHS = ['/escolher-plano', '/configuracoes'];

export const RequireCompanySubscription: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { activeRole } = useAppStore();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    if (!isApiConfigured() || !getApiToken() || activeRole !== 'empresa') {
      setChecking(false);
      setHasAccess(true);
      return;
    }

    if (BYPASS_PATHS.some((p) => location.pathname.startsWith(p))) {
      setChecking(false);
      setHasAccess(true);
      return;
    }

    let cid = getApiCompanyId();
    const companies = listSessionCompanies();
    if (!cid && companies[0]) {
      cid = companies[0].id;
      setApiCompanyId(cid);
    }

    if (!cid) {
      setHasAccess(false);
      setChecking(false);
      return;
    }

    fetchSubscriptionStatus(cid)
      .then((s) => setHasAccess(Boolean(s.has_access)))
      .catch(() => setHasAccess(false))
      .finally(() => setChecking(false));
  }, [activeRole, location.pathname]);

  if (checking) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (activeRole === 'empresa' && !hasAccess && location.pathname !== '/escolher-plano') {
    return <Navigate to="/escolher-plano" replace />;
  }

  return <>{children}</>;
};
