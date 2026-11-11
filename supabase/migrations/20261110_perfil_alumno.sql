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
