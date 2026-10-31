'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Bot,
  UserCog,
  Search,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function Sidebar({ onNavigate, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin, user, perfil } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const navSections = [
    {
      title: 'OPERACIONES',
      items: [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          adminOnly: false,
        },
        {
          label: 'Reportes de Planta',
          href: '/reportes',
          icon: ClipboardList,
          adminOnly: false,
        },
        {
          label: 'Equipos e Instalaciones',
          href: '/equipos',
          icon: Wrench,
          adminOnly: false,
        },
      ],
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
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
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between shrink-0 h-full select-none transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-4 bg-slate-900 border-b border-slate-800/80 shrink-0 gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold shadow-xs shrink-0">
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          {!collapsed && (
            <Link
              href="/dashboard"
              className="flex flex-col hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-semibold text-base tracking-tight text-white">Maint</span>
                <span className="font-bold text-base tracking-tight text-blue-400">AI</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">
                Cogeneración
              </span>
            </Link>
          )}
        </div>

        {/* User Panel - Integrated single-tone look */}
        {!collapsed && (
          <div className="px-4 py-3.5 border-b border-slate-800/60 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-semibold text-xs shrink-0 shadow-xs">
              {(perfil?.nombre || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-slate-100 truncate">
                {perfil?.nombre || user?.email?.split('@')[0] || 'Supervisor'}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span className="text-slate-400">{isAdmin ? 'Administrador' : 'Supervisor'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Search - Subtle & monochromatic */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar en menú..."
                className="w-full bg-slate-950/60 text-slate-200 placeholder-slate-500 text-xs px-3 py-1.5 pr-8 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navSections.map((sec, sIdx) => {
            const visibleItems = sec.items.filter((item) => {
              if (item.adminOnly && !isAdmin) return false;
              if (searchTerm.trim()) {
                return item.label
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase().trim());
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {sec.title}
                  </div>
                )}
                {visibleItems.map((item) => {
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
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group',
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20 shadow-xs'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-blue-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer info - Single tone and clean */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-400 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-slate-300 text-[11px] truncate">
              Vaporsur Cogeneración
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <p className="text-[10px] text-slate-500 truncate">Refinería Bahía Norte</p>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Supervisión</span>
            <span className="text-emerald-400 font-medium">Activo</span>
          </div>
        </div>
      )}
    </aside>
  );
}
