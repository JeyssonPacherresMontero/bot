-- ============================================================
-- MaintAI · Migración v5: Cálculo Automático de Horas-Hombre (H-H)
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- 1. Función para calcular automáticamente horas-hombre antes de guardar
create or replace function public.fn_auto_calcular_horas_hombre()
returns trigger as $$
declare
  num_ejecutantes int := 1;
begin
  -- Solo calcular si hay duración en minutos positiva
  if NEW.duracion_minutos is not null and NEW.duracion_minutos > 0 then
    -- Determinar cantidad de ejecutantes desde el jsonb si existe
    if NEW.responsables_ejecutantes is not null 
       and jsonb_typeof(NEW.responsables_ejecutantes) = 'array' 
       and jsonb_array_length(NEW.responsables_ejecutantes) > 0 then
      num_ejecutantes := greatest(1, jsonb_array_length(NEW.responsables_ejecutantes));
    end if;

    -- Si total_horas_hombre no fue provisto manualmente o es 0, calcularlo automáticamente
    if NEW.total_horas_hombre is null or NEW.total_horas_hombre = 0 then
      NEW.total_horas_hombre := round((NEW.duracion_minutos / 60.0) * num_ejecutantes, 2);
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql;

-- 2. Trigger para aplicar el cálculo en inserciones y actualizaciones
drop trigger if exists trg_auto_calcular_horas_hombre on public.reportes;

create trigger trg_auto_calcular_horas_hombre
before insert or update of duracion_minutos, responsables_ejecutantes, total_horas_hombre
on public.reportes
for each row
execute function public.fn_auto_calcular_horas_hombre();

-- 3. Actualización retroactiva de todos los reportes históricos existentes
update public.reportes
set total_horas_hombre = round(
  (duracion_minutos / 60.0) * greatest(
    1,
    case 
      when jsonb_typeof(responsables_ejecutantes) = 'array' and jsonb_array_length(responsables_ejecutantes) > 0 
      then jsonb_array_length(responsables_ejecutantes)
      else 1
    end
  )::numeric,
  2
)
where (total_horas_hombre is null or total_horas_hombre = 0)
  and duracion_minutos is not null
  and duracion_minutos > 0;
