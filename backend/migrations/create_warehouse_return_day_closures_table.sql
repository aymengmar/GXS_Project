-- Immutable "Close Day & Send to Admin" snapshot for Warehouse Returns.
-- One row per sent assignment plan, written once all driver returns for
-- that plan are confirmed. Never updated after creation.
--
-- This table was already created manually in Supabase; this migration is
-- kept in sync so the schema is reproducible, hence the IF NOT EXISTS guards.

create table if not exists public.warehouse_return_day_closures (
  id uuid primary key default gen_random_uuid(),
  warehouse_auth_user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.warehouse_assignment_plans(id) on delete cascade,
  assignment_date date not null,
  return_date date not null default current_date,
  status text not null,
  total_assigned_packets integer not null default 0,
  total_returned_packets integer not null default 0,
  drivers_count integer not null default 0,
  confirmed_signatures integer not null default 0,
  pending_signatures integer not null default 0,
  summary_data jsonb,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One closure per sent plan.
create unique index if not exists warehouse_return_day_closures_plan_id_idx
  on public.warehouse_return_day_closures (plan_id);

create index if not exists warehouse_return_day_closures_warehouse_auth_user_id_idx
  on public.warehouse_return_day_closures (warehouse_auth_user_id);

create index if not exists warehouse_return_day_closures_assignment_date_idx
  on public.warehouse_return_day_closures (assignment_date);

alter table public.warehouse_return_day_closures enable row level security;
-- No policies added: only the backend service role (which bypasses RLS) may
-- read/write this table, same as warehouse_return_records / driver_invoices.

drop trigger if exists set_warehouse_return_day_closures_updated_at on public.warehouse_return_day_closures;
create trigger set_warehouse_return_day_closures_updated_at
  before update on public.warehouse_return_day_closures
  for each row execute function public.set_updated_at();
