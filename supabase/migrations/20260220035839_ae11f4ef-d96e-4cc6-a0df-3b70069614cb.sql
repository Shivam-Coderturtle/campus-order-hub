
-- Fix overly permissive notification insert policy
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Only allow inserting notifications for orders the user is involved in
CREATE POLICY "Users can create notifications for their orders"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if the notification is about an order the user is involved in (as customer, delivery partner, or restaurant)
  (order_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM orders o JOIN delivery_partners dp ON dp.id = o.delivery_partner_id WHERE o.id = order_id AND dp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM orders o JOIN restaurant_partners rp ON rp.outlet_id = o.outlet_id WHERE o.id = order_id AND rp.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  ))
  OR order_id IS NULL
);
