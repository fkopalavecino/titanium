-- Perfil del alumno: link a su perfil de Strava (perfil.strava), validado con _strava_ok
do $$
declare f text := pg_get_functiondef('public.actualizar_mi_perfil(jsonb)'::regprocedure);
  marca text := $m$if jsonb_typeof(p_perfil->'nac') = 'string'$m$;
begin
  if position('strava' in f) > 0 then return; end if;
  if position(marca in f) = 0 then raise exception 'no encontré dónde insertar'; end if;
  f := replace(f, marca, $i$if jsonb_typeof(p_perfil->'strava') = 'string' and btrim(p_perfil->>'strava') <> '' then d := d || jsonb_build_object('strava', public._strava_ok(p_perfil->>'strava')); end if;
  $i$ || marca);
  execute f;
end $$;
