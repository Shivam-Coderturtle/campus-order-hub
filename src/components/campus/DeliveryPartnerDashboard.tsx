import { useState, useEffect } from 'react';
import { MapPin, Phone, Package, CheckCircle, LogOut, Bike, User, IndianRupee, Clock } from 'lucide-react';
import { supabase, DeliveryPartner, Order } from '../../lib/supabase';

interface DeliveryPartnerDashboardProps {
  onLogout: () => void;
  showToggle: boolean;
  onToggleView: () => void;
}

export default function DeliveryPartnerDashboard({ onLogout, showToggle, onToggleView }: DeliveryPartnerDashboardProps) {
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my_orders'>('available');

  useEffect(() => {
    fetchPartnerData();
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

      // Fetch available orders (confirmed/preparing, not yet assigned)
      const { data: available } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['confirmed', 'preparing'])
        .is('delivery_partner_id', null)
        .order('created_at', { ascending: false });

      setAvailableOrders(available || []);

      // Fetch my assigned orders
      if (partnerData) {
        const { data: mine } = await supabase
          .from('orders')
          .select('*')
          .eq('delivery_partner_id', partnerData.id)
          .order('created_at', { ascending: false });
        setMyOrders(mine || []);
      }
    } catch (error) {
      console.error('Error fetching partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!partner) return;
    try {
      await supabase
        .from('orders')
        .update({ delivery_partner_id: partner.id, status: 'out_for_delivery' })
        .eq('id', orderId);

      await supabase
        .from('delivery_partners')
        .update({ status: 'busy' })
        .eq('id', partner.id);

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

      // Increment total deliveries and earnings (₹50 per delivery)
      await supabase
        .from('delivery_partners')
        .update({
          status: 'available',
          total_deliveries: (partner.total_deliveries || 0) + 1,
          earnings: (partner.earnings || 0) + 50,
        })
        .eq('id', partner.id);

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
            {showToggle && (
              <button
                onClick={onToggleView}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Switch to Customer</span>
              </button>
            )}
            <button onClick={onLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
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
              <CheckCircle className="h-6 w-6 text-orange-500 mx-auto mb-1" />
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
            availableOrders.length === 0 ? (
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
                  <span className="text-orange-500 font-bold">₹{order.total_amount}</span>
                </div>
                <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                  <MapPin className="h-4 w-4 text-red-400" />{order.delivery_address}
                </p>
                <button
                  onClick={() => handleAcceptOrder(order.id)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Accept Order
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
                      {order.status.replace('_', ' ')}
                    </span>
                    <p className="text-orange-500 font-bold mt-1">₹{order.total_amount}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                  <MapPin className="h-4 w-4 text-red-400" />{order.delivery_address}
                </p>
                {order.status === 'out_for_delivery' && (
                  <button
                    onClick={() => handleDeliverOrder(order.id)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" /> Mark as Delivered
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
