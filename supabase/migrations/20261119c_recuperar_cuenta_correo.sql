-- Recuperar la cuenta con el correo de la ficha.
-- Si a un alumno se le cierra la sesión (ej. iPhone que corta la renovación a medias),
-- su cuenta "solo con código" se pierde. Ahora, si entra con el correo que tiene en su ficha
-- (verificado con el código que le llega al mail), la app lo vuelve a vincular a su ficha
-- sin pedir código de invitación nuevo.
create or replace function public.vincular_alumno(p_inv text default null)
returns text language plpgsql security definer set search_path = public as $$
declare c text; n int;
  em text := nullif(lower(coalesce(auth.jwt() ->> 'email', '')), '');
  anon boolean := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
begin
  if auth.uid() is null then return null; end if;
  select codigo into c from public.alumnos where user_id = auth.uid() and acceso;
  if c is not null then return c; end if;
  if p_inv is not null and length(trim(p_inv)) between 4 and 12 then
    update public.alumnos set user_id = auth.uid(), email = coalesce(nullif(email, ''), em), acceso = true,
           invitacion = null, invitacion_expira = null
     where upper(invitacion) = upper(trim(p_inv)) and invitacion_expira > now() and estado <> 'inactivo'
    returning codigo into c;
    if c is not null then return c; end if;
  end if;
  -- correo verificado (no anónimo) que coincide con UNA sola ficha con acceso: se vincula aunque tuviera otra sesión antes
  if em is not null and not anon then
    select count(*) into n from public.alumnos where acceso and estado <> 'inactivo' and lower(trim(email)) = em;
    if n = 1 then
      update public.alumnos set user_id = auth.uid()
       where acceso and estado <> 'inactivo' and lower(trim(email)) = em
      returning codigo into c;
    end if;
  end if;
  return c;
end $$;
