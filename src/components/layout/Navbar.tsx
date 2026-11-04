'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import {
  Sun,
  Moon,
  LogOut,
  Menu,
  Bell,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebarMobile?: () => void;
  onToggleCollapseDesktop?: () => void;
}

export function Navbar({
  onToggleSidebarMobile,
  onToggleCollapseDesktop,
}: NavbarProps) {
  const { user, perfil, theme, toggleTheme, signOut, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 sm:px-6 transition-colors">
      {/* Left items: Menu toggle & Context */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapseDesktop}
          className="hidden lg:flex p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Alternar menú lateral"
          aria-label="Alternar ancho del menú lateral"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Plant Context Tag */}
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60 py-1 px-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-xs animate-pulse" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px] sm:max-w-none">
            Planta Cogeneración
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
          <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
            Bahía Norte
          </span>
        </div>
      </div>

      {/* Right items: Notification, Theme, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Notification bell */}
        <Link
          href="/reportes?estado=pendiente"
          className="relative p-2.5 sm:p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Ver reportes pendientes de revisión"
          aria-label="Ver reportes pendientes"
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"
            aria-hidden="true"
          />
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 sm:p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* User preview and Sign out */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 ml-1 border-l border-slate-200 dark:border-slate-800">
          <div
            className="w-8 h-8 rounded-full bg-blue-600/10 dark:bg-blue-500/20 border border-blue-500/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shadow-xs"
            aria-hidden="true"
          >
            {(perfil?.nombre || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="text-left hidden md:block leading-tight pr-1">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[130px]">
              {perfil?.nombre || user?.email?.split('@')[0]}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {isAdmin ? 'Administrador' : 'Supervisor'}
            </span>
          </div>

          <button
            onClick={signOut}
            className="p-2.5 sm:p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}