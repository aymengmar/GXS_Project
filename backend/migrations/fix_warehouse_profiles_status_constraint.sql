-- Fix warehouse_profiles status constraint
-- Allowed values: active, pending, blocked
-- Removes: inactive (no longer used)

ALTER TABLE public.warehouse_profiles
  DROP CONSTRAINT IF EXISTS warehouse_profiles_status_check;

ALTER TABLE public.warehouse_profiles
  ADD CONSTRAINT warehouse_profiles_status_check
  CHECK (status IN ('active', 'pending', 'blocked'));
