'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Sun, Moon, LogOut, ShieldCheck, UserCheck, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebarMobile?: () => void;
}

export function Navbar({ onToggleSidebarMobile }: NavbarProps) {
  const { user, perfil, theme, toggleTheme, signOut, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              Vaporsur Energía S.A.C.
            </span>
            <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              Refinería Bahía Norte
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Planta de Cogeneración · Supervisión MaintAI
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        {perfil && (
          <div
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isAdmin
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}
          >
            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            <span>{isAdmin ? 'Administrador' : 'Supervisor'}</span>
          </div>
        )}

        {/* User name */}
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
            {perfil?.nombre || user?.email || 'Usuario'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {user?.email}
          </span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          aria-label="Alternar tema"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>

        {/* Logout */}
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
