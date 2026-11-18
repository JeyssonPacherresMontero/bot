-- ============================================================
-- MaintAI · Migración y Adaptación Integral al Formato Físico (v4)
-- Ejecutar en: Supabase > SQL Editor
-- Totalmente compatible con registros históricos existentes
-- ============================================================

-- 1. Campos de identificación, unidad y puesto de trabajo
alter table public.reportes 
  add column if not exists unidad text,
  add column if not exists ow_os text,
  add column if not exists puesto_trabajo text,
  add column if not exists titulo_trabajo text;

-- 2. Horarios y tiempos detallados (si no fueron creados en v3)
alter table public.reportes
  add column if not exists fecha_inicio date,
  add column if not exists hora_inicio time,
  add column if not exists fecha_fin date,
  add column if not exists hora_fin time,
  add column if not exists total_horas_hombre numeric(6, 2);

-- 3. Tipo de notificación ('parcial' | 'final')
alter table public.reportes
  add column if not exists tipo_notificacion text check (tipo_notificacion in ('parcial', 'final'));

-- 4. Ampliar restricción de tipos de mantenimiento (incluyendo 'mejora')
alter table public.reportes
  drop constraint if exists reportes_tipo_mantenimiento_check;

alter table public.reportes
  add constraint reportes_tipo_mantenimiento_check
  check (tipo_mantenimiento in ('preventivo', 'correctivo', 'predictivo', 'mejora', 'inspeccion', 'otro'));

-- 5. Personal y supervisión del trabajo
alter table public.reportes
  add column if not exists supervisor_operaciones text,
  add column if not exists responsable_ejecucion text,
  add column if not exists responsables_ejecutantes jsonb not null default '[]',
  add column if not exists responsable_trabajo_nombre text,
  add column if not exists responsable_trabajo_telefono text;

-- 6. Herramientas usadas (con procedencia GMO / EXT)
-- Estructura: [{ "nombre": "FLUKE 754", "modelo": "754", "procedencia": "GMO" | "EXT" }]
alter table public.reportes
  add column if not exists herramientas jsonb not null default '[]';

-- 7. Materiales y consumibles (diferenciados de repuestos capitalizables)
-- Estructura: [{ "nombre": "FUSIBLE", "cantidad": 2, "unidad": "piezas", "codigo": "10A", "procedencia": "GMO" | "EXT" }]
alter table public.reportes
  add column if not exists materiales_consumibles jsonb not null default '[]';

-- 8. Observaciones y requerimiento de aviso en SAP/GMAO
alter table public.reportes
  add column if not exists requiere_aviso boolean not null default false;

-- 9. Índices para agilizar búsquedas en el panel
create index if not exists reportes_numero_ot_idx on public.reportes (numero_ot);
create index if not exists reportes_unidad_idx on public.reportes (unidad);
create index if not exists reportes_puesto_idx on public.reportes (puesto_trabajo);

-- 10. Actualización retrocompatible de registros históricos
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

-- 11. Actualizar vista KPI resumen para contemplar el flujo completo
create or replace view public.v_kpi_resumen as
select
  count(*) filter (where estado in ('confirmado', 'revisado', 'rechazado'))                           as total_reportes,
  count(*) filter (where estado = 'confirmado')                                                       as confirmados_por_revisar,
  count(*) filter (where estado = 'confirmado')                                                       as confirmados,
  count(*) filter (where estado = 'revisado')                                                         as revisados,
  count(*) filter (where estado = 'rechazado')                                                        as rechazados,
  count(*) filter (where estado in ('borrador', 'editando', 'corregido', 'pendiente'))                as borradores_activos,
  round(100.0 * count(*) filter (where correcciones = 0 and estado in ('confirmado', 'revisado'))
        / nullif(count(*) filter (where estado in ('confirmado', 'revisado')), 0), 1) as pct_sin_correccion,
  round(avg(duracion_minutos) filter (where duracion_minutos is not null and duracion_minutos > 0)::numeric, 1) as duracion_promedio_min,
  round(avg(tiempo_procesamiento_ms) filter (where tiempo_procesamiento_ms is not null) / 1000.0, 1) as procesamiento_promedio_seg,
  round(avg(confianza) filter (where confianza is not null)::numeric, 2)                              as confianza_promedio
from public.reportes;

alter view public.v_kpi_resumen set (security_invoker = true);
