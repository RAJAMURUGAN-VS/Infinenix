// components/auth/ProtectedRoute.tsx
// AUTH DISABLED — remove the early return below to re-enable auth
import React, { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // To re-enable auth, uncomment:
  // const { isAuthenticated } = useAuth();
  // if (!isAuthenticated) return <AuthPage />;

  return <>{children}</>;
};