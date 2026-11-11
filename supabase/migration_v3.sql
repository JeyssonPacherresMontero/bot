-- ============================================================
-- MaintAI · Migración y Adaptación al Formato Físico (v3)
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- 1. Agregar campo de tipo de notificación ('parcial' | 'final')
alter table public.reportes 
  add column if not exists tipo_notificacion text check (tipo_notificacion in ('parcial', 'final'));

-- 2. Actualizar tipos de mantenimiento para incluir 'mejora'
alter table public.reportes
  drop constraint if exists reportes_tipo_mantenimiento_check;

alter table public.reportes
  add constraint reportes_tipo_mantenimiento_check
  check (tipo_mantenimiento in ('preventivo', 'correctivo', 'predictivo', 'mejora', 'inspeccion', 'otro'));

-- 3. Fechas y horas de inicio y término (obligatorias para el trabajo físico)
alter table public.reportes
  add column if not exists fecha_inicio date,
  add column if not exists hora_inicio time,
  add column if not exists fecha_fin date,
  add column if not exists hora_fin time;

-- 4. Soporte para múltiples ejecutantes (técnicos TEC y ayudantes AYD)
-- Formato JSONB: [{ "nombre": "...", "rol": "TEC" | "AYD" }]
alter table public.reportes
  add column if not exists responsables_ejecutantes jsonb not null default '[]';

-- 5. Poblar datos existentes para retrocompatibilidad
update public.reportes
set 
  fecha_inicio = coalesce(fecha_inicio, fecha_intervencion),
  fecha_fin = coalesce(fecha_fin, fecha_intervencion)
where fecha_inicio is null and fecha_intervencion is not null;

update public.reportes
set responsables_ejecutantes = jsonb_build_array(
  jsonb_build_object('nombre', tecnico_nombre, 'rol', 'TEC')
)
where (responsables_ejecutantes is null or jsonb_array_length(responsables_ejecutantes) = 0)
  and tecnico_nombre is not null and trim(tecnico_nombre) <> '';

