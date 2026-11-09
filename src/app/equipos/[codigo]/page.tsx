'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { EstadoBadge } from '@/components/badges/EstadoBadge';
import { PrioridadBadge } from '@/components/badges/PrioridadBadge';
import { TipoBadge } from '@/components/badges/TipoBadge';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  formatReporteNumero,
  formatFechaHoraLima,
  formatMinutos,
  formatUnidadesRepuesto,
} from '@/lib/utils';
import type { Reporte } from '@/types/database.types';
import {
  ArrowLeft,
  ExternalLink,
  Layers,
  Repeat,
  Package,
  Wrench,
} from 'lucide-react';

export default function EquipoDetallePage() {
  const params = useParams();
  const rawCodigo = params?.codigo as string;
  const decodedCodigo = decodeURIComponent(rawCodigo || '');

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadHistorial = useCallback(async () => {
    if (!decodedCodigo) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reportes')
        .select('*')
        .or(`equipo.eq.${decodedCodigo},codigo_equipo.eq.${decodedCodigo}`)
        .in('estado', ['confirmado', 'revisado', 'rechazado'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching historial de equipo:', error);
      } else {
        setReportes((data as Reporte[]) || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [decodedCodigo, supabase]);

  useEffect(() => {
    loadHistorial();
  }, [loadHistorial]);

  // Fallas recurrentes
  const recurrentFailures: { falla: string; count: number }[] = React.useMemo(() => {
    const map: Record<string, number> = {};
    reportes.forEach((r) => {
      if (r.falla && r.falla.trim()) {
        const key = r.falla.trim();
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([falla, count]) => ({ falla, count }))
      .sort((a, b) => b.count - a.count);
  }, [reportes]);

  // Repuestos empleados en este equipo, distinguiendo menciones de cantidades informadas
  const repuestosConsumidos: { nombre: string; totalUnidades: number | null; veces: number }[] =
    React.useMemo(() => {
      const map: Record<string, { totalUnidades: number; tieneUnidades: boolean; veces: number }> = {};
      reportes.forEach((r) => {
        (r.repuestos || []).forEach((rep) => {
          if (rep?.nombre && rep.nombre.trim()) {
            const key = rep.nombre.trim();
            const prev = map[key] || { totalUnidades: 0, tieneUnidades: false, veces: 0 };
            prev.veces += 1;
            if (rep.cantidad !== null && rep.cantidad !== undefined && !isNaN(Number(rep.cantidad))) {
              prev.totalUnidades += Number(rep.cantidad);
              prev.tieneUnidades = true;
            }
            map[key] = prev;
          }
        });
      });
      return Object.entries(map)
        .map(([nombre, val]) => ({
          nombre,
          totalUnidades: val.tieneUnidades ? val.totalUnidades : null,
          veces: val.veces,
        }))
        .sort((a, b) => b.veces - a.veces);
    }, [reportes]);

  const actions = (
    <Link href="/equipos">
      <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
        <span>Volver a Equipos</span>
      </Button>
    </Link>
  );

  return (
    <div className="space-y-5">
      {/* Content Header */}
      <ContentHeader
        title={`Historial de Equipo: ${decodedCodigo}`}
        subtitle={`Línea de tiempo de intervenciones, recurrencia de averías y componentes empleados · ${reportes.length} reportes confirmados`}
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Equipos', href: '/equipos' },
          { label: decodedCodigo, active: true },
        ]}
        actions={actions}
      />

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Timeline of interventions */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <CardTitle>
                    <span>Línea de Tiempo de Intervenciones</span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md ml-1">
                      {reportes.length} Reportes
                    </span>
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                {reportes.length === 0 ? (
                  <EmptyState
                    icon={Wrench}
                    title="Sin historial confirmado para este equipo"
                    description="No se han registrado reportes ni intervenciones técnicas confirmadas asociadas a este activo."
                    className="py-8"
                  />
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {reportes.map((r) => (
                      <div key={r.id} className="relative">
                        {/* Timeline node */}
                        <div className="absolute -left-6 top-3 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />

                        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                {formatReporteNumero(r.numero)}
                              </span>
                              <EstadoBadge estado={r.estado} />
                              <TipoBadge tipo={r.tipo_mantenimiento} />
                              <PrioridadBadge prioridad={r.prioridad} />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatFechaHoraLima(r.created_at)}
                            </span>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {r.falla || (r.tipo_mantenimiento === 'preventivo' ? 'Mantenimiento preventivo programado' : 'Intervención de mantenimiento')}
                            </p>
                            {r.causa_probable && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Causa probable (hipótesis):</span> {r.causa_probable}
                              </p>
                            )}
                          </div>

                          {/* Activities preview */}
                          {(r.actividades || []).length > 0 && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1">
                              {r.actividades.slice(0, 3).map((act, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                                  <span>{act}</span>
                                </div>
                              ))}
                              {r.actividades.length > 3 && (
                                <span className="text-[10px] text-slate-400 italic block pt-0.5">
                                  + {r.actividades.length - 3} actividades adicionales
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400">
                              Técnico: <strong className="text-slate-800 dark:text-slate-200">{r.tecnico_nombre || 'Desconocido'}</strong>
                              {r.duracion_minutos ? ` · ${formatMinutos(r.duracion_minutos)}` : ''}
                            </span>

                            <Link
                              href={`/reportes/${r.id}`}
                              className="btn-modern-primary text-xs px-2.5 py-1 focus-visible:ring-2"
                            >
                              <span>Abrir reporte</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Recurrent Failures & Replaced Parts */}
          <div className="space-y-4">
            {/* Fallas recurrentes */}
            <Card>
              <CardHeader className="p-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-xs uppercase tracking-wider">
                    Fallas u Observaciones Recurrentes
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-3">
                {recurrentFailures.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-2 text-center">No hay fallas reportadas para este equipo.</p>
                ) : (
                  <div className="space-y-2">
                    {recurrentFailures.slice(0, 8).map((rf, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                          {rf.falla}
                        </span>
                        <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0">
                          {rf.count} vez{rf.count === 1 ? '' : 'es'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Repuestos empleados */}
            <Card>
              <CardHeader className="p-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-xs uppercase tracking-wider">
                    Repuestos y Componentes Mencionados
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-3">
                {repuestosConsumidos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-2 text-center">No hay repuestos registrados para este equipo.</p>
                ) : (
                  <div className="space-y-2">
                    {repuestosConsumidos.slice(0, 8).map((rc, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                          {rc.nombre}
                        </span>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                            {rc.veces} intervención(es)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatUnidadesRepuesto(rc.totalUnidades)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
