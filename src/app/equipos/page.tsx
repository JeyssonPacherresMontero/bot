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
          className="form-control-lte text-xs pr-8"
        />
        <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6c757d] pointer-events-none" />
      </div>

      <button
        onClick={loadEquipos}
        disabled={loading}
        className="btn-lte-default text-xs"
        title="Recargar"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#007bff]' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Content Header AdminLTE */}
      <ContentHeader
        title="Equipos e Instalaciones"
        subtitle="Monitoreo de frecuencia de averías, tiempos promedio y fecha de última intervención."
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Equipos', active: true },
        ]}
        actions={actions}
      />

      {/* Equipment Table Card - AdminLTE Card Outline */}
      <div className="lte-card border-t-[3px] border-t-[#007bff]">
        <div className="lte-card-header">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#007bff]" />
            <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
              Inventario de Equipos Activos
            </span>
            <span className="bg-[#007bff] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem]">
              {filteredEquipos.length}
            </span>
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={6} cols={5} />
            </div>
          ) : filteredEquipos.length === 0 ? (
            <div className="p-10 text-center text-[#6c757d] dark:text-[#adb5bd]">
              <AlertTriangle className="w-8 h-8 text-[#ffc107] mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
                No se encontraron equipos registrados
              </p>
              <p className="text-xs text-[#6c757d] dark:text-[#adb5bd] mt-0.5">
                Los equipos aparecerán automáticamente al registrar intervenciones en Telegram.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f4f6f9] dark:bg-[#2c3338] text-[#495057] dark:text-[#ced4da] font-semibold border-b border-[#dee2e6] dark:border-[#4b545c]">
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                      Equipo / Código Identificador
                    </th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                      Total de Fallas Reportadas
                    </th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                      Duración Promedio de Atención
                    </th>
                    <th className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                      Última Intervención
                    </th>
                    <th className="py-2.5 px-3 text-right">Historial Completo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee2e6] dark:divide-[#4b545c]">
                  {filteredEquipos.map((eq, idx) => (
                    <tr
                      key={idx}
                      className="even:bg-[#f8f9fa] dark:even:bg-[#2f353a] hover:bg-[#e9ecef]/60 dark:hover:bg-[#3f474e]/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                        <div className="font-bold text-[#212529] dark:text-[#f8f9fa] text-sm">
                          {eq.equipo}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 border-r border-[#dee2e6] dark:border-[#4b545c]">
                        <span className="bg-[#ffc107] text-[#1f2d3d] text-xs font-bold px-2 py-0.5 rounded-[0.25rem]">
                          {eq.total_fallas} falla{eq.total_fallas === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#495057] dark:text-[#ced4da] border-r border-[#dee2e6] dark:border-[#4b545c]">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#17a2b8]" />
                          {formatMinutos(eq.duracion_promedio_min)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#495057] dark:text-[#ced4da] whitespace-nowrap border-r border-[#dee2e6] dark:border-[#4b545c]">
                        {formatFechaHoraLima(eq.ultimo_reporte)}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <Link
                          href={`/equipos/${encodeURIComponent(eq.equipo)}`}
                          className="btn-lte-primary text-xs px-2.5 py-1"
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
        <div className="lte-card-footer">
          Central Cogeneración · Supervisión de activos de planta
        </div>
      </div>
    </div>
  );
}
