
-- ============================================================
-- CAMPUS FOOD DELIVERY - COMPLETE SCHEMA
-- ============================================================

-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'restaurant_partner', 'delivery_partner', 'customer');

-- 2. Outlets table
CREATE TABLE IF NOT EXISTS public.outlets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  cuisine_type text DEFAULT '',
  rating numeric DEFAULT 4.0 CHECK (rating >= 0 AND rating <= 5),
  delivery_time text DEFAULT '30-40 mins',
  is_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. Menu items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL CHECK (price >= 0),
  image_url text DEFAULT '',
  category text DEFAULT 'Main Course',
  is_vegetarian boolean DEFAULT true,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. Customer profiles table
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  age integer,
  gender text,
  city text,
  state text,
  country text,
  mobile_number text,
  mobile_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 5. Restaurant partners table
CREATE TABLE IF NOT EXISTS public.restaurant_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  outlet_id uuid REFERENCES public.outlets(id) ON DELETE SET NULL,
  restaurant_name text NOT NULL,
  contact_phone text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- 6. Delivery partners table
CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  phone text,
  vehicle_type text,
  status text DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  total_deliveries integer DEFAULT 0,
  earnings numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 7. Admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 8. User roles table (CRITICAL - separate from profiles)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 9. Orders table - with user_id and outlet_id for proper filtering
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  outlet_id uuid REFERENCES public.outlets(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  delivery_address text NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  delivery_partner_id uuid REFERENCES public.delivery_partners(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 10. Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  outlet_id uuid NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- SECURITY DEFINER FUNCTION - avoids RLS recursion
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Outlets: public read, admin write
CREATE POLICY "Anyone can view outlets" ON public.outlets FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage outlets" ON public.outlets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Menu items: public read, admin or restaurant write
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage menu items" ON public.menu_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Restaurant partners can manage their menu items" ON public.menu_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_partners rp
      WHERE rp.user_id = auth.uid() AND rp.outlet_id = menu_items.outlet_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurant_partners rp
      WHERE rp.user_id = auth.uid() AND rp.outlet_id = menu_items.outlet_id
    )
  );

-- Customer profiles: own profile only
CREATE POLICY "Users can view their own profile" ON public.customer_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can create their own profile" ON public.customer_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.customer_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.customer_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Restaurant partners
CREATE POLICY "Restaurant partners can view own data" ON public.restaurant_partners FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Restaurant partners can update own data" ON public.restaurant_partners FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Anyone can register as restaurant partner" ON public.restaurant_partners FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all restaurant partners" ON public.restaurant_partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Delivery partners
CREATE POLICY "Delivery partners can view own data" ON public.delivery_partners FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Delivery partners can update own data" ON public.delivery_partners FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Anyone can register as delivery partner" ON public.delivery_partners FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all delivery partners" ON public.delivery_partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin users: only admins can read
CREATE POLICY "Admins can view admin list" ON public.admin_users FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles: users see own roles, admins see all
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orders: customers see own, restaurants see their outlet, delivery sees assigned, admin sees all
CREATE POLICY "Customers can view their own orders" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anonymous users can create orders" ON public.orders FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "Restaurant partners can view their outlet orders" ON public.orders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_partners rp
      WHERE rp.user_id = auth.uid() AND rp.outlet_id = orders.outlet_id
    )
  );
CREATE POLICY "Restaurant partners can update their outlet order status" ON public.orders FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_partners rp
      WHERE rp.user_id = auth.uid() AND rp.outlet_id = orders.outlet_id
    )
  );
CREATE POLICY "Delivery partners can view assigned orders" ON public.orders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.delivery_partners dp
      WHERE dp.user_id = auth.uid() AND dp.id = orders.delivery_partner_id
    )
  );
CREATE POLICY "Delivery partners can view pending orders" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'delivery_partner') AND status IN ('confirmed', 'preparing', 'out_for_delivery'));
CREATE POLICY "Delivery partners can update assigned orders" ON public.orders FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.delivery_partners dp
      WHERE dp.user_id = auth.uid() AND dp.id = orders.delivery_partner_id
    )
  );
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Order items
CREATE POLICY "Customers can view their order items" ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Restaurant can view their outlet order items" ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_partners rp
      WHERE rp.user_id = auth.uid() AND rp.outlet_id = order_items.outlet_id
    )
  );
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Anon can insert order items" ON public.order_items FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_menu_items_outlet_id ON public.menu_items(outlet_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_outlet_id ON public.order_items(outlet_id);
CREATE INDEX IF NOT EXISTS idx_orders_outlet_id ON public.orders(outlet_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
