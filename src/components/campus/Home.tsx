import { useState, useEffect } from 'react';
import { Search, Star, Clock } from 'lucide-react';
import { supabase, Outlet } from '../../lib/supabase';

interface HomeProps {
  onSelectOutlet: (outlet: Outlet) => void;
}

const FOOD_CATEGORIES = [
  { label: 'Biryani', emoji: '🍚', search: 'biryani' },
  { label: 'Pizza', emoji: '🍕', search: 'pizza' },
  { label: 'Burger', emoji: '🍔', search: 'burger' },
  { label: 'Momos', emoji: '🥟', search: 'momos' },
  { label: 'Rolls', emoji: '🌯', search: 'roll' },
  { label: 'Thali', emoji: '🍱', search: 'thali' },
  { label: 'Noodles', emoji: '🍜', search: 'noodles' },
  { label: 'Dessert', emoji: '🍰', search: 'dessert' },
];

export default function Home({ onSelectOutlet }: HomeProps) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [filteredOutlets, setFilteredOutlets] = useState<Outlet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [outletRatings, setOutletRatings] = useState<Record<string, { avg: number; count: number }>>({});

  useEffect(() => {
    fetchOutlets();
    fetchRatings();
  }, []);

  useEffect(() => {
    filterOutlets(searchQuery);
  }, [searchQuery, outlets]);

  const fetchOutlets = async () => {
    try {
      const { data, error } = await supabase
        .from('outlets')
        .select('*')
        .order('rating', { ascending: false });
      if (error) throw error;
      setOutlets(data || []);
      setFilteredOutlets(data || []);
    } catch (error) {
      console.error('Error fetching outlets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('outlet_id, rating, menu_item_id');
      if (error) throw error;
      // Only overall ratings (no menu_item_id)
      const overallRatings = (data || []).filter(r => !r.menu_item_id);
      const grouped: Record<string, number[]> = {};
      overallRatings.forEach(r => {
        if (!grouped[r.outlet_id]) grouped[r.outlet_id] = [];
        grouped[r.outlet_id].push(r.rating);
      });
      const result: Record<string, { avg: number; count: number }> = {};
      Object.entries(grouped).forEach(([id, ratings]) => {
        result[id] = { avg: ratings.reduce((a, b) => a + b, 0) / ratings.length, count: ratings.length };
      });
      setOutletRatings(result);
    } catch (err) {
      console.error('Error fetching ratings:', err);
    }
  };

  const filterOutlets = async (query: string) => {
    if (query.trim() === '') {
      setFilteredOutlets(outlets);
      return;
    }

    const q = query.toLowerCase();
    // First filter by outlet name/cuisine
    const byOutlet = outlets.filter(
      (o) => o.name.toLowerCase().includes(q) || o.cuisine_type.toLowerCase().includes(q)
    );

    // Also search menu_items for matching food names
    try {
      const { data: menuMatches } = await supabase
        .from('menu_items')
        .select('outlet_id')
        .ilike('name', `%${query}%`);
      
      const matchedOutletIds = new Set((menuMatches || []).map(m => m.outlet_id));
      const byMenu = outlets.filter(o => matchedOutletIds.has(o.id) && !byOutlet.find(bo => bo.id === o.id));
      setFilteredOutlets([...byOutlet, ...byMenu]);
    } catch {
      setFilteredOutlets(byOutlet);
    }
  };

  const getDisplayRating = (outlet: Outlet) => {
    const r = outletRatings[outlet.id];
    if (r && r.count > 0) return r.avg.toFixed(1);
    return outlet.rating?.toFixed(1) || '4.0';
  };

  const getRatingCount = (outletId: string) => {
    return outletRatings[outletId]?.count || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Hungry? 🍕</h2>
          <p className="text-orange-100 mb-6">Order food from your campus outlets</p>
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search restaurants or food items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Food category chips */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {FOOD_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setSearchQuery(cat.search)}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-all min-w-[72px] ${
                searchQuery === cat.search
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:shadow'
              }`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-medium whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredOutlets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No restaurants found.</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {searchQuery ? `Results for "${searchQuery}"` : 'All Restaurants'} ({filteredOutlets.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOutlets.map((outlet) => (
                <div
                  key={outlet.id}
                  onClick={() => onSelectOutlet(outlet)}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {outlet.image_url ? (
                      <img src={outlet.image_url} alt={outlet.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
                        <span className="text-5xl">🍽️</span>
                      </div>
                    )}
                    {!outlet.is_open && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Closed</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white rounded-full px-2 py-1 flex items-center gap-1 text-sm font-medium shadow">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {getDisplayRating(outlet)}
                      {getRatingCount(outlet.id) > 0 && (
                        <span className="text-gray-400 text-xs">({getRatingCount(outlet.id)})</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-gray-800 text-lg">{outlet.name}</h4>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{outlet.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                        {outlet.cuisine_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {outlet.delivery_time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
