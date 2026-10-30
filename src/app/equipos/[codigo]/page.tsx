'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { EstadoBadge } from '@/components/badges/EstadoBadge';
import { PrioridadBadge } from '@/components/badges/PrioridadBadge';
import { TipoBadge } from '@/components/badges/TipoBadge';
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
      // Find reports where equipo == decodedCodigo OR codigo_equipo == decodedCodigo
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

  // Aggregate recurrent failures (grouped by lowercase trim)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/equipos"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Volver a lista de equipos"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {decodedCodigo}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {reportes.length} Intervención{reportes.length === 1 ? '' : 'es'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Línea de tiempo cronológica, recurrencia de anomalías y componentes reemplazados.
          </p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline of interventions */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Línea de Tiempo de Intervenciones
            </h2>

            {reportes.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                No hay reportes registrados para este equipo.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {reportes.map((r) => (
                  <div key={r.id} className="relative group">
                    {/* Timeline Node dot */}
                    <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-950" />

                    {/* Card */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                            {formatReporteNumero(r.numero)}
                          </span>
                          <EstadoBadge estado={r.estado} />
                          <TipoBadge tipo={r.tipo_mantenimiento} />
                          <PrioridadBadge prioridad={r.prioridad} />
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatFechaHoraLima(r.created_at)}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {r.falla || 'Intervención de mantenimiento'}
                        </p>
                        {r.causa_probable && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Causa: {r.causa_probable}
                          </p>
                        )}
                      </div>

                      {/* Activities preview */}
                      {(r.actividades || []).length > 0 && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg space-y-0.5">
                          {r.actividades.slice(0, 3).map((act, i) => (
                            <div key={i} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{act}</span>
                            </div>
                          ))}
                          {r.actividades.length > 3 && (
                            <span className="text-[10px] text-slate-400 italic">
                              + {r.actividades.length - 3} actividades más
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <span className="text-slate-500">
                          Técnico: <strong className="text-slate-700 dark:text-slate-300">{r.tecnico_nombre || 'Desconocido'}</strong>
                          {r.duracion_minutos ? ` · ${formatMinutos(r.duracion_minutos)}` : ''}
                        </span>

                        <Link
                          href={`/reportes/${r.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:underline"
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

          {/* Right Col: Recurrent Failures & Replaced Parts */}
          <div className="space-y-6">
            {/* Fallas recurrentes */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-amber-500" />
                Fallas Recurrentes
              </h3>
              {recurrentFailures.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay fallas registradas.</p>
              ) : (
                <div className="space-y-2">
                  {recurrentFailures.slice(0, 8).map((rf, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 capitalize truncate pr-2">
                        {rf.falla}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                        {rf.count} vez{rf.count === 1 ? '' : 'es'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Repuestos reemplazados */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-500" />
                Repuestos Consumidos
              </h3>
              {repuestosConsumidos.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Sin consumos de repuestos.</p>
              ) : (
                <div className="space-y-2">
                  {repuestosConsumidos.slice(0, 8).map((rep, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 capitalize truncate pr-2">
                        {rep.nombre}
                      </span>
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                        {rep.totalUnidades} un. ({rep.veces} veces)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
