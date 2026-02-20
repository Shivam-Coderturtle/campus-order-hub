import { useState, useEffect } from 'react';
import { MapPin, Phone, Package, CheckCircle, LogOut, Bike, User, IndianRupee, Clock, Power, Bell, Store } from 'lucide-react';
import { supabase, DeliveryPartner, Order } from '../../lib/supabase';
import NotificationBell from './NotificationBell';

interface DeliveryPartnerDashboardProps {
  onLogout: () => void;
  showToggle: boolean;
  onToggleView: () => void;
}

interface OrderWithDetails extends Order {
  outlet_name?: string;
  order_items?: { item_name: string; quantity: number; price: number }[];
}

export default function DeliveryPartnerDashboard({ onLogout, showToggle, onToggleView }: DeliveryPartnerDashboardProps) {
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [availableOrders, setAvailableOrders] = useState<OrderWithDetails[]>([]);
  const [myOrders, setMyOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my_orders'>('available');
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(false);

  useEffect(() => {
    fetchPartnerData();

    // Realtime subscription for order changes
    const channel = supabase
      .channel('delivery-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchPartnerData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPartnerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: partnerData, error } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setPartner(partnerData);
      setIsAcceptingOrders(partnerData?.is_accepting_orders || false);

      // Fetch available orders with outlet names and items
      const { data: available } = await supabase
        .from('orders')
        .select('*, outlets(name), order_items(item_name, quantity, price)')
        .in('status', ['pending'])
        .is('delivery_partner_id', null)
        .order('created_at', { ascending: false });

      const mappedAvailable = (available || []).map((o: any) => ({
        ...o,
        outlet_name: o.outlets?.name || 'Unknown Outlet',
        order_items: o.order_items || [],
      }));
      setAvailableOrders(mappedAvailable);

      // Fetch my assigned orders with details
      if (partnerData) {
        const { data: mine } = await supabase
          .from('orders')
          .select('*, outlets(name), order_items(item_name, quantity, price)')
          .eq('delivery_partner_id', partnerData.id)
          .order('created_at', { ascending: false });

        const mappedMine = (mine || []).map((o: any) => ({
          ...o,
          outlet_name: o.outlets?.name || 'Unknown Outlet',
          order_items: o.order_items || [],
        }));
        setMyOrders(mappedMine);
      }
    } catch (error) {
      console.error('Error fetching partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAcceptingOrders = async () => {
    if (!partner) return;
    const newValue = !isAcceptingOrders;
    try {
      await supabase
        .from('delivery_partners')
        .update({ is_accepting_orders: newValue, status: newValue ? 'available' : 'offline' })
        .eq('id', partner.id);

      setIsAcceptingOrders(newValue);
      setPartner(prev => prev ? { ...prev, is_accepting_orders: newValue, status: newValue ? 'available' : 'offline' } : null);
    } catch (error) {
      console.error('Error toggling accepting orders:', error);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!partner) return;
    try {
      // Delivery partner accepts → order moves to 'confirmed'
      await supabase
        .from('orders')
        .update({ delivery_partner_id: partner.id, status: 'confirmed' })
        .eq('id', orderId);

      await supabase
        .from('delivery_partners')
        .update({ status: 'busy' })
        .eq('id', partner.id);

      // Get order details for notifications
      const order = availableOrders.find(o => o.id === orderId);
      if (order) {
        // Notify customer that delivery partner has been assigned
        await supabase.from('notifications').insert({
          user_id: order.user_id!,
          title: '🚴 Delivery Partner Assigned!',
          message: `${partner.name} will deliver your order from ${order.outlet_name}. Phone: ${partner.phone || 'N/A'}`,
          type: 'delivery_assigned',
          order_id: orderId,
        });

        // Notify restaurant to start preparing (find restaurant partner user_id)
        if (order.outlet_id) {
          const { data: restPartner } = await supabase
            .from('restaurant_partners')
            .select('user_id')
            .eq('outlet_id', order.outlet_id)
            .maybeSingle();

          if (restPartner) {
            await supabase.from('notifications').insert({
              user_id: restPartner.user_id,
              title: '📦 New Order to Prepare!',
              message: `Order from ${order.customer_name} - ₹${order.total_amount}. Delivery partner assigned: ${partner.name}. Please start preparing.`,
              type: 'restaurant_notified',
              order_id: orderId,
            });
          }
        }
      }

      fetchPartnerData();
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    if (!partner) return;
    try {
      await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId);

      await supabase
        .from('delivery_partners')
        .update({
          status: isAcceptingOrders ? 'available' : 'offline',
          total_deliveries: (partner.total_deliveries || 0) + 1,
          earnings: (partner.earnings || 0) + 50,
        })
        .eq('id', partner.id);

      // Notify customer
      const order = myOrders.find(o => o.id === orderId);
      if (order?.user_id) {
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          title: '✅ Order Delivered!',
          message: `Your order from ${order.outlet_name} has been delivered. Enjoy your meal!`,
          type: 'order_delivered',
          order_id: orderId,
        });
      }

      fetchPartnerData();
    } catch (error) {
      console.error('Error marking delivered:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-orange-100 text-orange-700',
      out_for_delivery: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Bike className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Delivery Dashboard</h1>
              <p className="text-xs text-gray-500">{partner?.name || 'Partner'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {showToggle && (
              <button
                onClick={onToggleView}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Customer</span>
              </button>
            )}
            <button onClick={onLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Accept Orders Toggle */}
        <div className={`rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm ${isAcceptingOrders ? 'bg-green-50 border border-green-200' : 'bg-gray-100 border border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Power className={`h-6 w-6 ${isAcceptingOrders ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className={`font-bold ${isAcceptingOrders ? 'text-green-700' : 'text-gray-600'}`}>
                {isAcceptingOrders ? 'You are Online' : 'You are Offline'}
              </p>
              <p className="text-xs text-gray-500">
                {isAcceptingOrders ? 'You will receive new delivery orders' : 'Toggle on to start receiving orders'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleAcceptingOrders}
            className={`relative w-14 h-7 rounded-full transition-colors ${isAcceptingOrders ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isAcceptingOrders ? 'translate-x-7' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        {partner && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <Package className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-800">{partner.total_deliveries}</p>
              <p className="text-xs text-gray-500">Total Deliveries</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <IndianRupee className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-800">₹{partner.earnings}</p>
              <p className="text-xs text-gray-500">Earnings</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <CheckCircle className={`h-6 w-6 mx-auto mb-1 ${isAcceptingOrders ? 'text-green-500' : 'text-gray-400'}`} />
              <p className="text-2xl font-bold text-gray-800 capitalize">{partner.status}</p>
              <p className="text-xs text-gray-500">Status</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'available' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            Available Orders ({availableOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('my_orders')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'my_orders' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            My Orders ({myOrders.length})
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {activeTab === 'available' && (
            !isAcceptingOrders ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                <Power className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">You are currently offline</p>
                <p className="text-sm mt-1">Toggle the switch above to start receiving orders</p>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No available orders right now</p>
              </div>
            ) : availableOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-800">{order.customer_name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />{order.customer_phone}
                    </p>
                  </div>
                  <span className="text-orange-500 font-bold text-lg">₹{order.total_amount}</span>
                </div>

                {/* Outlet Name */}
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-700">
                  <Store className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{order.outlet_name}</span>
                </div>

                {/* Delivery Address */}
                <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                  <MapPin className="h-4 w-4 text-red-400" />{order.delivery_address}
                </p>

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

                <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                  <Clock className="h-3 w-3" />
                  {new Date(order.created_at).toLocaleString()}
                </p>

                <button
                  onClick={() => handleAcceptOrder(order.id)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Accept & Deliver
                </button>
              </div>
            ))
          )}

          {activeTab === 'my_orders' && (
            myOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No orders assigned yet</p>
              </div>
            ) : myOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-800">{order.customer_name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />{order.customer_phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-orange-500 font-bold mt-1">₹{order.total_amount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2 text-sm text-gray-700">
                  <Store className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{order.outlet_name}</span>
                </div>

                <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                  <MapPin className="h-4 w-4 text-red-400" />{order.delivery_address}
                </p>

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

                {(order.status === 'confirmed' || order.status === 'preparing' || order.status === 'out_for_delivery') && (
                  <>
                    {order.status !== 'out_for_delivery' && (
                      <button
                        onClick={async () => {
                          await supabase.from('orders').update({ status: 'out_for_delivery' }).eq('id', order.id);
                          fetchPartnerData();
                        }}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-2"
                      >
                        <Bike className="h-4 w-4" /> Picked Up - Out for Delivery
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => handleDeliverOrder(order.id)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" /> Mark as Delivered
                      </button>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
