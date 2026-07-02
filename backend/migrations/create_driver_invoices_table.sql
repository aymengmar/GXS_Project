-- Company-car driver invoices (fuel, parking, toll, maintenance, car wash, other).
-- Receipt files live in the private "driver-invoices" storage bucket; only
-- metadata/path is stored here. Access goes through the backend service role
-- only (mirrors driver_documents), so RLS is enabled with no policies.

create table if not exists public.driver_invoices (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  driver_profile_id uuid not null references public.driver_profiles(id) on delete cascade,

  invoice_type text not null check (
    invoice_type in ('fuel', 'parking', 'toll', 'repair_maintenance', 'car_wash', 'other')
  ),
  invoice_date date not null,
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  details text,
  notes text,
  invoice_number text not null unique,

  storage_bucket text not null default 'driver-invoices',
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size integer not null,

  -- status: file lifecycle (uploaded / replaced / deleted)
  status text not null default 'uploaded' check (status in ('uploaded', 'replaced', 'deleted')),
  -- review_status: admin review of the invoice
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists driver_invoices_auth_user_id_idx on public.driver_invoices (auth_user_id);
create index if not exists driver_invoices_driver_profile_id_idx on public.driver_invoices (driver_profile_id);

alter table public.driver_invoices enable row level security;
-- No policies added: only the backend service role (which bypasses RLS) may
-- read/write this table, same as driver_documents.

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_driver_invoices_updated_at on public.driver_invoices;
create trigger set_driver_invoices_updated_at
  before update on public.driver_invoices
  for each row execute function public.set_updated_at();

-- Private storage bucket for invoice receipts.
insert into storage.buckets (id, name, public)
values ('driver-invoices', 'driver-invoices', false)
on conflict (id) do nothing;
