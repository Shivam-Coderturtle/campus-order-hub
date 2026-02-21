import { useState, useEffect } from 'react';
import { CartProvider } from '../context/CartContext';
import { supabase, UserRole, Outlet } from '../lib/supabase';
import Header from '../components/campus/Header';
import Home from '../components/campus/Home';
import OutletDetail from '../components/campus/OutletDetail';
import CartSidebar from '../components/campus/CartSidebar';
import CheckoutModal from '../components/campus/CheckoutModal';
import CustomerAuth from '../components/campus/CustomerAuth';
import CustomerSettings from '../components/campus/CustomerSettings';
import DeliveryPartnerDashboard from '../components/campus/DeliveryPartnerDashboard';
import RestaurantPartnerDashboard from '../components/campus/RestaurantPartnerDashboard';
import AdminPanel from '../components/campus/AdminPanel';

export default function Index() {
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'customer' | 'delivery_partner' | 'settings'>('customer');
  const [isAlsoDeliveryPartner, setIsAlsoDeliveryPartner] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event) => {
      await checkUserRole();
    });
    checkUserRole();
    return () => subscription?.unsubscribe();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole(null);
        setIsAlsoDeliveryPartner(false);
        setAuthLoading(false);
        return;
      }

      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching roles:', error);
        setUserRole(null);
        setAuthLoading(false);
        return;
      }

      const roleList = (roles || []).map((r: { role: string }) => r.role);

      if (roleList.includes('admin')) {
        setUserRole('admin');
      } else if (roleList.includes('restaurant_partner')) {
        setUserRole('restaurant_partner');
      } else if (roleList.includes('delivery_partner') && roleList.includes('customer')) {
        setIsAlsoDeliveryPartner(true);
        setUserRole('customer');
      } else if (roleList.includes('delivery_partner')) {
        setUserRole('delivery_partner');
      } else if (roleList.includes('customer')) {
        setUserRole('customer');
      } else {
        setUserRole(null);
      }

      setAuthLoading(false);
    } catch (error) {
      console.error('Error checking user role:', error);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setIsAlsoDeliveryPartner(false);
    setViewMode('customer');
    setSelectedOutlet(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userRole) return <CustomerAuth onAuthSuccess={checkUserRole} />;
  if (userRole === 'admin') return <AdminPanel onLogout={handleLogout} />;
  if (userRole === 'restaurant_partner') return <RestaurantPartnerDashboard onLogout={handleLogout} />;
  if (userRole === 'delivery_partner' && !isAlsoDeliveryPartner) {
    return <DeliveryPartnerDashboard onLogout={handleLogout} showToggle={false} onToggleView={() => {}} />;
  }
  if (viewMode === 'delivery_partner') {
    return (
      <DeliveryPartnerDashboard
        onLogout={handleLogout}
        showToggle={isAlsoDeliveryPartner}
        onToggleView={() => setViewMode('customer')}
      />
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Header
          onCartClick={() => setIsCartOpen(true)}
          onLogout={handleLogout}
          showDeliveryToggle={isAlsoDeliveryPartner}
          onSwitchToDelivery={() => setViewMode('delivery_partner')}
          onSettingsClick={() => { setViewMode('settings'); setSelectedOutlet(null); }}
        />
        {viewMode === 'settings' ? (
          <CustomerSettings onBack={() => setViewMode('customer')} onLogout={handleLogout} />
        ) : selectedOutlet ? (
          <OutletDetail outlet={selectedOutlet} onBack={() => { setSelectedOutlet(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        ) : (
          <Home onSelectOutlet={(outlet) => { setSelectedOutlet(outlet); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        )}
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} />
        <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      </div>
    </CartProvider>
  );
}
