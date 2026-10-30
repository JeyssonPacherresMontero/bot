'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useAuth } from '@/contexts/auth-context';
import { X } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] dark:bg-[#1a2226]">
        <div className="text-center space-y-4 p-8 bg-white dark:bg-[#343a40] rounded-[0.25rem] shadow-lte border border-[#dee2e6] dark:border-[#4b545c]">
          <div className="w-10 h-10 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#495057] dark:text-[#ced4da]">
            Cargando MaintAI LTE...
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, just render children (like /login)
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] dark:bg-[#1e282c] text-[#212529] dark:text-[#ced4da] font-sans antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0 sticky top-0 h-screen z-20">
        <Sidebar collapsed={desktopCollapsed} />
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-64 max-w-xs bg-[#343a40] shadow-2xl z-10 h-full">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-3.5 right-3 p-1.5 text-gray-300 hover:text-white rounded-[0.25rem] hover:bg-white/10"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">
        <Navbar
          onToggleSidebarMobile={() => setMobileSidebarOpen(true)}
          onToggleCollapseDesktop={() => setDesktopCollapsed(!desktopCollapsed)}
        />

        {/* Content Wrapper */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 w-full max-w-[1600px] mx-auto">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
