-- Adds carry-over tracking columns to warehouse_zip_inventory so the
-- assigned-packets endpoint can distinguish "updated today" (tomorrow's
-- carry-over) from "updated before today" (ready to surface today).

alter table public.warehouse_zip_inventory
  add column if not exists last_updated_date date not null default current_date;

alter table public.warehouse_zip_inventory
  add column if not exists updated_at timestamptz not null default now();

-- One inventory row per warehouse+ZIP; also serves as the ON CONFLICT target
-- for the upsert in update_zip_assigned_packets.
create unique index if not exists warehouse_zip_inventory_warehouse_zip_idx
  on public.warehouse_zip_inventory (warehouse_auth_user_id, zip_code);
