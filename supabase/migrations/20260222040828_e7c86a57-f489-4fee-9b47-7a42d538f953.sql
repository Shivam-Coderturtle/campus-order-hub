
-- Ratings table for order/item ratings
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz DEFAULT now()
);

-- Unique constraint: one rating per user per order per item (null = overall)
CREATE UNIQUE INDEX idx_ratings_unique ON public.ratings (user_id, order_id, COALESCE(menu_item_id, '00000000-0000-0000-0000-000000000000'));

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users can create their own ratings" ON public.ratings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own ratings" ON public.ratings FOR UPDATE USING (user_id = auth.uid());

-- Enable realtime for ratings
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
