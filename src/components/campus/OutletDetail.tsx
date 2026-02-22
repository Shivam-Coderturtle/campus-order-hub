import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, Plus, Minus } from 'lucide-react';
import { supabase, Outlet, MenuItem } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';

interface OutletDetailProps {
  outlet: Outlet;
  onBack: () => void;
}

export default function OutletDetail({ outlet, onBack }: OutletDetailProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { cart, addToCart, updateQuantity } = useCart();
  const [itemRatings, setItemRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [outletAvgRating, setOutletAvgRating] = useState<{ avg: number; count: number } | null>(null);

  useEffect(() => {
    fetchMenuItems();
    fetchRatings();
  }, [outlet.id]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('outlet_id', outlet.id)
        .eq('is_available', true)
        .order('category');
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('rating, menu_item_id')
        .eq('outlet_id', outlet.id);
      if (error) throw error;

      const overallRatings: number[] = [];
      const itemGrouped: Record<string, number[]> = {};

      (data || []).forEach(r => {
        if (!r.menu_item_id) {
          overallRatings.push(r.rating);
        } else {
          if (!itemGrouped[r.menu_item_id]) itemGrouped[r.menu_item_id] = [];
          itemGrouped[r.menu_item_id].push(r.rating);
        }
      });

      if (overallRatings.length > 0) {
        setOutletAvgRating({ avg: overallRatings.reduce((a, b) => a + b, 0) / overallRatings.length, count: overallRatings.length });
      }

      const result: Record<string, { avg: number; count: number }> = {};
      Object.entries(itemGrouped).forEach(([id, ratings]) => {
        result[id] = { avg: ratings.reduce((a, b) => a + b, 0) / ratings.length, count: ratings.length };
      });
      setItemRatings(result);
    } catch (err) {
      console.error('Error fetching ratings:', err);
    }
  };

  const categories = ['All', ...new Set(menuItems.map((item) => item.category))];
  const filteredItems = selectedCategory === 'All' ? menuItems : menuItems.filter((i) => i.category === selectedCategory);

  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.find((i) => i.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const displayRating = outletAvgRating ? outletAvgRating.avg.toFixed(1) : (outlet.rating?.toFixed(1) || '4.0');
  const ratingCount = outletAvgRating?.count || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-64 bg-gray-200">
        {outlet.image_url ? (
          <img src={outlet.image_url} alt={outlet.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
            <span className="text-7xl">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <button onClick={onBack}
          className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div className="absolute bottom-4 left-4 text-white">
          <h2 className="text-2xl font-bold">{outlet.name}</h2>
          <div className="flex items-center gap-3 text-sm text-gray-200 mt-1">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {displayRating}
              {ratingCount > 0 && <span className="text-xs">({ratingCount} reviews)</span>}
            </span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{outlet.delivery_time}</span>
            <span>{outlet.cuisine_type}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const qty = getCartQuantity(item.id);
              const ir = itemRatings[item.id];
              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${item.is_vegetarian ? 'border-green-500 bg-green-500' : 'border-red-500 bg-red-500'}`} />
                      <h4 className="font-semibold text-gray-800 truncate">{item.name}</h4>
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-1">{item.description}</p>
                    {ir && (
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-gray-600 font-medium">{ir.avg.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({ir.count})</span>
                      </div>
                    )}
                    <p className="text-orange-500 font-bold">₹{item.price}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {item.image_url && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {qty === 0 ? (
                      <button onClick={() => addToCart(item, outlet.name)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        ADD
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, qty - 1)} className="text-orange-600 hover:text-orange-700">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-bold text-orange-600 min-w-[20px] text-center">{qty}</span>
                        <button onClick={() => addToCart(item, outlet.name)} className="text-orange-600 hover:text-orange-700">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">No items in this category.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
