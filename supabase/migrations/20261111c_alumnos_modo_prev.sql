-- respaldo del horario presencial (bloques y agenda libre) mientras el alumno está en modo online, para devolverlo tal cual al volver
alter table public.alumnos add column if not exists modo_prev jsonb;
