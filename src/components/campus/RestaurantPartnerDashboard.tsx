import { useState, useEffect } from 'react';
import { ShoppingBag, Clock, CheckCircle, TrendingUp, LogOut, Store, Package } from 'lucide-react';
import { supabase, RestaurantPartner, Order } from '../../lib/supabase';
import NotificationBell from './NotificationBell';

interface RestaurantPartnerDashboardProps {
  onLogout: () => void;
}

interface OrderWithItems extends Order {
  order_items?: { item_name: string; quantity: number; price: number }[];
  delivery_partner_name?: string;
}

export default function RestaurantPartnerDashboard({ onLogout }: RestaurantPartnerDashboardProps) {
  const [partner, setPartner] = useState<RestaurantPartner | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('restaurant-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        // Refresh when new notifications come in (e.g., delivery partner accepted)
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    await fetchPartnerData();
    setLoading(false);
  };

  const fetchPartnerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: partnerData, error } = await supabase
        .from('restaurant_partners')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setPartner(partnerData);

      if (partnerData?.outlet_id) {
        await fetchOrdersForOutlet(partnerData.outlet_id);
      }
    } catch (error) {
      console.error('Error fetching partner data:', error);
    }
  };

  const fetchOrders = async () => {
    if (partner?.outlet_id) await fetchOrdersForOutlet(partner.outlet_id);
  };

  const fetchOrdersForOutlet = async (outletId: string) => {
    try {
      // Only show orders that have been confirmed (delivery partner accepted)
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(item_name, quantity, price), delivery_partners(name, phone)')
        .eq('outlet_id', outletId)
        .in('status', ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((o: any) => ({
        ...o,
        order_items: o.order_items || [],
        delivery_partner_name: o.delivery_partners?.name || null,
      }));
      setOrders(mapped);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Notify customer when restaurant accepts/starts preparing
      const order = orders.find(o => o.id === orderId);
      if (order?.user_id && newStatus === 'preparing') {
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          title: '🍳 Order Being Prepared!',
          message: `Your order is now being prepared! Delivery by: ${order.delivery_partner_name || 'Assigned partner'}. Items: ${(order.order_items || []).map(i => `${i.item_name}×${i.quantity}`).join(', ')}. Total: ₹${order.total_amount}`,
          type: 'order_accepted',
          order_id: orderId,
        });
      }

      await fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
      preparing: 'bg-orange-100 text-orange-700 border-orange-200',
      out_for_delivery: 'bg-purple-100 text-purple-700 border-purple-200',
      delivered: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Restaurant flow: confirmed → preparing → ready (out_for_delivery handled by delivery partner)
  const getNextStatus = (status: string): string | null => {
    const flow: Record<string, string> = {
      confirmed: 'preparing',
    };
    return flow[status] || null;
  };

  const getNextStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      confirmed: 'Accept & Start Preparing',
    };
    return labels[status] || '';
  };

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const historyOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <Store className="h-16 w-16 text-orange-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Restaurant Profile Not Found</h2>
          <p className="text-gray-500 mb-4 text-sm">Your account doesn't have an active restaurant partner profile.</p>
          <button onClick={onLogout} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{partner.restaurant_name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                partner.status === 'approved' ? 'bg-green-100 text-green-700' :
                partner.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {partner.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={onLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <ShoppingBag className="h-6 w-6 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800">{activeOrders.length}</p>
            <p className="text-xs text-gray-500">Active Orders</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800">{historyOrders.filter(o => o.status === 'delivered').length}</p>
            <p className="text-xs text-gray-500">Delivered</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800">₹{totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Revenue</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'active' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            Active Orders ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'history' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            History ({historyOrders.length})
          </button>
        </div>

        {/* Orders */}
        <div className="space-y-4">
          {(activeTab === 'active' ? activeOrders : historyOrders).map((order) => {
            const nextStatus = getNextStatus(order.status);
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-800">{order.customer_name}</p>
                    <p className="text-sm text-gray-500">📞 {order.customer_phone}</p>
                    <p className="text-sm text-gray-500 mt-1">📍 {order.delivery_address}</p>
                    {order.delivery_partner_name && (
                      <p className="text-sm text-blue-600 mt-1">🚴 Delivery: {order.delivery_partner_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-orange-500 font-bold mt-2">₹{order.total_amount}</p>
                  </div>
                </div>

                {/* Order Items */}
                {order.order_items && order.order_items.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">ORDER ITEMS</p>
                    {order.order_items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-gray-700">
                        <span>{item.item_name} × {item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(order.created_at).toLocaleString()}
                </p>
                {nextStatus && (
                  <button
                    onClick={() => updateOrderStatus(order.id, nextStatus)}
                    disabled={updatingOrder === order.id}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium text-sm transition-colors"
                  >
                    {updatingOrder === order.id ? 'Updating...' : getNextStatusLabel(order.status)}
                  </button>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    disabled={updatingOrder === order.id}
                    className="w-full mt-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-medium text-sm transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            );
          })}

          {(activeTab === 'active' ? activeOrders : historyOrders).length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{activeTab === 'active' ? 'No active orders — orders appear here after a delivery partner accepts them' : 'No order history yet'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
