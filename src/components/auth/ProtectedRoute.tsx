// components/auth/ProtectedRoute.tsx
import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthPage } from '../../pages/AuthPage';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <AuthPage />;
  }
  
  return <>{children}</>;
};