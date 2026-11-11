-- Modo Online: alumnos con asesoría a distancia (entrenan en otro lugar con la rutina de la app).
-- No tienen bloques ni ocupan cupos; pago mensual sin número de clases; sus sesiones se guardan con hora 'online'.
alter table public.alumnos add column if not exists online boolean not null default false;
alter table public.alumnos add column if not exists dias_online text[] not null default '{}';

-- el alumno online puede anotar su sesión cualquier día (él organiza su semana); una sesión por día
create or replace function public.registrar_mi_sesion(p_fecha date, p_hora text, p_ej jsonb, p_carga text, p_rpe numeric, p_rutina text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare c text := public.mi_codigo(); hoy date := (now() at time zone 'America/Santiago')::date; ok boolean;
begin
  if c is null then raise exception 'sin alumno vinculado'; end if;
  if p_fecha < hoy - 30 or p_fecha > hoy + 1 then raise exception 'Solo puedes anotar sesiones de los últimos 30 días'; end if;
  if p_hora = 'online' then
    ok := exists (select 1 from alumnos a where a.codigo = c and a.online);
  else
    if p_hora is null or p_hora !~ '^\d\d:\d\d$' then raise exception 'Esta sesión no está en tu agenda'; end if;
    ok := exists (select 1 from alumnos a where a.codigo = c and (_dk(p_fecha) || '-' || p_hora) = any(a.bloques)
                    and not exists (select 1 from clases q where q.fecha = p_fecha and q.hora = p_hora and q.alumno = c and q.quitado))
       or exists (select 1 from clases q where q.fecha = p_fecha and q.hora = p_hora and q.alumno = c and not coalesce(q.quitado, false));
  end if;
  if not ok then raise exception 'Esta sesión no está en tu agenda'; end if;
  insert into public.clases(fecha, hora, alumno, ej, carga, rpe, rutina)
  values (p_fecha, p_hora, c, p_ej, p_carga, p_rpe, p_rutina)
  on conflict (fecha, hora, alumno) do update set ej = excluded.ej, carga = excluded.carga, rpe = excluded.rpe,
    rutina = coalesce(clases.rutina, excluded.rutina), updated_at = now();
end $$;
