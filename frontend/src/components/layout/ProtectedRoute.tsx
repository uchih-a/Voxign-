import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authStore } from '../../stores/authStore';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  adminOnly = false,
}) => {
  const isAuthenticated = authStore((state) => state.isAuthenticated());
  const isAdmin = authStore((state) => state.isAdmin());

  // Still loading auth state
  const user = authStore((state) => state.user);
  const accessToken = authStore((state) => state.accessToken);

  if (!accessToken || !user) {
    // Not authenticated
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    // Authenticated but not admin
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
