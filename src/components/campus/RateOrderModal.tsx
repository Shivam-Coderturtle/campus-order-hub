import { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OrderItemForRating {
  menu_item_id: string | null;
  item_name: string;
}

interface RateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  outletId: string;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}>
          <Star className={`h-6 w-6 transition-colors ${
            s <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`} />
        </button>
      ))}
    </div>
  );
}

export default function RateOrderModal({ isOpen, onClose, orderId, outletId }: RateOrderModalProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [overallReview, setOverallReview] = useState('');
  const [items, setItems] = useState<OrderItemForRating[]>([]);
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      supabase.from('order_items').select('menu_item_id, item_name').eq('order_id', orderId)
        .then(({ data }) => setItems(data || []));
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (overallRating === 0) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Overall rating
      const ratingsToInsert: any[] = [{
        user_id: user.id, order_id: orderId, outlet_id: outletId,
        menu_item_id: null, rating: overallRating, review: overallReview || null,
      }];

      // Item ratings
      items.forEach(item => {
        if (item.menu_item_id && itemRatings[item.menu_item_id]) {
          ratingsToInsert.push({
            user_id: user.id, order_id: orderId, outlet_id: outletId,
            menu_item_id: item.menu_item_id, rating: itemRatings[item.menu_item_id], review: null,
          });
        }
      });

      const { error } = await supabase.from('ratings').upsert(ratingsToInsert);
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('Rating error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Thanks for your feedback!</h3>
          <button onClick={onClose} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-gray-800">Rate Your Order</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <p className="font-semibold text-gray-700 mb-2">Overall Experience</p>
            <StarRating value={overallRating} onChange={setOverallRating} />
            <textarea value={overallReview} onChange={(e) => setOverallReview(e.target.value)}
              placeholder="Share your experience (optional)..." rows={2}
              className="w-full mt-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
          </div>

          {items.length > 0 && (
            <div>
              <p className="font-semibold text-gray-700 mb-3">Rate Individual Items</p>
              <div className="space-y-3">
                {items.filter(i => i.menu_item_id).map(item => (
                  <div key={item.menu_item_id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate mr-3">{item.item_name}</span>
                    <StarRating value={itemRatings[item.menu_item_id!] || 0}
                      onChange={(v) => setItemRatings(prev => ({ ...prev, [item.menu_item_id!]: v }))} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || overallRating === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold transition-colors">
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}
