'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { formatFechaHoraLima, formatMinutos } from '@/lib/utils';
import type { VFallasPorEquipo } from '@/types/database.types';
import { Wrench, Search, ChevronRight, AlertTriangle, Clock, RefreshCw, X } from 'lucide-react';

export default function EquiposPage() {
  const [equipos, setEquipos] = useState<VFallasPorEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  const loadEquipos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_fallas_por_equipo')
        .select('*');

      if (error) {
        console.error('Error al cargar fallas por equipo:', error);
      } else {
        setEquipos((data as VFallasPorEquipo[]) || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadEquipos();
  }, [loadEquipos]);

  const filteredEquipos = equipos.filter((item) =>
    (item.equipo || '').toLowerCase().includes(search.toLowerCase().trim())
  );

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar equipo o tag..."
          aria-label="Buscar equipo o tag"
          className="modern-input text-xs pr-8 py-2"
        />
        {search ? (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Borrar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={loadEquipos}
        isLoading={loading}
        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        aria-label="Recargar equipos"
      >
        <span className="hidden sm:inline">Recargar</span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Content Header */}
      <ContentHeader
        title="Equipos e Instalaciones"
        subtitle="Monitoreo de frecuencia de averías, tiempos promedio y fecha de última intervención"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Equipos', active: true },
        ]}
        actions={actions}
      />

      {/* Equipment Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Wrench className="w-4 h-4" />
            </div>
            <CardTitle>
              <span>Inventario de Equipos Activos</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md ml-1">
                {filteredEquipos.length}
              </span>
            </CardTitle>
          </div>
        </CardHeader>

        <div className="p-0">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={6} cols={5} />
            </div>
          ) : filteredEquipos.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title={search ? 'No se encontraron equipos' : 'No hay equipos registrados'}
              description={
                search
                  ? `No se encontraron coincidencias para "${search}". Prueba con otro término.`
                  : 'Los equipos se registrarán automáticamente cuando los técnicos emitan reportes desde Telegram.'
              }
              actionLabel={search ? 'Borrar búsqueda' : undefined}
              onAction={search ? () => setSearch('') : undefined}
              className="py-12"
            />
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                      <th className="py-3 px-4">Equipo e Identificador</th>
                      <th className="py-3 px-4">Total de Fallas Reportadas</th>
                      <th className="py-3 px-4">Duración Promedio de Atención</th>
                      <th className="py-3 px-4">Última Intervención</th>
                      <th className="py-3 px-4 text-right">Historial Completo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredEquipos.map((eq, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {eq.equipo}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-md">
                            {eq.total_fallas} falla{eq.total_fallas === 1 ? '' : 's'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            {formatMinutos(eq.duracion_promedio_min)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatFechaHoraLima(eq.ultimo_reporte)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/equipos/${encodeURIComponent(eq.equipo)}`}
                            className="btn-modern-primary text-xs px-2.5 py-1 focus-visible:ring-2"
                          >
                            <span>Ver Historial</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View (< md) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
                {filteredEquipos.map((eq, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {eq.equipo}
                      </span>
                      <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold px-2 py-0.5 rounded-md">
                        {eq.total_fallas} fallas
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        Media: {formatMinutos(eq.duracion_promedio_min)}
                      </span>
                      <span>{formatFechaHoraLima(eq.ultimo_reporte)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Link
                        href={`/equipos/${encodeURIComponent(eq.equipo)}`}
                        className="btn-modern-primary text-xs px-3 py-1.5 w-full justify-center"
                      >
                        <span>Ver Historial Completo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <CardFooter>
          <span>Central Cogeneración · Supervisión de activos de planta</span>
        </CardFooter>
      </Card>
    </div>
  );
}