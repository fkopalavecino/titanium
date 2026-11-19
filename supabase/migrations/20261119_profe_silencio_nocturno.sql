-- avisos al profe que llegan de noche (22:00–05:50 hora Chile): se guardan y se envían juntos a las 05:50
-- (los suelta la tarea «titanium-mensajes», que corre cada 5 minutos)
create table if not exists public.profe_avisos_pend (
  id bigserial primary key,
  msg jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.profe_avisos_pend enable row level security;
