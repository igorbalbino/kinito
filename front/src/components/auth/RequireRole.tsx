import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { canAccessRoute } from '../../lib/navByRole';
import type { UserRole } from '../../types';

type RequireRoleProps = {
  children: React.ReactNode;
  /** If set, only these roles may enter; otherwise uses navByRole path check. */
  roles?: UserRole[];
  path?: string;
};

export const RequireRole: React.FC<RequireRoleProps> = ({ children, roles, path }) => {
  const activeRole = useAppStore((s) => s.activeRole);

  if (roles && roles.length > 0 && !roles.includes(activeRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (path && !canAccessRoute(activeRole, path)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
