-- The Send to Drivers endpoint finalizes a draft plan by setting status =
-- 'sent' and stamping when that happened. sent_at wasn't part of the
-- original manually-created table.

alter table public.warehouse_assignment_plans
  add column if not exists sent_at timestamptz;
