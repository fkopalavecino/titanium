-- Pauta nutricional automática.
-- pauta: la que el profe revisa y envía (3 opciones por comida). meta.revisar = true cuando el alumno eligió objetivo
-- y el profe aún no revisa/envía la pauta.
alter table public.nutricion add column if not exists pauta jsonb;
alter table public.nutricion add column if not exists pauta_at timestamptz;

-- el alumno elige objetivo y actividad; la app calcula las metas con su último InBody (nutri-calc.js) y las guarda aquí
create or replace function public.nutri_set_meta(p_meta jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare c text := public.mi_codigo(); ant jsonb; m jsonb;
  kcal numeric := (p_meta->>'kcal')::numeric; prot numeric := (p_meta->>'prot')::numeric;
  carb numeric := (p_meta->>'carb')::numeric; gras numeric := (p_meta->>'gras')::numeric;
begin
  if c is null then raise exception 'sin ficha'; end if;
  select n.meta into ant from public.nutricion n where n.alumno = c and n.activo;
  if not found then raise exception 'nutrición no activada'; end if;
  if kcal is null or kcal < 800 or kcal > 6000 or prot < 20 or prot > 400 or carb < 0 or carb > 900 or gras < 15 or gras > 300 then raise exception 'metas fuera de rango'; end if;
  if coalesce(p_meta->>'obj', '') not in ('bajar', 'recomp', 'mantener', 'subir') then raise exception 'objetivo inválido'; end if;
  m := (p_meta - 'nota' - 'revisar' - 'fuente') || jsonb_build_object('nota', coalesce(ant->>'nota', ''), 'fuente', 'alumno', 'revisar', true,
         'desde', (now() at time zone 'America/Santiago')::date::text);
  update public.nutricion set meta = m, updated_at = now() where alumno = c;
  return m;
end $$;
revoke all on function public.nutri_set_meta(jsonb) from public, anon;
grant execute on function public.nutri_set_meta(jsonb) to authenticated;
