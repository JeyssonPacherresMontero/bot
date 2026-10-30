'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import type {
  VReportesPorDia,
  VFallasPorEquipo,
  VRepuestosMasUsados,
  VReportesPorTecnico,
} from '@/types/database.types';

interface DashboardChartsProps {
  reportesPorDia: VReportesPorDia[];
  fallasPorEquipo: VFallasPorEquipo[];
  repuestosMasUsados: VRepuestosMasUsados[];
  reportesPorTecnico: VReportesPorTecnico[];
  distribucionTipo: { name: string; value: number }[];
  distribucionPrioridad: { name: string; value: number }[];
  distribucionEstado: { name: string; value: number }[];
}

const COLORS_PIE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const PRIORIDAD_COLORS: Record<string, string> = {
  crítica: '#ef4444',
  critica: '#ef4444',
  alta: '#f59e0b',
  media: '#3b82f6',
  baja: '#64748b',
};

const ESTADO_COLORS: Record<string, string> = {
  pendiente: '#f59e0b',
  corregido: '#f97316',
  confirmado: '#3b82f6',
  revisado: '#10b981',
  rechazado: '#ef4444',
};

export function DashboardCharts({
  reportesPorDia,
  fallasPorEquipo,
  repuestosMasUsados,
  reportesPorTecnico,
  distribucionTipo,
  distribucionPrioridad,
  distribucionEstado,
}: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
        <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico 1: Reportes por día y Fallas por Equipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reportes por día */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Tendencia de Reportes por Día
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Volumen diario generado desde Telegram
          </p>
          <div className="h-64 w-full">
            {reportesPorDia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportesPorDia} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 11 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(value) => [`${value} reportes`, 'Total']}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No hay datos para este período
              </div>
            )}
          </div>
        </div>

        {/* Fallas por Equipo (Top 10 Horizontal) */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Top 10 Fallas por Equipo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Equipos con mayor frecuencia de incidencias
          </p>
          <div className="h-64 w-full">
            {fallasPorEquipo.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={fallasPorEquipo.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    dataKey="equipo"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(value) => [`${value} fallas`, 'Incidencias']}
                  />
                  <Bar dataKey="total_fallas" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Sin fallas registradas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico 2: Repuestos Más Usados y Reportes por Técnico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repuestos más usados */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Top 10 Repuestos más Consumidos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Unidades empleadas en intervenciones
          </p>
          <div className="h-64 w-full">
            {repuestosMasUsados.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={repuestosMasUsados.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    dataKey="repuesto"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(value) => [`${value} unidades`, 'Total consumido']}
                  />
                  <Bar dataKey="unidades" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Sin repuestos registrados en este período
              </div>
            )}
          </div>
        </div>

        {/* Reportes por técnico */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Reportes por Técnico
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Productividad de registro del equipo de mantenimiento
          </p>
          <div className="h-64 w-full">
            {reportesPorTecnico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportesPorTecnico.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="tecnico" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(value) => [`${value} reportes`, 'Total']}
                  />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Sin registros de técnicos
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico 3: Distribuciones (Tipo, Prioridad, Estado) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Distribución por Tipo de Mantenimiento */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Tipo de Mantenimiento
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Proporción de intervenciones
          </p>
          <div className="h-48 w-full">
            {distribucionTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucionTipo}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {distribucionTipo.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Sin datos
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center text-[11px] text-slate-600 dark:text-slate-400">
            {distribucionTipo.map((d, i) => (
              <span key={d.name} className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_PIE[i % COLORS_PIE.length] }} />
                <span className="capitalize">{d.name} ({d.value})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Distribución por Prioridad */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Prioridad de Reportes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Nivel de criticidad operativa
          </p>
          <div className="h-48 w-full">
            {distribucionPrioridad.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucionPrioridad}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {distribucionPrioridad.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={PRIORIDAD_COLORS[entry.name.toLowerCase()] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Sin datos
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center text-[11px] text-slate-600 dark:text-slate-400">
            {distribucionPrioridad.map((d) => (
              <span key={d.name} className="inline-flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PRIORIDAD_COLORS[d.name.toLowerCase()] || '#94a3b8' }}
                />
                <span className="capitalize">{d.name} ({d.value})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Distribución por Estado */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            Flujo de Estados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Estado actual en el ciclo de revisión
          </p>
          <div className="h-48 w-full">
            {distribucionEstado.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucionEstado}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {distribucionEstado.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={ESTADO_COLORS[entry.name.toLowerCase()] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Sin datos
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center text-[11px] text-slate-600 dark:text-slate-400">
            {distribucionEstado.map((d) => (
              <span key={d.name} className="inline-flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: ESTADO_COLORS[d.name.toLowerCase()] || '#94a3b8' }}
                />
                <span className="capitalize">{d.name} ({d.value})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
