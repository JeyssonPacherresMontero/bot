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

const COLORS_PIE = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'];
const PRIORIDAD_COLORS: Record<string, string> = {
  crítica: '#dc3545',
  critica: '#dc3545',
  alta: '#fd7e14',
  media: '#17a2b8',
  baja: '#6c757d',
};

const ESTADO_COLORS: Record<string, string> = {
  pendiente: '#ffc107',
  corregido: '#fd7e14',
  confirmado: '#007bff',
  revisado: '#28a745',
  rechazado: '#dc3545',
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
        <div className="h-72 bg-[#e9ecef] dark:bg-[#343a40] rounded-[0.25rem] animate-pulse" />
        <div className="h-72 bg-[#e9ecef] dark:bg-[#343a40] rounded-[0.25rem] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Reportes por día y Fallas por Equipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reportes por día - Card Outline Primary */}
        <div className="lte-card border-t-[3px] border-t-[#007bff]">
          <div className="lte-card-header">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#007bff]" />
              <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
                Tendencia de Reportes por Día
              </span>
            </div>
            <span className="text-[11px] font-semibold bg-[#007bff]/10 text-[#007bff] dark:bg-[#007bff]/20 dark:text-[#66b0ff] px-2 py-0.5 rounded-[0.2rem]">
              Volumen Diario
            </span>
          </div>
          <div className="lte-card-body">
            <div className="h-64 w-full">
              {reportesPorDia.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportesPorDia}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
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
                        backgroundColor: '#343a40',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        border: '1px solid #4b545c',
                      }}
                      formatter={(value) => [`${value} reportes`, 'Total']}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Bar dataKey="total" fill="#007bff" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#adb5bd]">
                  No hay datos para este período
                </div>
              )}
            </div>
          </div>
          <div className="lte-card-footer">
            Volumen generado por el bot de Telegram en los últimos días
          </div>
        </div>

        {/* Fallas por Equipo - Card Outline Info */}
        <div className="lte-card border-t-[3px] border-t-[#17a2b8]">
          <div className="lte-card-header">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#17a2b8]" />
              <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
                Top 10 Fallas por Equipo
              </span>
            </div>
            <span className="text-[11px] font-semibold bg-[#17a2b8]/10 text-[#17a2b8] dark:bg-[#17a2b8]/20 dark:text-[#38d4eb] px-2 py-0.5 rounded-[0.2rem]">
              Incidencias
            </span>
          </div>
          <div className="lte-card-body">
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
                        backgroundColor: '#343a40',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        border: '1px solid #4b545c',
                      }}
                      formatter={(value) => [`${value} fallas`, 'Incidencias']}
                    />
                    <Bar dataKey="total_fallas" fill="#17a2b8" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#adb5bd]">
                  Sin fallas registradas
                </div>
              )}
            </div>
          </div>
          <div className="lte-card-footer">
            Equipos con mayor frecuencia de reportes correctivos y preventivos
          </div>
        </div>
      </div>

      {/* Row 2: Repuestos y Productividad Técnicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Repuestos más usados - Card Outline Warning */}
        <div className="lte-card border-t-[3px] border-t-[#ffc107]">
          <div className="lte-card-header">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#ffc107]" />
              <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
                Top 10 Repuestos más Consumidos
              </span>
            </div>
            <span className="text-[11px] font-semibold bg-[#ffc107]/20 text-[#856404] dark:text-[#ffc107] px-2 py-0.5 rounded-[0.2rem]">
              Materiales
            </span>
          </div>
          <div className="lte-card-body">
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
                        backgroundColor: '#343a40',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        border: '1px solid #4b545c',
                      }}
                      formatter={(value) => [`${value} unidades`, 'Total consumido']}
                    />
                    <Bar dataKey="unidades" fill="#ffc107" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#adb5bd]">
                  Sin repuestos registrados en este período
                </div>
              )}
            </div>
          </div>
          <div className="lte-card-footer">
            Consumo total de repuestos y materiales extraído por IA
          </div>
        </div>

        {/* Reportes por técnico - Card Outline Purple */}
        <div className="lte-card border-t-[3px] border-t-[#6f42c1]">
          <div className="lte-card-header">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#6f42c1]" />
              <span className="text-sm font-bold text-[#212529] dark:text-[#f8f9fa]">
                Reportes por Técnico (Productividad)
              </span>
            </div>
            <span className="text-[11px] font-semibold bg-[#6f42c1]/10 text-[#6f42c1] dark:bg-[#6f42c1]/20 dark:text-[#a370f7] px-2 py-0.5 rounded-[0.2rem]">
              Equipo Humano
            </span>
          </div>
          <div className="lte-card-body">
            <div className="h-64 w-full">
              {reportesPorTecnico.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportesPorTecnico.slice(0, 8)}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="tecnico" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#343a40',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        border: '1px solid #4b545c',
                      }}
                      formatter={(value) => [`${value} reportes`, 'Total']}
                    />
                    <Bar dataKey="total" fill="#6f42c1" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#adb5bd]">
                  Sin registros de técnicos
                </div>
              )}
            </div>
          </div>
          <div className="lte-card-footer">
            Cantidad de órdenes de trabajo enviadas por cada técnico
          </div>
        </div>
      </div>

      {/* Row 3: Distribuciones circulares */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tipo de Mantenimiento */}
        <div className="lte-card border-t-[3px] border-t-[#28a745]">
          <div className="lte-card-header">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#212529] dark:text-[#f8f9fa]">
              <PieIcon className="w-3.5 h-3.5 text-[#28a745]" />
              <span>Tipo de Mantenimiento</span>
            </div>
          </div>
          <div className="lte-card-body">
            <div className="h-44 w-full">
              {distribucionTipo.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionTipo}
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distribucionTipo.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#343a40',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        border: '1px solid #4b545c',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#adb5bd]">
                  Sin datos
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center text-[10px] text-[#6c757d] dark:text-[#ced4da] mt-2">
              {distribucionTipo.map((d, i) => (
                <span
                  key={d.name}
                  className="inline-flex items-center gap-1 bg-[#f4f6f9] dark:bg-[#3f474e] px-1.5 py-0.5 rounded-[0.2rem]"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS_PIE[i % COLORS_PIE.length] }}
                  />
                  <span className="capitalize">{d.name}: <b>{d.value}</b></span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Prioridad */}
        <div className="lte-card border-t-[3px] border-t-[#dc3545]">
          <div className="lte-card-header">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#212529] dark:text-[#f8f9fa]">
              <PieIcon className="w-3.5 h-3.5 text-[#dc3545]" />
              <span>Criticidad / Prioridad</span>
            </div>
          </div>
          <div className="lte-card-body">
            <div className="h-44 w-full">
              {distribucionPrioridad.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionPrioridad}
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distribucionPrioridad.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={PRIORIDAD_COLORS[entry.name.toLowerCase()] || '#6c757d'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#343a40',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        border: '1px solid #4b545c',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#adb5bd]">
                  Sin datos
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center text-[10px] text-[#6c757d] dark:text-[#ced4da] mt-2">
              {distribucionPrioridad.map((d) => (
                <span
                  key={d.name}
                  className="inline-flex items-center gap-1 bg-[#f4f6f9] dark:bg-[#3f474e] px-1.5 py-0.5 rounded-[0.2rem]"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PRIORIDAD_COLORS[d.name.toLowerCase()] || '#6c757d' }}
                  />
                  <span className="capitalize">{d.name}: <b>{d.value}</b></span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Flujo de Estados */}
        <div className="lte-card border-t-[3px] border-t-[#007bff]">
          <div className="lte-card-header">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#212529] dark:text-[#f8f9fa]">
              <PieIcon className="w-3.5 h-3.5 text-[#007bff]" />
              <span>Flujo de Estados</span>
            </div>
          </div>
          <div className="lte-card-body">
            <div className="h-44 w-full">
              {distribucionEstado.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionEstado}
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distribucionEstado.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={ESTADO_COLORS[entry.name.toLowerCase()] || '#6c757d'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#343a40',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        border: '1px solid #4b545c',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#adb5bd]">
                  Sin datos
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center text-[10px] text-[#6c757d] dark:text-[#ced4da] mt-2">
              {distribucionEstado.map((d) => (
                <span
                  key={d.name}
                  className="inline-flex items-center gap-1 bg-[#f4f6f9] dark:bg-[#3f474e] px-1.5 py-0.5 rounded-[0.2rem]"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ESTADO_COLORS[d.name.toLowerCase()] || '#6c757d' }}
                  />
                  <span className="capitalize">{d.name}: <b>{d.value}</b></span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
