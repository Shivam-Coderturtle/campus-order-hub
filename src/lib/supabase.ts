import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export interface Outlet {
  id: string;
  name: string;
  description: string;
  image_url: string;
  cuisine_type: string;
  rating: number;
  delivery_time: string;
  is_open: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  outlet_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_vegetarian: boolean;
  is_available: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  outlet_id: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  delivery_partner_id: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  outlet_id: string;
  item_name: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
  outlet_name: string;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  mobile_number: string | null;
  mobile_verified: boolean;
  created_at: string;
}

export interface RestaurantPartner {
  id: string;
  user_id: string;
  outlet_id: string | null;
  restaurant_name: string;
  contact_phone: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface DeliveryPartner {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  vehicle_type: string | null;
  status: 'available' | 'busy' | 'offline';
  total_deliveries: number;
  earnings: number;
  created_at: string;
}

export type AppRole = 'admin' | 'restaurant_partner' | 'delivery_partner' | 'customer';
export type UserRole = AppRole | null;
