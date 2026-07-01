-- One-time repair: backfill public.app_users for drivers that already have
-- an auth.users row and a driver_profiles row, but are missing the linking
-- app_users row (root cause: self-registered drivers never got an app_users
-- row created before this fix — see backend/app/services/admin_service.py).
--
-- Safe to run multiple times: only inserts rows that are still missing.
-- Does not touch auth.users or driver_profiles.

INSERT INTO public.app_users (
  auth_user_id,
  email,
  full_name,
  role,
  is_active,
  must_change_password,
  created_at,
  updated_at
)
SELECT
  dp.auth_user_id,
  dp.email,
  dp.full_name,
  'driver',
  true,
  false,
  now(),
  now()
FROM public.driver_profiles dp
LEFT JOIN public.app_users au ON au.auth_user_id = dp.auth_user_id
WHERE au.auth_user_id IS NULL;

-- Verify no drivers remain without an app_users row:
-- SELECT dp.id, dp.auth_user_id, dp.email, dp.status
-- FROM public.driver_profiles dp
-- LEFT JOIN public.app_users au ON au.auth_user_id = dp.auth_user_id
-- WHERE au.auth_user_id IS NULL;
