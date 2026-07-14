-- Fix warehouse_assignment_plan_items match_type constraint
-- Allowed values: same_zip, nearest_zip, balanced, manual

ALTER TABLE public.warehouse_assignment_plan_items
  DROP CONSTRAINT IF EXISTS warehouse_assignment_plan_items_match_type_check;

ALTER TABLE public.warehouse_assignment_plan_items
  ADD CONSTRAINT warehouse_assignment_plan_items_match_type_check
  CHECK (match_type IN ('same_zip', 'nearest_zip', 'balanced', 'manual'));
