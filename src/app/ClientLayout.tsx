'use client';

import Sidebar from '../app/components/sidebar/page';
import { AuthProvider } from '../contexts/AuthContext';
import ProtectedRoute from '../app/components/ProtectedRoute';
import { usePathname } from 'next/navigation';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  // Se for página de login, não mostra o Sidebar nem usa o ProtectedRoute
  if (isLoginPage) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}