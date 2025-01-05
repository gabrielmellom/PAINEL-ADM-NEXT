'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import ProtectedRoute from '../app/components/ProtectedRoute';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    </AuthProvider>
  );
}