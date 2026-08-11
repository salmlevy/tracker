-- Tabla única: cada usuario guarda su estado completo (pesas + trote) como JSON.
create table if not exists estado (
  usuario text primary key,
  datos jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now()
);

alter table estado enable row level security;

-- Política de PRUEBA: cualquiera con la anon key puede leer/escribir su fila.
-- Suficiente para probar entre pocas personas de confianza.
-- Para abrirlo a desconocidos hay que migrar a Supabase Auth (ver guía).
create policy "acceso de prueba" on estado
  for all using (true) with check (true);
