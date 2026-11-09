-- ============================================================
-- MaintAI · Migración y Actualización de Vistas (v2)
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- 1. Vista KPI Resumen adaptada al flujo de estados visible
-- Nota: En el nuevo flujo, 'confirmado' es el estado del reporte confirmado por el técnico
-- en Telegram que espera revisión del supervisor.
create or replace view public.v_kpi_resumen as
select
  count(*) filter (where estado in ('confirmado', 'revisado', 'rechazado', 'pendiente', 'corregido')) as total_reportes,
  count(*) filter (where estado = 'confirmado')                                                       as confirmados_por_revisar,
  count(*) filter (where estado = 'confirmado')                                                       as confirmados,
  count(*) filter (where estado = 'revisado')                                                         as revisados,
  count(*) filter (where estado = 'rechazado')                                                        as rechazados,
  count(*) filter (where estado in ('pendiente', 'corregido'))                                        as pendientes_historicos,
  count(*) filter (where estado in ('pendiente', 'corregido', 'confirmado'))                          as pendientes,
  round(100.0 * count(*) filter (where correcciones = 0 and estado in ('confirmado', 'revisado'))
        / nullif(count(*) filter (where estado in ('confirmado', 'revisado')), 0), 1) as pct_sin_correccion,
  round(avg(duracion_minutos) filter (where duracion_minutos is not null and duracion_minutos > 0)::numeric, 1) as duracion_promedio_min,
  round(avg(tiempo_procesamiento_ms) filter (where tiempo_procesamiento_ms is not null) / 1000.0, 1) as procesamiento_promedio_seg,
  round(avg(confianza) filter (where confianza is not null)::numeric, 2)                              as confianza_promedio
from public.reportes;

-- 2. Vista de Repuestos Más Utilizados
-- CORRECCIÓN CRÍTICA: No trata cantidades no informadas como 1 unidad.
-- Diferencia estrictamente la frecuencia de mención (veces) de las unidades informadas.
create or replace view public.v_repuestos_mas_usados as
select
  lower(trim(r->>'nombre')) as repuesto,
  sum(
    case
      when (r->>'cantidad') ~ '^\d+(\.\d+)?$' then (r->>'cantidad')::numeric
      else null
    end
  ) as unidades_informadas,
  sum(
    case
      when (r->>'cantidad') ~ '^\d+(\.\d+)?$' then (r->>'cantidad')::numeric
      else null
    end
  ) as unidades,
  count(*) as veces,
  count(*) filter (where r->>'cantidad' is null or trim(r->>'cantidad') = '') as veces_sin_cantidad
from public.reportes, jsonb_array_elements(repuestos) r
where r->>'nombre' is not null and trim(r->>'nombre') <> ''
group by 1
order by veces desc;

-- 3. Vista de Fallas por Equipo (incluye código, equipo y área)
create or replace view public.v_fallas_por_equipo as
select
  coalesce(nullif(trim(codigo_equipo), ''), trim(equipo), 'Sin equipo') as equipo,
  count(*) filter (where falla is not null or tipo_mantenimiento = 'correctivo') as total_fallas,
  round(avg(duracion_minutos) filter (where duracion_minutos is not null and duracion_minutos > 0)::numeric, 1) as duracion_promedio_min,
  max(created_at) as ultimo_reporte
from public.reportes
where falla is not null or tipo_mantenimiento = 'correctivo'
group by 1
order by total_fallas desc;

-- 4. Seguridad: Mantener security_invoker = true en todas las vistas
alter view public.v_kpi_resumen set (security_invoker = true);
alter view public.v_reportes_por_dia set (security_invoker = true);
alter view public.v_fallas_por_equipo set (security_invoker = true);
alter view public.v_repuestos_mas_usados set (security_invoker = true);
alter view public.v_reportes_por_tecnico set (security_invoker = true);

-- 5. Revisión y validación de RLS para lectura en reportes
-- La política de lectura autoriza a supervisores y administradores activos a leer reportes.
-- En el flujo principal, los estados visibles son 'confirmado', 'revisado' y 'rechazado'.
-- (Los estados 'borrador' y 'editando' en Telegram se mantienen fuera de la vista de supervisión).
