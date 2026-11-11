-- Nutrición: registro de comidas del alumno (Nivel 2) + metas que pone el profe (Nivel 3).
-- Solo ve la pestaña quien tenga una fila activa en public.nutricion (igual que las skills).

create table if not exists public.nutricion (
  alumno text primary key references public.alumnos(codigo) on delete cascade,
  activo boolean not null default true,
  meta jsonb not null default '{}'::jsonb,      -- {kcal, prot, carb, gras, nota, desde}
  propios jsonb not null default '[]'::jsonb,   -- alimentos creados por el alumno (por 100 g)
  recetas jsonb not null default '[]'::jsonb,   -- recetas del alumno
  updated_at timestamptz not null default now()
);
alter table public.nutricion enable row level security;
drop policy if exists coach_all on public.nutricion;
create policy coach_all on public.nutricion for all using (public.is_coach()) with check (public.is_coach());
drop policy if exists alumno_ve_la_suya on public.nutricion;
create policy alumno_ve_la_suya on public.nutricion for select using (alumno = public.mi_codigo());

create table if not exists public.comidas_log (
  id uuid primary key default gen_random_uuid(),
  alumno text not null references public.alumnos(codigo) on delete cascade,
  fecha date not null,
  comida text not null check (comida in ('desayuno','almuerzo','once','cena','snack')),
  nombre text not null check (char_length(nombre) <= 120),
  gramos numeric not null check (gramos > 0 and gramos <= 5000),
  estado text check (estado in ('crudo','cocido')),
  kcal numeric not null default 0 check (kcal >= 0 and kcal <= 20000),
  prot numeric not null default 0 check (prot >= 0 and prot <= 2000),
  carb numeric not null default 0 check (carb >= 0 and carb <= 2000),
  gras numeric not null default 0 check (gras >= 0 and gras <= 2000),
  ref text check (char_length(ref) <= 80),
  created_at timestamptz not null default now()
);
create index if not exists comidas_log_alumno_fecha on public.comidas_log(alumno, fecha);
alter table public.comidas_log enable row level security;
drop policy if exists coach_all on public.comidas_log;
create policy coach_all on public.comidas_log for all using (public.is_coach()) with check (public.is_coach());
drop policy if exists alumno_lee on public.comidas_log;
create policy alumno_lee on public.comidas_log for select using (alumno = public.mi_codigo());
drop policy if exists alumno_crea on public.comidas_log;
create policy alumno_crea on public.comidas_log for insert with check (
  alumno = public.mi_codigo() and exists (select 1 from public.nutricion n where n.alumno = comidas_log.alumno and n.activo));
drop policy if exists alumno_edita on public.comidas_log;
create policy alumno_edita on public.comidas_log for update using (alumno = public.mi_codigo()) with check (alumno = public.mi_codigo());
drop policy if exists alumno_borra on public.comidas_log;
create policy alumno_borra on public.comidas_log for delete using (alumno = public.mi_codigo());

alter table public.nutricion add column if not exists favs jsonb not null default '[]'::jsonb;

-- el alumno guarda sus alimentos propios, recetas y favoritos (no puede tocar sus metas)
create or replace function public.nutri_guardar(p_propios jsonb, p_recetas jsonb, p_favs jsonb)
returns void language plpgsql security definer set search_path to 'public' as $$
declare c text := public.mi_codigo();
begin
  if c is null then raise exception 'sin ficha'; end if;
  if jsonb_typeof(coalesce(p_propios, '[]')) <> 'array' or jsonb_typeof(coalesce(p_recetas, '[]')) <> 'array' or jsonb_typeof(coalesce(p_favs, '[]')) <> 'array' then raise exception 'formato inválido'; end if;
  if coalesce(pg_column_size(p_propios),0) + coalesce(pg_column_size(p_recetas),0) + coalesce(pg_column_size(p_favs),0) > 300000 then raise exception 'demasiados datos'; end if;
  update public.nutricion set propios = coalesce(p_propios, propios), recetas = coalesce(p_recetas, recetas), favs = coalesce(p_favs, favs), updated_at = now()
   where alumno = c and activo;
  if not found then raise exception 'nutrición no activada'; end if;
end $$;
revoke all on function public.nutri_guardar(jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.nutri_guardar(jsonb, jsonb, jsonb) to authenticated;
