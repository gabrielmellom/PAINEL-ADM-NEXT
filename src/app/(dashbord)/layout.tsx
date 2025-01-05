'use client';

import Sidebar from '../components/sidebar/page';
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '../../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Head from 'next/head';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{ 
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <Head>
        <title>Radio App Brasil</title>
        <meta name="description" content="Radio App Brasil - Sistema de Gerenciamento" />
      </Head>
      <ProtectedRoute>
        <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
