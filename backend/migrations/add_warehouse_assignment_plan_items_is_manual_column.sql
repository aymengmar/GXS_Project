-- The draft assignment plan manage popup (edit count / change driver) marks
-- items it touches as manually edited so they can be distinguished from the
-- original AI/deterministic draft output.

alter table public.warehouse_assignment_plan_items
  add column if not exists is_manual boolean not null default false;
