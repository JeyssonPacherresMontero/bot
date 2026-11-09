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
import type { Reporte, EquipoConsolidado } from '@/types/database.types';
import { Wrench, Search, ChevronRight, AlertTriangle, RefreshCw, X, Info } from 'lucide-react';

export default function EquiposPage() {
  const [equipos, setEquipos] = useState<EquipoConsolidado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  const loadEquipos = useCallback(async () => {
    setLoading(true);
    try {
      // Consulta reportes confirmados y visibles para consolidar equipos reales
      const { data, error } = await supabase
        .from('reportes')
        .select('id, numero, equipo, codigo_equipo, area, tipo_mantenimiento, falla, duracion_minutos, created_at, estado')
        .in('estado', ['confirmado', 'revisado', 'rechazado'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al cargar reportes de equipos:', error);
      } else {
        const reportes = (data as Reporte[]) || [];

        // Agrupa por código_equipo si existe, o por nombre normalizado
        const map: Record<string, {
          equipo: string;
          codigo_equipo: string | null;
          area: string | null;
          total_reportes: number;
          total_fallas: number;
          duraciones: number[];
          ultimo_reporte: string;
        }> = {};

        reportes.forEach((r) => {
          const rawCodigo = r.codigo_equipo?.trim();
          const rawNombre = r.equipo?.trim();
          if (!rawCodigo && !rawNombre) return;

          // Clave de agrupación para evitar duplicados por variaciones de mayúsculas/espacios
          const key = rawCodigo ? rawCodigo.toUpperCase() : rawNombre!.toLowerCase();

          const prev = map[key] || {
            equipo: rawNombre || rawCodigo || 'Sin nombre',
            codigo_equipo: rawCodigo || null,
            area: r.area || null,
            total_reportes: 0,
            total_fallas: 0,
            duraciones: [],
            ultimo_reporte: r.created_at,
          };

          prev.total_reportes += 1;

          // Diferencia cantidad de fallas de cantidad de reportes
          const esFalla = Boolean(r.falla || r.tipo_mantenimiento === 'correctivo');
          if (esFalla) {
            prev.total_fallas += 1;
          }

          if (r.duracion_minutos && r.duracion_minutos > 0) {
            prev.duraciones.push(r.duracion_minutos);
          }

          if (r.area && !prev.area) {
            prev.area = r.area;
          }

          if (new Date(r.created_at) > new Date(prev.ultimo_reporte)) {
            prev.ultimo_reporte = r.created_at;
          }

          map[key] = prev;
        });

        const lista: EquipoConsolidado[] = Object.values(map).map((item) => ({
          id_clave: item.codigo_equipo || item.equipo,
          equipo: item.equipo,
          codigo_equipo: item.codigo_equipo,
          area: item.area,
          total_reportes: item.total_reportes,
          total_fallas: item.total_fallas,
          duracion_promedio_min:
            item.duraciones.length > 0
              ? Math.round((item.duraciones.reduce((a, b) => a + b, 0) / item.duraciones.length) * 10) / 10
              : null,
          ultimo_reporte: item.ultimo_reporte,
        }));

        lista.sort((a, b) => b.total_reportes - a.total_reportes);
        setEquipos(lista);
      }
    } catch (err) {
      console.error('Error cargando equipos:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadEquipos();
  }, [loadEquipos]);

  const filteredEquipos = equipos.filter((item) => {
    const q = search.toLowerCase().trim();
    return (
      (item.equipo || '').toLowerCase().includes(q) ||
      (item.codigo_equipo || '').toLowerCase().includes(q) ||
      (item.area || '').toLowerCase().includes(q)
    );
  });

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por equipo, código o área..."
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
        title="Equipos e Instalaciones Observadas"
        subtitle="Consolidado de activos identificados en reportes técnicos de mantenimiento confirmados"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Equipos', active: true },
        ]}
        actions={actions}
      />

      {/* Nota técnica sobre catálogo no maestro */}
      <Card className="p-3.5 text-xs bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong>Origen de datos:</strong> Este módulo no constituye un catálogo maestro de activos independiente; la información se compila de manera dinámica a partir de los reportes técnicos confirmados por los operadores.
        </p>
      </Card>

      {/* Equipment Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Wrench className="w-4 h-4" />
            </div>
            <CardTitle>
              <span>Equipos con Intervenciones Reportadas</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md ml-1">
                {filteredEquipos.length}
              </span>
            </CardTitle>
          </div>
        </CardHeader>

        <div className="p-0">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={6} cols={6} />
            </div>
          ) : filteredEquipos.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title={search ? 'No se encontraron coincidencias' : 'No hay equipos registrados'}
              description={
                search
                  ? `No se encontraron equipos o tags coincidentes con "${search}".`
                  : 'Los equipos se registrarán automáticamente conforme se confirmen reportes desde Telegram.'
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
                      <th className="py-3 px-4">Equipo y Activo</th>
                      <th className="py-3 px-4">Código / Tag</th>
                      <th className="py-3 px-4">Área</th>
                      <th className="py-3 px-4">Reportes Totales</th>
                      <th className="py-3 px-4">Fallas Reportadas</th>
                      <th className="py-3 px-4">Duración Media</th>
                      <th className="py-3 px-4">Última Intervención</th>
                      <th className="py-3 px-4 text-right">Historial</th>
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
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {eq.codigo_equipo || 'Sin tag'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {eq.area || 'Sin área asignada'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {eq.total_reportes}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                              eq.total_fallas > 0
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {eq.total_fallas} falla{eq.total_fallas === 1 ? '' : 's'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatMinutos(eq.duracion_promedio_min)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatFechaHoraLima(eq.ultimo_reporte)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/equipos/${encodeURIComponent(eq.id_clave)}`}
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
                      <div>
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 block">
                          {eq.equipo}
                        </span>
                        {eq.codigo_equipo && (
                          <span className="text-[11px] font-mono text-slate-500">
                            Tag: {eq.codigo_equipo}
                          </span>
                        )}
                      </div>
                      <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold px-2 py-0.5 rounded-md">
                        {eq.total_fallas} fallas
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>{eq.total_reportes} reportes totales</span>
                      <span>Media: {formatMinutos(eq.duracion_promedio_min)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Link
                        href={`/equipos/${encodeURIComponent(eq.id_clave)}`}
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
          <span>Central Cogeneración · Visualización consolidada desde reportes confirmados</span>
        </CardFooter>
      </Card>
    </div>
  );
}
