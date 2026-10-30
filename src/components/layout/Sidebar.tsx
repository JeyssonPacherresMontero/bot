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
  Zap,
  Search,
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
      title: 'PRINCIPAL',
      items: [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          badge: 'v3.4',
          badgeColor: 'bg-[#17a2b8] text-white',
          adminOnly: false,
        },
        {
          label: 'Reportes de Planta',
          href: '/reportes',
          icon: ClipboardList,
          badge: 'OTs',
          badgeColor: 'bg-[#ffc107] text-[#1f2d3d]',
          adminOnly: false,
        },
        {
          label: 'Equipos e Instalaciones',
          href: '/equipos',
          icon: Wrench,
          badge: null,
          adminOnly: false,
        },
      ],
    },
    {
      title: 'ADMINISTRACIÓN & BOT',
      items: [
        {
          label: 'Técnicos Telegram',
          href: '/tecnicos',
          icon: Bot,
          badge: 'Telegram',
          badgeColor: 'bg-[#007bff] text-white',
          adminOnly: true,
        },
        {
          label: 'Gestión Usuarios',
          href: '/usuarios',
          icon: UserCog,
          badge: 'Admin',
          badgeColor: 'bg-[#6f42c1] text-white',
          adminOnly: true,
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'bg-[#343a40] text-[#c2c7d0] border-r border-[#4b545c] flex flex-col justify-between shrink-0 h-full select-none transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Logo Header */}
        <div className="h-[57px] flex items-center px-4 bg-[#343a40] border-b border-[#4b545c] shrink-0 gap-3">
          <div className="w-8 h-8 rounded-[0.25rem] bg-[#007bff] text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          {!collapsed && (
            <Link
              href="/dashboard"
              className="font-normal text-lg tracking-tight text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <span className="font-light text-gray-200">Maint</span>
              <span className="font-bold text-white">AI</span>
              <span className="text-[10px] bg-[#007bff] text-white px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">
                LTE
              </span>
            </Link>
          )}
        </div>

        {/* User Panel */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-[#4b545c]/80 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#495057] border border-[#6c757d] flex items-center justify-center font-bold text-white text-sm shrink-0">
              {(perfil?.nombre || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-white truncate">
                {perfil?.nombre || user?.email?.split('@')[0] || 'Supervisor'}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-[#28a745] inline-block animate-pulse" />
                <span className="text-[11px] text-gray-300">En línea</span>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Search */}
        {!collapsed && (
          <div className="p-3 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar menú..."
                className="w-full bg-[#3f474e] text-white placeholder-gray-400 text-xs px-3 py-1.5 pr-8 rounded-[0.25rem] border border-[#4b545c] focus:outline-none focus:border-[#80bdff] transition-all"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
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
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
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
                        'flex items-center gap-3 px-3 py-2 rounded-[0.25rem] text-sm font-normal transition-colors group',
                        isActive
                          ? 'bg-[#007bff] text-white font-medium shadow-xs'
                          : 'text-[#c2c7d0] hover:bg-white/10 hover:text-white',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-white'
                            : 'text-[#c2c7d0] group-hover:text-white'
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem]',
                                item.badgeColor || 'bg-[#6c757d] text-white'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer info */}
      {!collapsed && (
        <div className="p-3 m-2 rounded-[0.25rem] bg-[#292d32] border border-[#4b545c] text-xs text-gray-400 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gray-200 text-[11px] truncate">
              Vaporsur Cogeneración
            </span>
            <span className="w-2 h-2 rounded-full bg-[#28a745]" />
          </div>
          <p className="text-[10px] text-gray-400">Refinería Bahía Norte</p>
          <div className="mt-1.5 pt-1.5 border-t border-[#3f474e] flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Sup. Planta</span>
            <span className="text-[#007bff] font-semibold">Online 24/7</span>
          </div>
        </div>
      )}
    </aside>
  );
}
