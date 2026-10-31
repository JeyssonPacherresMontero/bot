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
import { BarChart3, Wrench, Package, Users, PieChart as PieIcon } from 'lucide-react';

interface DashboardChartsProps {
  reportesPorDia: VReportesPorDia[];
  fallasPorEquipo: VFallasPorEquipo[];
  repuestosMasUsados: VRepuestosMasUsados[];
  reportesPorTecnico: VReportesPorTecnico[];
  distribucionTipo: { name: string; value: number }[];
  distribucionPrioridad: { name: string; value: number }[];
  distribucionEstado: { name: string; value: number }[];
}

// Low visual fatigue color psychology palette
const COLORS_PIE = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6'];

const PRIORIDAD_COLORS: Record<string, string> = {
  crítica: '#f43f5e',
  critica: '#f43f5e',
  alta: '#f97316',
  media: '#3b82f6',
  baja: '#64748b',
};

const ESTADO_COLORS: Record<string, string> = {
  pendiente: '#f59e0b',
  corregido: '#f97316',
  confirmado: '#3b82f6',
  revisado: '#10b981',
  rechazado: '#f43f5e',
};

const tooltipStyle = {
  backgroundColor: '#0f172a',
  borderRadius: '8px',
  color: '#f8fafc',
  fontSize: '12px',
  border: '1px solid #1e293b',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
        <div className="h-72 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
        <div className="h-72 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Reportes por día y Fallas por Equipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reportes por día */}
        <div className="modern-card">
          <div className="modern-card-header">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                Tendencia de Reportes por Día
              </span>
            </div>
            <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
              Volumen Diario
            </span>
          </div>
          <div className="modern-card-body">
            <div className="h-64 w-full">
              {reportesPorDia.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportesPorDia}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`${value} reportes`, 'Total']}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No hay datos para este período
                </div>
              )}
            </div>
          </div>
          <div className="modern-card-footer">
            Volumen generado por el bot de Telegram en los últimos días
          </div>
        </div>

        {/* Fallas por Equipo */}
        <div className="modern-card">
          <div className="modern-card-header">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                Top 10 Fallas por Equipo
              </span>
            </div>
            <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
              Incidencias
            </span>
          </div>
          <div className="modern-card-body">
            <div className="h-64 w-full">
              {fallasPorEquipo.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fallasPorEquipo.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <YAxis
                      dataKey="equipo"
                      type="category"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`${value} fallas`, 'Incidencias']}
                    />
                    <Bar dataKey="total_fallas" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Sin fallas registradas
                </div>
              )}
            </div>
          </div>
          <div className="modern-card-footer">
            Equipos con mayor frecuencia de reportes correctivos y preventivos
          </div>
        </div>
      </div>

      {/* Row 2: Repuestos y Productividad Técnicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Repuestos más usados */}
        <div className="modern-card">
          <div className="modern-card-header">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Package className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                Top 10 Repuestos más Consumidos
              </span>
            </div>
            <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
              Materiales
            </span>
          </div>
          <div className="modern-card-body">
            <div className="h-64 w-full">
              {repuestosMasUsados.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={repuestosMasUsados.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <YAxis
                      dataKey="repuesto"
                      type="category"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
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
          <div className="modern-card-footer">
            Consumo total de repuestos y materiales extraído por IA
          </div>
        </div>

        {/* Productividad por Técnico - removed parenthesis */}
        <div className="modern-card">
          <div className="modern-card-header">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                Productividad por Técnico
              </span>
            </div>
            <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
              Equipo Técnico
            </span>
          </div>
          <div className="modern-card-body">
            <div className="h-64 w-full">
              {reportesPorTecnico.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportesPorTecnico.slice(0, 8)}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                    <XAxis dataKey="tecnico" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`${value} reportes`, 'Total']}
                    />
                    <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Sin registros de técnicos
                </div>
              )}
            </div>
          </div>
          <div className="modern-card-footer">
            Cantidad de órdenes de trabajo enviadas por cada técnico
          </div>
        </div>
      </div>

      {/* Row 3: Distribuciones circulares */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tipo de Mantenimiento */}
        <div className="modern-card">
          <div className="modern-card-header">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <PieIcon className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                Tipo de Mantenimiento
              </span>
            </div>
          </div>
          <div className="modern-card-body">
            <div className="h-44 w-full">
              {distribucionTipo.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionTipo}
                      innerRadius={42}
                      outerRadius={64}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distribucionTipo.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Sin datos
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center text-[10px] text-slate-500 dark:text-slate-400 mt-2">
              {distribucionTipo.map((d, i) => (
                <span
                  key={d.name}
                  className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 px-2 py-0.5 rounded-md"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: COLORS_PIE[i % COLORS_PIE.length] }}
                  />
                  <span className="capitalize">{d.name}: <strong className="text-slate-700 dark:text-slate-300">{d.value}</strong></span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Prioridad - removed slash */}
        <div className="modern-card">
          <div className="modern-card-header">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <PieIcon className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                Distribución por Prioridad
              </span>
            </div>
          </div>
          <div className="modern-card-body">
            <div className="h-44 w-full">
              {distribucionPrioridad.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionPrioridad}
                      innerRadius={42}
                      outerRadius={64}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distribucionPrioridad.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={PRIORIDAD_COLORS[entry.name.toLowerCase()] || '#64748b'}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Sin datos
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center text-[10px] text-slate-500 dark:text-slate-400 mt-2">
              {distribucionPrioridad.map((d) => (
                <span
                  key={d.name}
                  className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 px-2 py-0.5 rounded-md"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: PRIORIDAD_COLORS[d.name.toLowerCase()] || '#64748b' }}
                  />
                  <span className="capitalize">{d.name}: <strong className="text-slate-700 dark:text-slate-300">{d.value}</strong></span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Flujo de Estados */}
        <div className="modern-card">
          <div className="modern-card-header">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <PieIcon className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                Flujo de Estados
              </span>
            </div>
          </div>
          <div className="modern-card-body">
            <div className="h-44 w-full">
              {distribucionEstado.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionEstado}
                      innerRadius={42}
                      outerRadius={64}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distribucionEstado.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={ESTADO_COLORS[entry.name.toLowerCase()] || '#64748b'}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Sin datos
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center text-[10px] text-slate-500 dark:text-slate-400 mt-2">
              {distribucionEstado.map((d) => (
                <span
                  key={d.name}
                  className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 px-2 py-0.5 rounded-md"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: ESTADO_COLORS[d.name.toLowerCase()] || '#64748b' }}
                  />
                  <span className="capitalize">{d.name}: <strong className="text-slate-700 dark:text-slate-300">{d.value}</strong></span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
