
-- Auto-assign roles when records are inserted into role-specific tables

-- Function: assign role on customer_profiles insert
CREATE OR REPLACE FUNCTION public.assign_customer_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_customer_profile_created
AFTER INSERT ON public.customer_profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_customer_role();

-- Function: assign role on restaurant_partners insert
CREATE OR REPLACE FUNCTION public.assign_restaurant_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'restaurant_partner')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_restaurant_partner_created
AFTER INSERT ON public.restaurant_partners
FOR EACH ROW EXECUTE FUNCTION public.assign_restaurant_role();

-- Function: assign role on delivery_partners insert
CREATE OR REPLACE FUNCTION public.assign_delivery_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'delivery_partner')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_delivery_partner_created
AFTER INSERT ON public.delivery_partners
FOR EACH ROW EXECUTE FUNCTION public.assign_delivery_role();

-- Function: assign admin role on admin_users insert
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_admin_user_created
AFTER INSERT ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();
