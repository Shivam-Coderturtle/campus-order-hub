import { useState, useEffect } from 'react';
import { Search, Star, Clock } from 'lucide-react';
import { supabase, Outlet } from '../../lib/supabase';

interface HomeProps {
  onSelectOutlet: (outlet: Outlet) => void;
}

export default function Home({ onSelectOutlet }: HomeProps) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [filteredOutlets, setFilteredOutlets] = useState<Outlet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutlets();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOutlets(outlets);
    } else {
      const filtered = outlets.filter(
        (outlet) =>
          outlet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          outlet.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOutlets(filtered);
    }
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
              placeholder="Search restaurants or cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
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
                      <img
                        src={outlet.image_url}
                        alt={outlet.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
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
                      {outlet.rating}
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
