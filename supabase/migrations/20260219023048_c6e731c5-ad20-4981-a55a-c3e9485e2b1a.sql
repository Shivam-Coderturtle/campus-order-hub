
-- Fix: Remove overly permissive anonymous insert policies 
-- and tighten order_items insert policy
DROP POLICY IF EXISTS "Anonymous users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anon can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;

-- Authenticated users only can place orders
CREATE POLICY "Authenticated users can create orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Authenticated users can insert order items for their own orders
CREATE POLICY "Authenticated users can insert order items" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
