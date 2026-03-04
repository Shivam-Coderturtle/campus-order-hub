
-- Fix ALL RLS policies: drop restrictive ones and recreate as permissive

-- ========== user_roles ==========
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ========== customer_profiles ==========
DROP POLICY IF EXISTS "Users can view their own profile" ON public.customer_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.customer_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.customer_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.customer_profiles;

CREATE POLICY "Users can view their own profile" ON public.customer_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create their own profile" ON public.customer_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.customer_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.customer_profiles
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ========== orders ==========
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery partners can update assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery partners can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery partners can view pending orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant partners can update their outlet order status" ON public.orders;
DROP POLICY IF EXISTS "Restaurant partners can view their outlet orders" ON public.orders;

CREATE POLICY "Customers can view their own orders" ON public.orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Delivery partners can update assigned orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM delivery_partners dp WHERE dp.user_id = auth.uid() AND dp.id = orders.delivery_partner_id));

CREATE POLICY "Delivery partners can view assigned orders" ON public.orders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM delivery_partners dp WHERE dp.user_id = auth.uid() AND dp.id = orders.delivery_partner_id));

CREATE POLICY "Delivery partners can view pending orders" ON public.orders
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'delivery_partner'::app_role) AND status IN ('confirmed', 'preparing', 'out_for_delivery'));

CREATE POLICY "Restaurant partners can update their outlet order status" ON public.orders
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM restaurant_partners rp WHERE rp.user_id = auth.uid() AND rp.outlet_id = orders.outlet_id));

CREATE POLICY "Restaurant partners can view their outlet orders" ON public.orders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM restaurant_partners rp WHERE rp.user_id = auth.uid() AND rp.outlet_id = orders.outlet_id));

-- ========== order_items ==========
DROP POLICY IF EXISTS "Customers can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "Restaurant can view their outlet order items" ON public.order_items;

CREATE POLICY "Customers can view their order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));

CREATE POLICY "Authenticated users can insert order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all order items" ON public.order_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Restaurant can view their outlet order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM restaurant_partners rp WHERE rp.user_id = auth.uid() AND rp.outlet_id = order_items.outlet_id));

-- ========== outlets ==========
DROP POLICY IF EXISTS "Anyone can view outlets" ON public.outlets;
DROP POLICY IF EXISTS "Admins can manage outlets" ON public.outlets;

CREATE POLICY "Anyone can view outlets" ON public.outlets
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage outlets" ON public.outlets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ========== menu_items ==========
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Restaurant partners can manage their menu items" ON public.menu_items;

CREATE POLICY "Anyone can view menu items" ON public.menu_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage menu items" ON public.menu_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Restaurant partners can manage their menu items" ON public.menu_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM restaurant_partners rp WHERE rp.user_id = auth.uid() AND rp.outlet_id = menu_items.outlet_id))
  WITH CHECK (EXISTS (SELECT 1 FROM restaurant_partners rp WHERE rp.user_id = auth.uid() AND rp.outlet_id = menu_items.outlet_id));

-- ========== ratings ==========
DROP POLICY IF EXISTS "Users can view all ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can create their own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.ratings;

CREATE POLICY "Users can view all ratings" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own ratings" ON public.ratings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ratings" ON public.ratings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ========== notifications ==========
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications for their orders" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create notifications for their orders" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    (order_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM orders o WHERE o.id = notifications.order_id AND o.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM orders o JOIN delivery_partners dp ON dp.id = o.delivery_partner_id WHERE o.id = notifications.order_id AND dp.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM orders o JOIN restaurant_partners rp ON rp.outlet_id = o.outlet_id WHERE o.id = notifications.order_id AND rp.user_id = auth.uid())
      OR has_role(auth.uid(), 'admin'::app_role)
    ))
    OR order_id IS NULL
  );

-- ========== delivery_partners ==========
DROP POLICY IF EXISTS "Delivery partners can view own data" ON public.delivery_partners;
DROP POLICY IF EXISTS "Delivery partners can update own data" ON public.delivery_partners;
DROP POLICY IF EXISTS "Anyone can register as delivery partner" ON public.delivery_partners;
DROP POLICY IF EXISTS "Admins can manage all delivery partners" ON public.delivery_partners;

CREATE POLICY "Delivery partners can view own data" ON public.delivery_partners
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Delivery partners can update own data" ON public.delivery_partners
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Anyone can register as delivery partner" ON public.delivery_partners
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all delivery partners" ON public.delivery_partners
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ========== restaurant_partners ==========
DROP POLICY IF EXISTS "Restaurant partners can view own data" ON public.restaurant_partners;
DROP POLICY IF EXISTS "Restaurant partners can update own data" ON public.restaurant_partners;
DROP POLICY IF EXISTS "Anyone can register as restaurant partner" ON public.restaurant_partners;
DROP POLICY IF EXISTS "Admins can manage all restaurant partners" ON public.restaurant_partners;

CREATE POLICY "Restaurant partners can view own data" ON public.restaurant_partners
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Restaurant partners can update own data" ON public.restaurant_partners
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Anyone can register as restaurant partner" ON public.restaurant_partners
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all restaurant partners" ON public.restaurant_partners
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ========== admin_users ==========
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;

CREATE POLICY "Admins can view admin list" ON public.admin_users
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ========== Create missing triggers for role assignment ==========
CREATE OR REPLACE TRIGGER on_customer_profile_created
  AFTER INSERT ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_customer_role();

CREATE OR REPLACE TRIGGER on_restaurant_partner_created
  AFTER INSERT ON public.restaurant_partners
  FOR EACH ROW EXECUTE FUNCTION public.assign_restaurant_role();

CREATE OR REPLACE TRIGGER on_delivery_partner_created
  AFTER INSERT ON public.delivery_partners
  FOR EACH ROW EXECUTE FUNCTION public.assign_delivery_role();

CREATE OR REPLACE TRIGGER on_admin_user_created
  AFTER INSERT ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();
