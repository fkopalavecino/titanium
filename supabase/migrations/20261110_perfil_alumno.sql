-- resumen de recuperaciones de un alumno para el panel del profe
create or replace function public.recup_resumen(p_codigo text)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare r jsonb;
begin
  if not public.is_coach() then raise exception 'solo el profe'; end if;
  r := public._recup(p_codigo);
  return jsonb_build_object('disponibles', coalesce((r->>'disponibles')::int, 0), 'vence', r->'vence',
    'ganadas', jsonb_array_length(coalesce(r->'ganadas', '[]')), 'usadas', jsonb_array_length(coalesce(r->'usadas', '[]')));
end $$;
revoke all on function public.recup_resumen(text) from public, anon;
grant execute on function public.recup_resumen(text) to authenticated;

-- mensajes programados para un alumno (null = a todos, como antes)
alter table public.mensajes add column if not exists alumno text references public.alumnos(codigo) on delete cascade;
create index if not exists mensajes_alumno_idx on public.mensajes(alumno);
drop policy if exists alumno_lee on public.mensajes;
create policy alumno_lee on public.mensajes for select
  using (enviado_at is not null and public.mi_codigo() is not null and (alumno is null or alumno = public.mi_codigo()));

-- el alumno borra una foto de progreso suya (solo las que subió él)
create or replace function public.borrar_mi_foto(p_f date, p_ang text)
returns text language plpgsql security definer set search_path to 'public' as $$
declare c text := public.mi_codigo(); arr jsonb; nuevo jsonb := '[]'::jsonb; el jsonb; borrado text := null;
begin
  if c is null then raise exception 'sin ficha'; end if;
  if p_ang not in ('frente','perfil','espalda') then raise exception 'angulo invalido'; end if;
  select coalesce(fotos, '[]'::jsonb) into arr from public.alumnos where codigo = c;
  for el in select * from jsonb_array_elements(arr) loop
    if el->>'f' = p_f::text and el ? p_ang then
      if el->>p_ang not like 'alumno/' || c || '/%' then raise exception 'Esa foto la subió tu profe: pídele a él que la borre.'; end if;
      borrado := el->>p_ang; el := el - p_ang;
    end if;
    if el ?| array['frente','perfil','espalda'] then nuevo := nuevo || jsonb_build_array(el); end if;
  end loop;
  if borrado is null then raise exception 'No se encontró esa foto.'; end if;
  update public.alumnos set fotos = nuevo, updated_at = now() where codigo = c;
  return borrado;
end $$;
revoke all on function public.borrar_mi_foto(date, text) from public, anon;
grant execute on function public.borrar_mi_foto(date, text) to authenticated;

-- el InBody (y la cintura) lo registra solo el profe
revoke execute on function public.agregar_mi_inbody(text, date, jsonb) from authenticated, public, anon;
revoke execute on function public.borrar_mi_inbody(text, date) from authenticated, public, anon;
