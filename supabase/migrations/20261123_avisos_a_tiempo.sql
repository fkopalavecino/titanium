-- Avisos a tiempo (23-11-2026)
-- 1) recordatorio de clase 4 h antes (clases antes de las 11:00: la noche anterior a las 21:00), así alcanzan a avisar antes del límite de 2 h
-- 2) con la clase ya empezada el alumno no puede responder ni cambiar «Voy / No puedo ir» (lo controla el servidor)

create or replace function public.clases_por_recordar()
 returns table(alumno text, fecha date, hora text)
 language sql stable security definer set search_path to 'public'
as $function$
  with ahora as (select (now() at time zone 'America/Santiago') t),
  dk as (select d::date f, (array['dom','lun','mar','mie','jue','vie','sab'])[extract(dow from d)::int + 1] k
         from ahora, generate_series(ahora.t::date, ahora.t::date + 1, interval '1 day') d),
  nd as (select coalesce(data->'noDisponible', '[]'::jsonb) v from public.config where id = 1),
  base as (select a.codigo alumno, dk.f fecha, split_part(b, '-', 2) hora
           from public.alumnos a cross join lateral unnest(a.bloques) b join dk on split_part(b, '-', 1) = dk.k
           where a.estado <> 'inactivo' and a.acceso),
  extra as (select c.alumno, c.fecha, c.hora from public.clases c join dk on c.fecha = dk.f join public.alumnos a on a.codigo = c.alumno
            where c.extra and a.estado <> 'inactivo' and a.acceso),
  todas as (select * from base union select * from extra)
  select t.alumno, t.fecha, t.hora from todas t join dk on dk.f = t.fecha, ahora, nd
  where t.hora ~ '^\d\d:\d\d$'
    and not (coalesce(nd.v, '[]'::jsonb) ? (dk.k || '-' || t.hora))
    and not exists (select 1 from public.clases q where q.fecha = t.fecha and q.hora = t.hora and q.alumno = t.alumno and q.quitado)
    and (t.fecha + t.hora::time) > ahora.t
    and (case when t.hora < '11:00' then (t.fecha - 1) + time '21:00' else (t.fecha + t.hora::time) - interval '4 hours' end) <= ahora.t
    and not exists (select 1 from public.recordatorios_clase r where r.alumno = t.alumno and r.fecha = t.fecha and r.hora = t.hora)
    and not exists (select 1 from public.confirmaciones x where x.alumno = t.alumno and x.fecha = t.fecha and x.hora = t.hora)
    and exists (select 1 from public.push_subs p where p.alumno = t.alumno)
$function$;

create or replace function public.confirmar_clase(p_fecha date, p_hora text, p_estado text)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare c text := public.mi_codigo(); nom text; prev record; r jsonb; ahora timestamp := now() at time zone 'America/Santiago';
begin
  if c is null then raise exception 'sin alumno vinculado'; end if;
  if p_estado not in ('voy','no_voy') then raise exception 'estado inválido'; end if;
  if p_hora !~ '^\d\d:\d\d$' then raise exception 'hora inválida'; end if;
  if p_fecha < ahora::date or p_fecha > ahora::date + 21 then raise exception 'fecha fuera de rango'; end if;
  if (p_fecha + p_hora::time) <= ahora then raise exception 'Tu clase ya empezó: ya no puedes responder. Si algo pasó, escríbele a tu profe.'; end if;
  select * into prev from public.confirmaciones where fecha = p_fecha and hora = p_hora and alumno = c for update;
  if prev.alumno is not null then
    if prev.estado = p_estado then return; end if;
    if prev.cambios >= 1 then raise exception 'Ya cambiaste tu respuesta una vez. Si algo cambió, escríbele a tu profe.'; end if;
    if (p_fecha + p_hora::time) - interval '2 hours' <= ahora then raise exception 'Faltan menos de 2 horas: tu respuesta quedó fija. Si algo cambió, escríbele a tu profe.'; end if;
    if p_estado = 'voy' and prev.estado = 'no_voy' then
      r := public._recup(c);
      if exists (select 1 from jsonb_array_elements(r->'ganadas') g where g->>'f' = p_fecha::text and g->>'h' = p_hora) and (r->>'disponibles')::int < 1 then
        raise exception 'Ya usaste esta clase para agendar una recuperación, así que no puedes volver a ella. Si algo cambió, escríbele a tu profe.'; end if;
      perform pg_advisory_xact_lock(hashtext('recup|' || p_fecha || '|' || p_hora));
      if public._ocupados(p_fecha, p_hora) >= coalesce(((select data from config where id = 1)->>'cupos')::int, 8) then
        raise exception 'Tu cupo en ese bloque ya lo tomó otro alumno. Escríbele a tu profe para ver si hay espacio.'; end if;
    end if;
    update public.confirmaciones set estado = p_estado, cambios = cambios + 1, updated_at = now() where fecha = p_fecha and hora = p_hora and alumno = c;
    if p_estado = 'voy' then delete from public.solicitudes where alumno = c and tipo = 'no_voy' and estado = 'pendiente' and data->>'fecha' = p_fecha::text and data->>'hora' = p_hora; end if;
  else
    insert into public.confirmaciones(fecha, hora, alumno, estado) values (p_fecha, p_hora, c, p_estado);
  end if;
  if p_estado = 'no_voy' and not exists (select 1 from public.solicitudes s where s.alumno = c and s.tipo = 'no_voy' and s.estado = 'pendiente' and s.data->>'fecha' = p_fecha::text and s.data->>'hora' = p_hora) then
    select nombre into nom from public.alumnos where codigo = c;
    insert into public.solicitudes(alumno, tipo, data) values (c, 'no_voy', jsonb_build_object('nombre', nom, 'fecha', p_fecha::text, 'hora', p_hora));
  end if;
end $function$;
