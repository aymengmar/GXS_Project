-- Per-driver return + signature records for the Warehouse Returns screen.
-- One row per warehouse_assignment_plan_items row (yesterday's sent plan),
-- capturing the returned packet count and the signature pad payload once
-- warehouse staff confirms a driver's return.
--
-- This table was already created manually in Supabase; this migration is
-- kept in sync so the schema is reproducible, hence the IF NOT EXISTS guards.

create table if not exists public.warehouse_return_records (
  id uuid primary key default gen_random_uuid(),
  warehouse_auth_user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.warehouse_assignment_plans(id) on delete cascade,
  plan_item_id uuid not null references public.warehouse_assignment_plan_items(id) on delete cascade,
  return_date date not null default current_date,
  assignment_date date not null,
  driver_auth_user_id uuid not null references auth.users(id) on delete cascade,
  driver_name text not null,
  driver_external_id text null,
  zip_code text not null,
  assigned_packets integer not null default 0,
  returned_packets integer not null default 0,
  signature_status text not null default 'not_started' check (
    signature_status in ('not_started', 'required', 'confirmed')
  ),
  signature_data jsonb,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (returned_packets >= 0),
  check (returned_packets <= assigned_packets)
);

-- One return record per assignment item; also serves as the natural lookup
-- key used by the save/update endpoint.
create unique index if not exists warehouse_return_records_plan_item_id_idx
  on public.warehouse_return_records (plan_item_id);

create index if not exists warehouse_return_records_warehouse_auth_user_id_idx
  on public.warehouse_return_records (warehouse_auth_user_id);

create index if not exists warehouse_return_records_plan_id_idx
  on public.warehouse_return_records (plan_id);

create index if not exists warehouse_return_records_driver_auth_user_id_idx
  on public.warehouse_return_records (driver_auth_user_id);

alter table public.warehouse_return_records enable row level security;
-- No policies added: only the backend service role (which bypasses RLS) may
-- read/write this table, same as driver_invoices / driver_documents.

drop trigger if exists set_warehouse_return_records_updated_at on public.warehouse_return_records;
create trigger set_warehouse_return_records_updated_at
  before update on public.warehouse_return_records
  for each row execute function public.set_updated_at();
