-- ============================================================
-- MaintAI · Esquema de Supabase (PostgreSQL)
-- Ejecutar completo en: Supabase > SQL Editor
-- n8n escribe con la SERVICE ROLE KEY (se salta RLS).
-- El panel usa la ANON KEY + login (aplica RLS).
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Perfiles del panel (supervisores / admins) ----------
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null default 'supervisor' check (rol in ('supervisor', 'admin')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Técnicos autorizados en Telegram (lista blanca opcional) ----------
create table if not exists public.usuarios_telegram (
  chat_id bigint primary key,
  nombre text not null,
  cargo text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Reportes de mantenimiento ----------
create table if not exists public.reportes (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity,          -- se muestra como REP-0001
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- origen (Telegram)
  telegram_chat_id bigint,
  telegram_message_id bigint,
  tecnico_nombre text,
  tecnico_username text,
  origen text check (origen in ('audio', 'texto')),
  audio_duracion_seg int,
  texto_original text,                                  -- transcripción o texto enviado
  texto_correccion text,                                -- última corrección del técnico

  -- campos extraídos por la IA
  equipo text,
  codigo_equipo text,
  area text,
  tipo_mantenimiento text check (tipo_mantenimiento in ('preventivo', 'correctivo', 'predictivo', 'inspeccion', 'otro')),
  falla text,
  causa_probable text,
  actividades text[] not null default '{}',
  repuestos jsonb not null default '[]',                -- [{nombre, cantidad, codigo}]
  prioridad text check (prioridad in ('baja', 'media', 'alta', 'critica')),
  numero_ot text,
  fecha_intervencion date,
  duracion_minutos int,                                 -- tiempo de atención
  observaciones text,
  campos_faltantes text[] not null default '{}',
  confianza numeric(3, 2),
  raw_ia jsonb,
  tiempo_procesamiento_ms int,

  -- flujo de estados
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'corregido', 'confirmado', 'revisado', 'rechazado')),
  correcciones int not null default 0,
  comentario_supervisor text,
  revisado_por uuid references public.perfiles(id),
  revisado_en timestamptz
);

create index if not exists reportes_created_idx on public.reportes (created_at desc);
create index if not exists reportes_estado_idx on public.reportes (estado);
create index if not exists reportes_equipo_idx on public.reportes (lower(equipo));
create index if not exists reportes_chat_idx on public.reportes (telegram_chat_id);

-- updated_at automático
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_reportes_updated on public.reportes;
create trigger trg_reportes_updated before update on public.reportes
for each row execute function public.set_updated_at();

-- ---------- Vistas para el dashboard (RF-07) ----------
create or replace view public.v_kpi_resumen as
select
  count(*)                                                        as total_reportes,
  count(*) filter (where estado in ('confirmado', 'revisado'))    as confirmados,
  count(*) filter (where estado = 'pendiente')                    as pendientes,
  count(*) filter (where estado = 'rechazado')                    as rechazados,
  round(100.0 * count(*) filter (where correcciones = 0 and estado in ('confirmado', 'revisado'))
        / nullif(count(*) filter (where estado in ('confirmado', 'revisado')), 0), 1) as pct_sin_correccion,
  round(avg(duracion_minutos)::numeric, 1)                        as duracion_promedio_min,
  round(avg(tiempo_procesamiento_ms) / 1000.0, 1)                 as procesamiento_promedio_seg,
  round(avg(confianza)::numeric, 2)                               as confianza_promedio
from public.reportes;

create or replace view public.v_reportes_por_dia as
select (created_at at time zone 'America/Lima')::date as dia, count(*) as total
from public.reportes group by 1 order by 1;

create or replace view public.v_fallas_por_equipo as
select coalesce(nullif(codigo_equipo, ''), equipo, 'Sin equipo') as equipo,
       count(*) as total_fallas,
       round(avg(duracion_minutos)::numeric, 1) as duracion_promedio_min,
       max(created_at) as ultimo_reporte
from public.reportes
where falla is not null
group by 1 order by total_fallas desc;

create or replace view public.v_repuestos_mas_usados as
select lower(r->>'nombre') as repuesto,
       sum(coalesce((r->>'cantidad')::numeric, 1)) as unidades,
       count(*) as veces
from public.reportes, jsonb_array_elements(repuestos) r
where r->>'nombre' is not null
group by 1 order by unidades desc;

create or replace view public.v_reportes_por_tecnico as
select coalesce(tecnico_nombre, 'Sin nombre') as tecnico, count(*) as total,
       round(avg(duracion_minutos)::numeric, 1) as duracion_promedio_min
from public.reportes group by 1 order by total desc;

alter view public.v_kpi_resumen set (security_invoker = true);
alter view public.v_reportes_por_dia set (security_invoker = true);
alter view public.v_fallas_por_equipo set (security_invoker = true);
alter view public.v_repuestos_mas_usados set (security_invoker = true);
alter view public.v_reportes_por_tecnico set (security_invoker = true);

-- ---------- Seguridad (RLS) ----------
create or replace function public.rol_actual() returns text
language sql stable security definer set search_path = public as $$
  select rol from public.perfiles where id = auth.uid() and activo
$$;

alter table public.perfiles enable row level security;
alter table public.usuarios_telegram enable row level security;
alter table public.reportes enable row level security;

-- perfiles
create policy perfiles_ver_propio on public.perfiles for select using (id = auth.uid() or public.rol_actual() = 'admin');
create policy perfiles_admin on public.perfiles for all using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');

-- usuarios de Telegram: solo admin
create policy tg_admin on public.usuarios_telegram for all using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');

-- reportes: supervisores y admins leen y actualizan; solo admin borra. Inserta n8n (service role).
create policy reportes_leer on public.reportes for select using (public.rol_actual() in ('supervisor', 'admin'));
create policy reportes_actualizar on public.reportes for update using (public.rol_actual() in ('supervisor', 'admin')) with check (public.rol_actual() in ('supervisor', 'admin'));
create policy reportes_borrar on public.reportes for delete using (public.rol_actual() = 'admin');

-- Realtime para el panel
alter publication supabase_realtime add table public.reportes;

-- ---------- Primer admin ----------
-- 1) Crea el usuario en Authentication > Users.
-- 2) Ejecuta (cambia el correo y el nombre):
-- insert into public.perfiles (id, nombre, rol)
-- select id, 'Administrador', 'admin' from auth.users where email = 'tu-correo@dominio.com';

-- ---------- Aviso a Telegram cuando el supervisor valida o rechaza ----------
-- En Supabase > Database > Webhooks > Create:
--   Tabla: reportes · Evento: Update · Tipo: HTTP Request (POST)
--   URL: la "Production URL" del nodo "Webhook Panel" de n8n
--   Header: x-webhook-secret = (el mismo valor de webhook_secret en el nodo Config)
