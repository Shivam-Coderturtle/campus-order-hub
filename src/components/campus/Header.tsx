import { ShoppingCart, UtensilsCrossed, LogOut, Bike, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface HeaderProps {
  onCartClick: () => void;
  onLogout: () => void;
  showDeliveryToggle: boolean;
  onSwitchToDelivery: () => void;
}

export default function Header({ onCartClick, onLogout, showDeliveryToggle, onSwitchToDelivery }: HeaderProps) {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
              <UtensilsCrossed className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                CampusEats
              </h1>
              <p className="text-xs text-gray-500 -mt-1">Quick campus delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {showDeliveryToggle && (
              <button
                onClick={onSwitchToDelivery}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Bike className="h-4 w-4" />
                <span className="hidden sm:inline">Delivery Partner</span>
              </button>
            )}

            {showDeliveryToggle && (
              <button
                className="flex items-center gap-2 bg-orange-100 text-orange-600 px-3 py-2 rounded-lg text-sm font-medium"
                disabled
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Customer</span>
              </button>
            )}

            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
