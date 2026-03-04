
-- Backfill: insert customer roles for all existing customer_profiles that don't have a role yet
INSERT INTO public.user_roles (user_id, role)
SELECT cp.user_id, 'customer'::app_role
FROM public.customer_profiles cp
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = cp.user_id AND ur.role = 'customer'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Backfill: for any auth user who has NO role at all and NO customer_profile, 
-- create a customer_profile stub so the trigger fires
-- (This covers users who signed up but never completed profile)
