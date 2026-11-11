-- alumnos online: no tienen clases por recuperar (no hay clases fijas que perder)
create or replace function public.mis_recuperaciones()
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare c text := public.mi_codigo(); r jsonb; e jsonb;
begin
  if c is null then raise exception 'sin alumno vinculado'; end if;
  if exists (select 1 from alumnos where codigo = c and online) then return jsonb_build_object('activo', false, 'disponibles', 0, 'opciones', '[]'::jsonb); end if;
  r := public._recup(c); e := public._estado_pago(c);
  if coalesce((e->>'moroso')::boolean, false) and coalesce(((select data from config where id = 1)->'pago'->>'bloquearRecup')::boolean, true) then
    r := r || jsonb_build_object('bloqueado', true, 'opciones', '[]'::jsonb);
  end if;
  return r;
end $$;

create or replace function public.recuperar_clase(p_fecha date, p_hora text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare c text := public.mi_codigo(); r jsonb; o jsonb; e jsonb; fija boolean;
begin
  if c is null then raise exception 'sin alumno vinculado'; end if;
  if exists (select 1 from alumnos where codigo = c and online) then raise exception 'Tu plan online no tiene clases por recuperar.'; end if;
  e := public._estado_pago(c);
  if coalesce((e->>'moroso')::boolean, false) and coalesce(((select data from config where id = 1)->'pago'->>'bloquearRecup')::boolean, true) then
    raise exception 'Tienes un pago pendiente. Regulariza tu plan para recuperar clases.'; end if;
  perform pg_advisory_xact_lock(hashtext('recup|' || p_fecha || '|' || p_hora));
  r := public._recup(c);
  if (r->>'disponibles')::int < 1 then raise exception 'No tienes clases por recuperar en tu plan.'; end if;
  select x into o from jsonb_array_elements(r->'opciones') x where x->>'f' = p_fecha::text and x->>'h' = p_hora;
  if o is null then raise exception 'Ese bloque no está disponible para recuperar.'; end if;
  if (o->>'ya')::boolean then raise exception 'Ese día ya tienes clase: solo puedes recuperar en un día distinto.'; end if;
  if (o->>'libres')::int < 1 then raise exception 'Ese bloque se llenó. Elige otro.'; end if;
  update recup_cambios set usado = true where ctid = (select ctid from recup_cambios where alumno = c and not usado order by creado limit 1) returning true into fija;
  insert into clases(fecha, hora, alumno, extra, quitado, reag_de) values (p_fecha, p_hora, c, true, null, jsonb_build_object('recup', true, 'fija', true))
  on conflict (fecha, hora, alumno) do update set extra = true, quitado = null, reag_de = jsonb_build_object('recup', true, 'fija', true) where clases.asis is null;
  perform public._avisar_recup(c, p_fecha, p_hora, 'agenda');
  return public.mis_recuperaciones();
end $$;
