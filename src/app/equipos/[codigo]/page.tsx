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
import {
  formatReporteNumero,
  formatFechaHoraLima,
  formatMinutos,
} from '@/lib/utils';
import type { Reporte } from '@/types/database.types';
import {
  ArrowLeft,
  ExternalLink,
  Layers,
  Repeat,
  Package,
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching historial:', error);
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

  // Aggregate recurrent failures
  const recurrentFailures: { falla: string; count: number }[] = React.useMemo(() => {
    const map: Record<string, number> = {};
    reportes.forEach((r) => {
      if (r.falla) {
        const key = r.falla.trim().toLowerCase();
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([falla, count]) => ({ falla, count }))
      .sort((a, b) => b.count - a.count);
  }, [reportes]);

  // Aggregate replaced spare parts
  const repuestosConsumidos: { nombre: string; totalUnidades: number; veces: number }[] =
    React.useMemo(() => {
      const map: Record<string, { totalUnidades: number; veces: number }> = {};
      reportes.forEach((r) => {
        (r.repuestos || []).forEach((rep) => {
          if (rep.nombre) {
            const key = rep.nombre.trim().toLowerCase();
            const prev = map[key] || { totalUnidades: 0, veces: 0 };
            map[key] = {
              totalUnidades: prev.totalUnidades + (rep.cantidad || 1),
              veces: prev.veces + 1,
            };
          }
        });
      });
      return Object.entries(map)
        .map(([nombre, val]) => ({
          nombre,
          totalUnidades: val.totalUnidades,
          veces: val.veces,
        }))
        .sort((a, b) => b.totalUnidades - a.totalUnidades);
    }, [reportes]);

  const actions = (
    <Link href="/equipos" className="btn-lte-default text-xs">
      <ArrowLeft className="w-3.5 h-3.5" />
      <span>Volver a Equipos</span>
    </Link>
  );

  return (
    <div className="space-y-4">
      {/* Content Header AdminLTE */}
      <ContentHeader
        title={`Equipo: ${decodedCodigo}`}
        subtitle={`Línea de tiempo cronológica, recurrencia de averías y componentes (${reportes.length} intervenciones registradas).`}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Timeline of interventions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="lte-card border-t-[3px] border-t-[#007bff]">
              <div className="lte-card-header">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#007bff]" />
                  <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
                    Línea de Tiempo de Intervenciones
                  </span>
                </div>
                <span className="bg-[#007bff] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem]">
                  {reportes.length} Reportes
                </span>
              </div>

              <div className="lte-card-body">
                {reportes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#adb5bd]">
                    No hay reportes registrados para este equipo.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#dee2e6] dark:before:bg-[#4b545c]">
                    {reportes.map((r) => (
                      <div key={r.id} className="relative">
                        {/* Timeline node */}
                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#007bff] ring-4 ring-white dark:ring-[#343a40]" />

                        <div className="p-3 rounded-[0.25rem] bg-[#f8f9fa] dark:bg-[#2c3338] border border-[#dee2e6] dark:border-[#4b545c] space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-[#007bff]">
                                {formatReporteNumero(r.numero)}
                              </span>
                              <EstadoBadge estado={r.estado} />
                              <TipoBadge tipo={r.tipo_mantenimiento} />
                              <PrioridadBadge prioridad={r.prioridad} />
                            </div>
                            <span className="text-xs text-[#6c757d] dark:text-[#adb5bd]">
                              {formatFechaHoraLima(r.created_at)}
                            </span>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-[#212529] dark:text-[#f8f9fa]">
                              {r.falla || 'Intervención de mantenimiento'}
                            </p>
                            {r.causa_probable && (
                              <p className="text-[11px] text-[#6c757d] dark:text-[#adb5bd] mt-0.5">
                                <b>Causa:</b> {r.causa_probable}
                              </p>
                            )}
                          </div>

                          {/* Activities preview */}
                          {(r.actividades || []).length > 0 && (
                            <div className="text-[11px] text-[#495057] dark:text-[#ced4da] bg-white dark:bg-[#343a40] p-2 rounded-[0.25rem] border border-[#dee2e6] dark:border-[#4b545c] space-y-0.5">
                              {r.actividades.slice(0, 3).map((act, i) => (
                                <div key={i} className="flex items-start gap-1">
                                  <span className="text-[#007bff]">•</span>
                                  <span>{act}</span>
                                </div>
                              ))}
                              {r.actividades.length > 3 && (
                                <span className="text-[10px] text-[#adb5bd] italic">
                                  + {r.actividades.length - 3} actividades más
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1.5 border-t border-[#dee2e6] dark:border-[#4b545c] text-[11px]">
                            <span className="text-[#6c757d] dark:text-[#adb5bd]">
                              Técnico: <strong className="text-[#212529] dark:text-[#f8f9fa]">{r.tecnico_nombre || 'Desconocido'}</strong>
                              {r.duracion_minutos ? ` · ${formatMinutos(r.duracion_minutos)}` : ''}
                            </span>

                            <Link
                              href={`/reportes/${r.id}`}
                              className="btn-lte-primary text-xs px-2 py-0.5"
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
              </div>
            </div>
          </div>

          {/* Right Col: Recurrent Failures & Replaced Parts */}
          <div className="space-y-4">
            {/* Fallas recurrentes - Card Outline Warning */}
            <div className="lte-card border-t-[3px] border-t-[#ffc107]">
              <div className="lte-card-header">
                <div className="flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-[#ffc107]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#212529] dark:text-[#f8f9fa]">
                    Fallas Recurrentes
                  </span>
                </div>
              </div>

              <div className="lte-card-body p-2">
                {recurrentFailures.length === 0 ? (
                  <p className="text-xs text-[#adb5bd] italic p-2">No hay fallas registradas.</p>
                ) : (
                  <div className="space-y-1.5">
                    {recurrentFailures.slice(0, 8).map((rf, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-[0.25rem] bg-[#f8f9fa] dark:bg-[#2c3338] border border-[#dee2e6] dark:border-[#4b545c] flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-[#212529] dark:text-[#f8f9fa] capitalize truncate pr-2">
                          {rf.falla}
                        </span>
                        <span className="bg-[#ffc107] text-[#1f2d3d] text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem] shrink-0">
                          {rf.count} vez{rf.count === 1 ? '' : 'es'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Repuestos consumidos - Card Outline Info */}
            <div className="lte-card border-t-[3px] border-t-[#17a2b8]">
              <div className="lte-card-header">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#17a2b8]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#212529] dark:text-[#f8f9fa]">
                    Repuestos Consumidos
                  </span>
                </div>
              </div>

              <div className="lte-card-body p-2">
                {repuestosConsumidos.length === 0 ? (
                  <p className="text-xs text-[#adb5bd] italic p-2">Sin consumos de repuestos.</p>
                ) : (
                  <div className="space-y-1.5">
                    {repuestosConsumidos.slice(0, 8).map((rep, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-[0.25rem] bg-[#f8f9fa] dark:bg-[#2c3338] border border-[#dee2e6] dark:border-[#4b545c] flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-[#212529] dark:text-[#f8f9fa] capitalize truncate pr-2">
                          {rep.nombre}
                        </span>
                        <span className="text-[11px] font-bold text-[#17a2b8] shrink-0">
                          {rep.totalUnidades} un. ({rep.veces} veces)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
