'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatFechaHoraLima, formatMinutos } from '@/lib/utils';
import type { VFallasPorEquipo } from '@/types/database.types';
import { Wrench, Search, ChevronRight, AlertTriangle, Clock } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Equipos e Instalaciones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoreo de frecuencia de averías, tiempos promedio y fecha de última intervención por equipo.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar equipo o tag..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={4} />
          </div>
        ) : filteredEquipos.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No se encontraron equipos registrados
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Los equipos aparecerán automáticamente a medida que los técnicos registren reportes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Equipo / Código Identificador</th>
                  <th className="py-3.5 px-4">Total de Fallas Reportadas</th>
                  <th className="py-3.5 px-4">Duración Promedio de Atención</th>
                  <th className="py-3.5 px-4">Última Intervención</th>
                  <th className="py-3.5 px-4 text-right">Historial Completo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEquipos.map((eq, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {eq.equipo}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                        {eq.total_fallas} falla{eq.total_fallas === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatMinutos(eq.duracion_promedio_min)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatFechaHoraLima(eq.ultimo_reporte)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/equipos/${encodeURIComponent(eq.equipo)}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                      >
                        <span>Ver Línea de Tiempo</span>
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
    </div>
  );
}
