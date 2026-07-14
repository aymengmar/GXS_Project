-- warehouse_assignment_plans / warehouse_assignment_plan_items were created
-- manually in Supabase. This migration mirrors that manual SQL so the schema
-- is reproducible, and safely adds the columns the AI draft-generation
-- endpoint needs that weren't part of the original manual setup.

alter table public.warehouse_assignment_plans
  add column if not exists created_by_ai boolean not null default false;

alter table public.warehouse_assignment_plans
  add column if not exists unassigned_zips jsonb not null default '[]'::jsonb;

alter table public.warehouse_assignment_plans
  add column if not exists drivers_without_packets jsonb not null default '[]'::jsonb;

alter table public.warehouse_assignment_plans
  add column if not exists plan_review jsonb not null default '[]'::jsonb;

alter table public.warehouse_assignment_plans
  add column if not exists total_validated_zips integer not null default 0;

alter table public.warehouse_assignment_plans
  add column if not exists ai_model text;

alter table public.warehouse_assignment_plans
  add column if not exists ai_raw_response jsonb;

-- One plan per warehouse per day; the draft-generation endpoint selects the
-- existing row for (warehouse_auth_user_id, plan_date) itself rather than
-- relying on this for an ON CONFLICT upsert, so it's safe to add even if the
-- table already has rows (it will only fail if true duplicates exist).
create unique index if not exists warehouse_assignment_plans_warehouse_date_idx
  on public.warehouse_assignment_plans (warehouse_auth_user_id, plan_date);

create index if not exists warehouse_assignment_plan_items_plan_id_idx
  on public.warehouse_assignment_plan_items (plan_id);
