-- marca qué opción de la pauta se anotó con «Comí esta» (comida.opción), para poder deshacerla
alter table public.comidas_log add column if not exists pauta_op text check (char_length(pauta_op) <= 20);
