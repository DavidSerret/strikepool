-- ============================================================
-- StrikePool — Esquema de base de datos
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Habilitar UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLA: mesas
-- ============================================================
create table if not exists public.mesas (
  id          uuid primary key default gen_random_uuid(),
  numero      integer not null unique check (numero between 1 and 15),
  estado      text not null default 'libre' check (estado in ('libre', 'ocupada', 'reservada')),
  descripcion text
);

-- Insertar las 15 mesas
insert into public.mesas (numero, descripcion) values
  (1,  'Mesa 1 — Zona principal'),
  (2,  'Mesa 2 — Zona principal'),
  (3,  'Mesa 3 — Zona principal'),
  (4,  'Mesa 4 — Zona principal'),
  (5,  'Mesa 5 — Zona principal'),
  (6,  'Mesa 6 — Zona VIP'),
  (7,  'Mesa 7 — Zona VIP'),
  (8,  'Mesa 8 — Zona VIP'),
  (9,  'Mesa 9 — Zona VIP'),
  (10, 'Mesa 10 — Zona torneos'),
  (11, 'Mesa 11 — Zona torneos'),
  (12, 'Mesa 12 — Zona torneos'),
  (13, 'Mesa 13 — Zona fondo'),
  (14, 'Mesa 14 — Zona fondo'),
  (15, 'Mesa 15 — Zona fondo')
on conflict (numero) do nothing;

-- ============================================================
-- TABLA: reservas
-- ============================================================
create table if not exists public.reservas (
  id              uuid primary key default gen_random_uuid(),
  mesa_id         uuid not null references public.mesas (id) on delete cascade,
  nombre_cliente  text not null,
  telefono        text not null,
  email           text,
  fecha           date not null,
  hora_inicio     time not null,
  hora_fin        time not null,
  estado          text not null default 'pendiente' check (estado in ('pendiente', 'confirmada', 'cancelada')),
  notas           text,
  created_at      timestamptz not null default now(),
  constraint reservas_hora_check check (hora_fin > hora_inicio)
);

-- ============================================================
-- TABLA: horarios_bloqueo
-- ============================================================
create table if not exists public.horarios_bloqueo (
  id          uuid primary key default gen_random_uuid(),
  mesa_id     uuid references public.mesas (id) on delete cascade,
  fecha       date not null,
  hora_inicio time not null,
  hora_fin    time not null,
  motivo      text,
  created_at  timestamptz not null default now(),
  constraint bloqueo_hora_check check (hora_fin > hora_inicio)
  -- mesa_id NULL = bloqueo global (todas las mesas)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_reservas_mesa_fecha  on public.reservas (mesa_id, fecha);
create index if not exists idx_reservas_fecha       on public.reservas (fecha);
create index if not exists idx_bloqueo_mesa_fecha   on public.horarios_bloqueo (mesa_id, fecha);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- mesas: lectura pública, escritura sólo para admins
alter table public.mesas enable row level security;

create policy "mesas_select_public"
  on public.mesas for select
  using (true);

create policy "mesas_all_admin"
  on public.mesas for all
  using (auth.role() = 'authenticated');

-- reservas: inserción pública (crear reserva), todo lo demás sólo admins
alter table public.reservas enable row level security;

create policy "reservas_insert_public"
  on public.reservas for insert
  with check (true);

create policy "reservas_select_public"
  on public.reservas for select
  using (true);

create policy "reservas_update_admin"
  on public.reservas for update
  using (auth.role() = 'authenticated');

create policy "reservas_delete_admin"
  on public.reservas for delete
  using (auth.role() = 'authenticated');

-- horarios_bloqueo: lectura pública, escritura sólo admins
alter table public.horarios_bloqueo enable row level security;

create policy "bloqueo_select_public"
  on public.horarios_bloqueo for select
  using (true);

create policy "bloqueo_all_admin"
  on public.horarios_bloqueo for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- FUNCIÓN: comprobar disponibilidad de mesa
-- Devuelve true si la mesa está disponible en el rango dado
-- ============================================================
create or replace function public.mesa_disponible(
  p_mesa_id    uuid,
  p_fecha      date,
  p_hora_inicio time,
  p_hora_fin   time,
  p_excluir_id uuid default null
)
returns boolean
language plpgsql
security definer
as $$
declare
  conflicto_reserva   integer;
  conflicto_bloqueo   integer;
begin
  -- Comprobar reservas solapadas (excluyendo canceladas y la propia reserva si se edita)
  select count(*) into conflicto_reserva
  from public.reservas
  where mesa_id    = p_mesa_id
    and fecha      = p_fecha
    and estado    <> 'cancelada'
    and id        <> coalesce(p_excluir_id, '00000000-0000-0000-0000-000000000000')
    and hora_inicio < p_hora_fin
    and hora_fin   > p_hora_inicio;

  if conflicto_reserva > 0 then
    return false;
  end if;

  -- Comprobar bloqueos solapados (globales o específicos de la mesa)
  select count(*) into conflicto_bloqueo
  from public.horarios_bloqueo
  where (mesa_id = p_mesa_id or mesa_id is null)
    and fecha      = p_fecha
    and hora_inicio < p_hora_fin
    and hora_fin   > p_hora_inicio;

  if conflicto_bloqueo > 0 then
    return false;
  end if;

  return true;
end;
$$;

-- ============================================================
-- REALTIME: habilitar para mesas y reservas
-- ============================================================
alter publication supabase_realtime add table public.mesas;
alter publication supabase_realtime add table public.reservas;
