'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useAuth } from '@/contexts/auth-context';
import { X, Cpu } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const { isLoading, user } = useAuth();

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileSidebarOpen]);

  // Lock scroll on mobile when sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#090d16] p-4"
        role="status"
        aria-live="polite"
      >
        <div className="text-center space-y-4 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200/80 dark:border-slate-800 max-w-xs w-full animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Iniciando MaintAI
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cargando panel de supervisión...
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-[shimmer_1.5s_infinite] w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, just render children (like /login)
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-blue-500/20 selection:text-blue-600">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0 sticky top-0 h-screen z-20">
        <Sidebar collapsed={desktopCollapsed} />
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación móvil"
        >
          {/* Backdrop with fade */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer with slide */}
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-slate-900 shadow-modal z-10 h-full border-r border-slate-800 animate-slide-in-up">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-3.5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-3.5 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto focus:outline-none"
        >
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}