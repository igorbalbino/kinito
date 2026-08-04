import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getApiToken, isApiConfigured } from '../../lib/api';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  if (!isApiConfigured()) {
    return (
      <div className="p-8 text-center text-sm text-amber-300">
        Configure <code className="font-mono">VITE_API_URL</code> no front para usar o backend.
      </div>
    );
  }

  if (!getApiToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};
