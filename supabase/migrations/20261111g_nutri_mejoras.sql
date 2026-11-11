-- Nutrición · mejoras: alimentos que el alumno no come, el alumno puede variar su pauta, avisos push sin repetir.
alter table public.nutricion add column if not exists prefs jsonb not null default '{}'::jsonb;   -- {excluir: ['lacteos','pescado',...]}
alter table public.nutricion add column if not exists aviso_obj_at timestamptz;                   -- último aviso al profe por objetivo elegido
alter table public.nutricion add column if not exists aviso_pauta_at timestamptz;                 -- último aviso al alumno por pauta enviada

-- el alumno marca lo que no come (lo usa el generador de pautas del profe y su botón Variar)
create or replace function public.nutri_prefs(p_excluir text[])
returns void language plpgsql security definer set search_path to 'public' as $$
declare c text := public.mi_codigo();
begin
  if c is null then raise exception 'sin ficha'; end if;
  if coalesce(array_length(p_excluir, 1), 0) > 20 then raise exception 'demasiados'; end if;
  update public.nutricion set prefs = jsonb_set(coalesce(prefs, '{}'::jsonb), '{excluir}', to_jsonb(coalesce(p_excluir, '{}'::text[]))), updated_at = now()
   where alumno = c and activo;
  if not found then raise exception 'nutrición no activada'; end if;
end $$;
revoke all on function public.nutri_prefs(text[]) from public, anon;
grant execute on function public.nutri_prefs(text[]) to authenticated;

-- el alumno guarda su pauta después de variar opciones (mismos macros; el profe la ve igual)
create or replace function public.nutri_set_pauta(p_pauta jsonb)
returns void language plpgsql security definer set search_path to 'public' as $$
declare c text := public.mi_codigo();
begin
  if c is null then raise exception 'sin ficha'; end if;
  if jsonb_typeof(p_pauta) <> 'object' or jsonb_typeof(p_pauta->'comidas') <> 'array' or jsonb_array_length(p_pauta->'comidas') > 6
     or pg_column_size(p_pauta) > 60000 then raise exception 'pauta inválida'; end if;
  update public.nutricion set pauta = p_pauta, updated_at = now() where alumno = c and activo and pauta is not null;
  if not found then raise exception 'sin pauta'; end if;
end $$;
revoke all on function public.nutri_set_pauta(jsonb) from public, anon;
grant execute on function public.nutri_set_pauta(jsonb) to authenticated;
