'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import {
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  UserCheck,
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
    <header className="sticky top-0 z-30 flex h-[57px] w-full items-center justify-between border-b border-[#dee2e6] dark:border-[#4b545c] bg-white dark:bg-[#343a40] px-4">
      {/* Left items: Hamburger + Quick links */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-1.5 text-[#495057] dark:text-[#ced4da] hover:text-[#007bff] rounded-[0.25rem] hover:bg-[#e9ecef] dark:hover:bg-[#4b545c] transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapseDesktop}
          className="hidden lg:flex p-1.5 text-[#495057] dark:text-[#ced4da] hover:text-[#007bff] rounded-[0.25rem] hover:bg-[#e9ecef] dark:hover:bg-[#4b545c] transition-colors"
          title="Colapsar / Expandir Barra Lateral"
          aria-label="Colapsar barra lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* AdminLTE style nav links */}
        <nav className="hidden sm:flex items-center space-x-1 text-sm font-medium">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 text-[#495057] dark:text-[#ced4da] hover:text-[#007bff] rounded-[0.25rem] transition-colors"
          >
            Inicio
          </Link>
          <Link
            href="/reportes"
            className="px-3 py-1.5 text-[#495057] dark:text-[#ced4da] hover:text-[#007bff] rounded-[0.25rem] transition-colors"
          >
            Reportes
          </Link>
          <Link
            href="/equipos"
            className="px-3 py-1.5 text-[#495057] dark:text-[#ced4da] hover:text-[#007bff] rounded-[0.25rem] transition-colors"
          >
            Equipos
          </Link>
        </nav>

        {/* Plant Badge */}
        <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-[#dee2e6] dark:border-[#4b545c] text-xs text-[#6c757d] dark:text-[#ced4da]">
          <span className="font-semibold text-[#343a40] dark:text-[#f8f9fa]">
            Vaporsur Energía S.A.C.
          </span>
          <span>·</span>
          <span className="bg-[#28a745] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem]">
            Refinería Bahía Norte
          </span>
        </div>
      </div>

      {/* Right items: Notification, Theme, User, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role badge */}
        {perfil && (
          <div
            className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] text-xs font-bold text-white ${
              isAdmin ? 'bg-[#6f42c1]' : 'bg-[#007bff]'
            }`}
          >
            {isAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <UserCheck className="w-3.5 h-3.5" />
            )}
            <span>{isAdmin ? 'ADMINISTRADOR' : 'SUPERVISOR'}</span>
          </div>
        )}

        {/* Notification bell */}
        <Link
          href="/reportes?estado=pendiente"
          className="relative p-1.5 text-[#495057] dark:text-[#ced4da] hover:text-[#007bff] rounded-[0.25rem] hover:bg-[#e9ecef] dark:hover:bg-[#4b545c] transition-colors"
          title="Ver reportes pendientes"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 bg-[#ffc107] text-[#1f2d3d] text-[10px] font-black px-1 rounded-full leading-tight">
            !
          </span>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-[#495057] dark:text-[#ced4da] hover:text-[#007bff] rounded-[0.25rem] hover:bg-[#e9ecef] dark:hover:bg-[#4b545c] transition-colors"
          title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          aria-label="Alternar tema"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* User preview */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#dee2e6] dark:border-[#4b545c]">
          <div className="w-7 h-7 rounded-full bg-[#007bff] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {(perfil?.nombre || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="text-left hidden lg:block leading-tight">
            <span className="text-xs font-semibold text-[#212529] dark:text-[#f8f9fa] block truncate max-w-[120px]">
              {perfil?.nombre || user?.email?.split('@')[0]}
            </span>
            <span className="text-[10px] text-[#6c757d] dark:text-[#adb5bd]">
              {isAdmin ? 'Admin' : 'Supervisor'}
            </span>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={signOut}
          className="btn-lte bg-[#dc3545] hover:bg-[#c82333] text-white border-[#dc3545] text-xs px-2.5 py-1 rounded-[0.25rem] transition-colors ml-1"
          title="Cerrar sesión"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
