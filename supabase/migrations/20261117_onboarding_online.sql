-- Fase 2 Asesoría Online: onboarding (dónde entrena, términos y consentimiento, tests de movimiento) + evaluación del profe
-- Solo agrega columnas/funciones nuevas; no cambia nada del flujo presencial.

-- evaluación online que registra solo el profe: semáforo de tests, perímetros y test físico
alter table public.alumnos add column if not exists eval_online jsonb not null default '{}'::jsonb;

-- configuración online (links de YouTube de los tests demo); el profe edita, todos leen
create table if not exists public.online_cfg (id int primary key default 1 check (id = 1), data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
alter table public.online_cfg enable row level security;
drop policy if exists coach_all on public.online_cfg;
create policy coach_all on public.online_cfg for all using (public.is_coach()) with check (public.is_coach());
drop policy if exists todos_leen on public.online_cfg;
create policy todos_leen on public.online_cfg for select to authenticated using (true);
insert into public.online_cfg(id) values (1) on conflict do nothing;

-- limpia lo que envía el alumno en perfil.onl
create or replace function public._limpiar_onl(p jsonb, previo jsonb)
returns jsonb language plpgsql immutable set search_path to 'public' as $$
declare d jsonb := '{}'::jsonb; arr jsonb; x text; k text; t jsonb; tests jsonb := '{}'::jsonb; v int;
  okL text[] := array['titanium','gym','casa']; okD text[] := array['lun','mar','mie','jue','vie','sab','dom'];
  okT text[] := array['sq','bisagra','flex','zancada','hombro'];
begin
  arr := '[]'; if jsonb_typeof(p->'lugares') = 'array' then for x in select jsonb_array_elements_text(p->'lugares') loop if x = any(okL) then arr := arr || to_jsonb(x); end if; end loop; end if;
  d := d || jsonb_build_object('lugares', arr);
  arr := '[]'; if jsonb_typeof(p->'diasGym') = 'array' then for x in select jsonb_array_elements_text(p->'diasGym') loop if x = any(okD) then arr := arr || to_jsonb(x); end if; end loop; end if;
  d := d || jsonb_build_object('diasGym', arr);
  arr := '[]'; if jsonb_typeof(p->'equipo') = 'array' then for x in select jsonb_array_elements_text(p->'equipo') limit 30 loop if length(x) between 1 and 40 then arr := arr || to_jsonb(x); end if; end loop; end if;
  d := d || jsonb_build_object('equipo', arr);
  if jsonb_typeof(p->'mancMax') = 'number' and (p->>'mancMax')::numeric between 1 and 100 then d := d || jsonb_build_object('mancMax', (p->>'mancMax')::numeric); end if;
  if jsonb_typeof(p->'min') = 'number' and (p->>'min')::int in (30,45,60,75,90) then d := d || jsonb_build_object('min', (p->>'min')::int); end if;
  if jsonb_typeof(p->'gymNombre') = 'string' and length(p->>'gymNombre') between 1 and 60 then d := d || jsonb_build_object('gymNombre', p->>'gymNombre'); end if;
  if jsonb_typeof(p->'redes') = 'boolean' then d := d || jsonb_build_object('redes', p->'redes'); end if;
  -- términos: la fecha la pone el servidor; si es la misma versión se conserva la fecha original
  if jsonb_typeof(p->'terminos') = 'object' and (p->'terminos'->>'v') ~ '^\d{1,3}$' then v := (p->'terminos'->>'v')::int;
    d := d || jsonb_build_object('terminos', jsonb_build_object('v', v, 'f', coalesce(case when (previo->'terminos'->>'v')::int = v then previo->'terminos'->>'f' end, to_char(now() at time zone 'America/Santiago', 'YYYY-MM-DD HH24:MI'))));
  elsif previo ? 'terminos' then d := d || jsonb_build_object('terminos', previo->'terminos'); end if;
  -- tests de movimiento: fecha de envío (por WhatsApp) y link opcional (YouTube/Drive)
  if jsonb_typeof(p->'tests') = 'object' then
    foreach k in array okT loop t := p->'tests'->k;
      if jsonb_typeof(t) = 'object' and (t->>'f') ~ '^\d{4}-\d{2}-\d{2}$' then
        tests := tests || jsonb_build_object(k, jsonb_build_object('f', t->>'f') || case when (t->>'link') ~ '^https://' and length(t->>'link') <= 300 then jsonb_build_object('link', t->>'link') else '{}'::jsonb end);
      end if; end loop;
  end if;
  d := d || jsonb_build_object('tests', tests);
  return d;
end $$;

-- mismo actualizar_mi_perfil de antes + bloque "onl" (si no viene, se conserva)
create or replace function public.actualizar_mi_perfil(p_perfil jsonb)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare c text := public.mi_codigo(); d jsonb := '{}'::jsonb; deps jsonb := '[]'::jsonb; x text; n date; previo jsonb;
begin
  if c is null then raise exception 'sin ficha'; end if;
  select perfil into previo from public.alumnos where codigo = c;
  if jsonb_typeof(p_perfil->'apodo') = 'string' and length(p_perfil->>'apodo') between 1 and 30 then d := d || jsonb_build_object('apodo', p_perfil->>'apodo'); end if;
  if jsonb_typeof(p_perfil->'meta') = 'string' and length(p_perfil->>'meta') between 1 and 120 then d := d || jsonb_build_object('meta', p_perfil->>'meta'); end if;
  if jsonb_typeof(p_perfil->'avatar') = 'string' and (p_perfil->>'avatar') like 'alumno/' || c || '/%' then d := d || jsonb_build_object('avatar', p_perfil->>'avatar'); end if;
  if jsonb_typeof(p_perfil->'ig') = 'string' and (p_perfil->>'ig') ~ '^[A-Za-z0-9._]{1,30}$' then d := d || jsonb_build_object('ig', p_perfil->>'ig'); end if;
  if jsonb_typeof(p_perfil->'nac') = 'string' and (p_perfil->>'nac') ~ '^\d{4}-\d{2}-\d{2}$' then
    n := (p_perfil->>'nac')::date;
    if n between date '1930-01-01' and current_date then d := d || jsonb_build_object('nac', n::text); update public.alumnos set nacimiento = n where codigo = c and nacimiento is null; end if;
  end if;
  if jsonb_typeof(p_perfil->'deportes') = 'array' then
    for x in select jsonb_array_elements_text(p_perfil->'deportes') limit 12 loop
      if length(x) between 1 and 30 then deps := deps || jsonb_build_array(x); end if;
    end loop;
    if jsonb_array_length(deps) > 0 then d := d || jsonb_build_object('deportes', deps); end if;
  end if;
  if jsonb_typeof(p_perfil->'ficha') = 'object' then
    if length((p_perfil->'ficha')::text) > 8000 then raise exception 'ficha demasiado larga'; end if;
    d := d || jsonb_build_object('ficha', public._limpiar_ficha(p_perfil->'ficha'));
  elsif previo ? 'ficha' then d := d || jsonb_build_object('ficha', previo->'ficha');
  end if;
  if jsonb_typeof(p_perfil->'reglas') = 'object' and (p_perfil->'reglas'->>'v') ~ '^\d{1,3}$' then
    d := d || jsonb_build_object('reglas', jsonb_build_object('v', (p_perfil->'reglas'->>'v')::int, 'f', coalesce(case when previo->'reglas'->>'v' = p_perfil->'reglas'->>'v' then previo->'reglas'->>'f' end, to_char(now() at time zone 'America/Santiago', 'YYYY-MM-DD HH24:MI'))));
  elsif previo ? 'reglas' then d := d || jsonb_build_object('reglas', previo->'reglas');
  end if;
  -- asesoría online: dónde entrena, términos y consentimiento, tests enviados
  if jsonb_typeof(p_perfil->'onl') = 'object' then
    if length((p_perfil->'onl')::text) > 6000 then raise exception 'datos online demasiado largos'; end if;
    d := d || jsonb_build_object('onl', public._limpiar_onl(p_perfil->'onl', coalesce(previo->'onl', '{}'::jsonb)));
  elsif previo ? 'onl' then d := d || jsonb_build_object('onl', previo->'onl');
  end if;
  update public.alumnos set perfil = d, updated_at = now() where codigo = c;
end $function$;
