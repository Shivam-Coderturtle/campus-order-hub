import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, LogOut, Store, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { supabase, Outlet, MenuItem } from '../../lib/supabase';

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'outlets' | 'menu' | 'orders' | 'partners'>('outlets');
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [restaurantPartners, setRestaurantPartners] = useState<any[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', description: '', image_url: '', cuisine_type: '', delivery_time: '',
  });

  const [menuFormData, setMenuFormData] = useState({
    name: '', description: '', price: '', image_url: '', category: '', is_vegetarian: true,
  });

  useEffect(() => {
    if (activeTab === 'outlets') fetchOutlets();
    else if (activeTab === 'menu') fetchMenuItems();
    else if (activeTab === 'orders') fetchOrders();
    else if (activeTab === 'partners') fetchPartners();
  }, [activeTab]);

  const fetchOutlets = async () => {
    setLoading(true);
    const { data } = await supabase.from('outlets').select('*').order('created_at', { ascending: false });
    setOutlets(data || []);
    setLoading(false);
  };

  const fetchMenuItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('menu_items').select('*, outlets(name)').order('created_at', { ascending: false });
    setMenuItems(data || []);
    setLoading(false);
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const fetchPartners = async () => {
    setLoading(true);
    const [{ data: rp }, { data: dp }] = await Promise.all([
      supabase.from('restaurant_partners').select('*'),
      supabase.from('delivery_partners').select('*'),
    ]);
    setRestaurantPartners(rp || []);
    setDeliveryPartners(dp || []);
    setLoading(false);
  };

  const handleCreateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await supabase.from('outlets').update({ ...formData, is_open: true }).eq('id', editingId);
      } else {
        await supabase.from('outlets').insert({ ...formData, is_open: true, rating: 4.0 });
      }
      setFormData({ name: '', description: '', image_url: '', cuisine_type: '', delivery_time: '' });
      setEditingId(null);
      setShowForm(false);
      fetchOutlets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOutlet = async (id: string) => {
    if (!confirm('Delete this outlet? This will remove all its menu items too.')) return;
    await supabase.from('outlets').delete().eq('id', id);
    fetchOutlets();
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutlet) return alert('Please select an outlet first');
    try {
      const payload = {
        ...menuFormData,
        outlet_id: selectedOutlet,
        price: parseFloat(menuFormData.price),
        is_available: true,
      };
      if (editingId) {
        await supabase.from('menu_items').update(payload).eq('id', editingId);
      } else {
        await supabase.from('menu_items').insert(payload);
      }
      setMenuFormData({ name: '', description: '', price: '', image_url: '', category: '', is_vegetarian: true });
      setEditingId(null);
      setShowForm(false);
      fetchMenuItems();
    } catch (err) {
      console.error(err);
    }
  };

  const updatePartnerStatus = async (table: string, id: string, status: string) => {
    await supabase.from(table).update({ status }).eq('id', id);
    fetchPartners();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-orange-100 text-orange-700',
      out_for_delivery: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      available: 'bg-green-100 text-green-700',
      busy: 'bg-orange-100 text-orange-700',
      offline: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const tabs = [
    { key: 'outlets', label: 'Outlets', icon: Store },
    { key: 'menu', label: 'Menu Items', icon: ShoppingBag },
    { key: 'orders', label: 'All Orders', icon: TrendingUp },
    { key: 'partners', label: 'Partners', icon: Users },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 p-2 rounded-lg">
              <Store className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline text-sm">Logout</span>
          </button>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setShowForm(false); setEditingId(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === key ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* OUTLETS TAB */}
        {activeTab === 'outlets' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Manage Outlets</h2>
              <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', description: '', image_url: '', cuisine_type: '', delivery_time: '' }); }}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Plus className="h-4 w-4" /> Add Outlet
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleCreateOutlet} className="bg-white rounded-xl shadow-sm p-5 mb-4 space-y-3">
                <h3 className="font-bold text-gray-800">{editingId ? 'Edit Outlet' : 'New Outlet'}</h3>
                {(['name', 'description', 'image_url', 'cuisine_type', 'delivery_time'] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace('_', ' ')}</label>
                    <input
                      type={field === 'image_url' ? 'url' : 'text'}
                      value={formData[field]}
                      onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      required={field === 'name'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      placeholder={field === 'delivery_time' ? '30-40 mins' : field === 'image_url' ? 'https://...' : ''}
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {outlets.map((outlet) => (
                  <div key={outlet.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="h-32 bg-gray-100 relative">
                      {outlet.image_url ? (
                        <img src={outlet.image_url} alt={outlet.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-gray-800">{outlet.name}</h4>
                      <p className="text-xs text-gray-500">{outlet.cuisine_type} • {outlet.delivery_time}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => { setEditingId(outlet.id); setFormData({ name: outlet.name, description: outlet.description, image_url: outlet.image_url, cuisine_type: outlet.cuisine_type, delivery_time: outlet.delivery_time }); setShowForm(true); }}
                          className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-1.5 rounded-lg text-xs hover:bg-blue-100 transition-colors"
                        >
                          <Edit2 className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOutlet(outlet.id)}
                          className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 py-1.5 rounded-lg text-xs hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* MENU ITEMS TAB */}
        {activeTab === 'menu' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Manage Menu</h2>
              <button onClick={() => { setShowForm(!showForm); setEditingId(null); }}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleCreateMenuItem} className="bg-white rounded-xl shadow-sm p-5 mb-4 space-y-3">
                <h3 className="font-bold text-gray-800">{editingId ? 'Edit Item' : 'New Menu Item'}</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
                  <select
                    value={selectedOutlet}
                    onChange={(e) => setSelectedOutlet(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">Select outlet</option>
                    {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                {([['name', 'text'], ['description', 'text'], ['price', 'number'], ['image_url', 'url'], ['category', 'text']] as const).map(([field, type]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace('_', ' ')}</label>
                    <input
                      type={type}
                      value={menuFormData[field]}
                      onChange={(e) => setMenuFormData({ ...menuFormData, [field]: e.target.value })}
                      required={['name', 'price'].includes(field)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                ))}
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={menuFormData.is_vegetarian} onChange={(e) => setMenuFormData({ ...menuFormData, is_vegetarian: e.target.checked })} />
                  Vegetarian
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
            ) : (
              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                    <div className={`w-2 h-10 rounded-full flex-shrink-0 ${item.is_vegetarian ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category} • ₹{item.price}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => supabase.from('menu_items').delete().eq('id', item.id).then(fetchMenuItems)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4">All Orders ({orders.length})</h2>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">📞 {order.customer_phone}</p>
                        <p className="text-sm text-gray-500 mt-1 max-w-xs truncate">📍 {order.delivery_address}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        <p className="text-orange-500 font-bold mt-1">₹{order.total_amount}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No orders yet.</div>
                )}
              </div>
            )}
          </>
        )}

        {/* PARTNERS TAB */}
        {activeTab === 'partners' && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Restaurant Partners</h2>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {restaurantPartners.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{p.restaurant_name}</p>
                        <p className="text-sm text-gray-500">📞 {p.contact_phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(p.status)}`}>{p.status}</span>
                        {p.status === 'pending' && (
                          <>
                            <button onClick={() => updatePartnerStatus('restaurant_partners', p.id, 'approved')} className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600">Approve</button>
                            <button onClick={() => updatePartnerStatus('restaurant_partners', p.id, 'rejected')} className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600">Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {restaurantPartners.length === 0 && <p className="text-gray-500 text-sm">No restaurant partners.</p>}
                </div>

                <h2 className="text-lg font-bold text-gray-800 mb-4">Delivery Partners</h2>
                <div className="space-y-3">
                  {deliveryPartners.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{p.name}</p>
                        <p className="text-sm text-gray-500">📞 {p.phone} • {p.vehicle_type}</p>
                        <p className="text-xs text-gray-400">{p.total_deliveries} deliveries • ₹{p.earnings} earned</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(p.status)}`}>{p.status}</span>
                    </div>
                  ))}
                  {deliveryPartners.length === 0 && <p className="text-gray-500 text-sm">No delivery partners.</p>}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
