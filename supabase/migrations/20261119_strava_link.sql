-- Link de Strava: el alumno pega el link de su actividad al terminar (sesión de rutina o actividad de la agenda)
alter table public.clases add column if not exists strava text;
alter table public.actividades_hechas add column if not exists strava text;

-- valida y limpia un link de Strava (null = quitar)
create or replace function public._strava_ok(p_url text)
returns text language plpgsql immutable as $$
declare u text := nullif(btrim(p_url), '');
begin
  if u is null then return null; end if;
  if length(u) > 300 or u !~* '^https://([a-z0-9-]+\.)*(strava\.com|strava\.app\.link)(/[^\s<>"'']*)?$' then
    raise exception 'Ese link no es de Strava. En Strava abre tu actividad › Compartir › Copiar link.';
  end if;
  return u;
end $$;

create or replace function public.mi_strava_sesion(p_fecha date, p_hora text, p_url text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare c text := public.mi_codigo(); u text := public._strava_ok(p_url);
begin
  if c is null then raise exception 'sin alumno vinculado'; end if;
  update public.clases set strava = u, updated_at = now() where alumno = c and fecha = p_fecha and hora = p_hora;
  if not found then raise exception 'Primero termina y guarda tu entrenamiento.'; end if;
end $$;

create or replace function public.mi_strava_actividad(p_evento uuid, p_url text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare c text := public.mi_codigo(); u text := public._strava_ok(p_url);
begin
  if c is null then raise exception 'sin alumno vinculado'; end if;
  update public.actividades_hechas set strava = u where alumno = c and evento = p_evento;
  if not found then raise exception 'Primero marca la actividad como hecha.'; end if;
end $$;

revoke execute on function public.mi_strava_sesion(date, text, text) from public, anon;
revoke execute on function public.mi_strava_actividad(uuid, text) from public, anon;
grant execute on function public.mi_strava_sesion(date, text, text) to authenticated;
grant execute on function public.mi_strava_actividad(uuid, text) to authenticated;
