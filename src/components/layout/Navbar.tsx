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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6">
      {/* Left items: Menu toggle & Context */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapseDesktop}
          className="hidden lg:flex p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Alternar menú lateral"
          aria-label="Alternar menú lateral"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Plant Context Tag */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Planta Cogeneración
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-slate-500 dark:text-slate-400">
            Bahía Norte
          </span>
        </div>
      </div>

      {/* Right items: Notification, Theme, User Profile */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Notification bell with subtle indicator */}
        <Link
          href="/reportes?estado=pendiente"
          className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Ver reportes pendientes"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          aria-label="Alternar tema"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* User preview and Sign out */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 ml-1 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-semibold text-xs shadow-xs">
            {(perfil?.nombre || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="text-left hidden md:block leading-tight pr-1">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block truncate max-w-[130px]">
              {perfil?.nombre || user?.email?.split('@')[0]}
            </span>
            <span className="text-[10px] text-slate-400">
              {isAdmin ? 'Administrador' : 'Supervisor'}
            </span>
          </div>

          <button
            onClick={signOut}
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-1"
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
