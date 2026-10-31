'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatFechaHoraLima, formatMinutos } from '@/lib/utils';
import type { VFallasPorEquipo } from '@/types/database.types';
import { Wrench, Search, ChevronRight, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

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
    <div className="flex items-center gap-2">
      <div className="relative w-48 sm:w-64">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar equipo o tag..."
          className="modern-input text-xs pr-8 py-1.5"
        />
        <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      <button
        onClick={loadEquipos}
        disabled={loading}
        className="btn-modern-default text-xs"
        title="Recargar"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
      </button>
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
      <div className="modern-card">
        <div className="modern-card-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Inventario de Equipos Activos
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">
              {filteredEquipos.length}
            </span>
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={6} cols={5} />
            </div>
          ) : filteredEquipos.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                No se encontraron equipos registrados
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Los equipos aparecerán automáticamente al registrar intervenciones en Telegram.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                    <th className="py-3 px-4">
                      Equipo e Identificador
                    </th>
                    <th className="py-3 px-4">
                      Total de Fallas Reportadas
                    </th>
                    <th className="py-3 px-4">
                      Duración Promedio de Atención
                    </th>
                    <th className="py-3 px-4">
                      Última Intervención
                    </th>
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
                          className="btn-modern-primary text-xs px-2.5 py-1"
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
          )}
        </div>
        <div className="modern-card-footer">
          Central Cogeneración · Supervisión de activos de planta
        </div>
      </div>
    </div>
  );
}
