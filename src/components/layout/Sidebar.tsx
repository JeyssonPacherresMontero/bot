'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Bot,
  UserCog,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      label: 'Reportes',
      href: '/reportes',
      icon: ClipboardList,
      adminOnly: false,
    },
    {
      label: 'Equipos',
      href: '/equipos',
      icon: Wrench,
      adminOnly: false,
    },
    {
      label: 'Técnicos Telegram',
      href: '/tecnicos',
      icon: Bot,
      adminOnly: true,
    },
    {
      label: 'Gestión Usuarios',
      href: '/usuarios',
      icon: UserCog,
      adminOnly: true,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shrink-0 h-full">
      <div>
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
            <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1">
              Maint<span className="text-emerald-600 dark:text-emerald-400">AI</span>
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500 block">
              Panel Supervisor
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1.5" aria-label="Navegación principal">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0',
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  )}
                />
                <span>{item.label}</span>
                {item.adminOnly && (
                  <span className="ml-auto text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="p-4 m-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Refinería Bahía Norte
        </p>
        <p className="mt-0.5 text-[11px]">Central Térmica Cogeneración</p>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span className="font-medium">Sistema en línea</span>
        </div>
      </div>
    </aside>
  );
}
