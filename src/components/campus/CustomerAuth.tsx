import { useState, useEffect } from 'react';
import { Phone, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { lovable } from '@/integrations/lovable/index';

interface CustomerAuthProps {
  onAuthSuccess: () => void;
  onGoToLanding?: () => void;
}

type Step = 'google' | 'mobile_verify';

export default function CustomerAuth({ onAuthSuccess, onGoToLanding }: CustomerAuthProps) {
  const [step, setStep] = useState<Step>('google');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // After Google sign-in, check if profile exists — if yes skip to home, if no ask for mobile
  useEffect(() => {
    const checkProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('id, mobile_verified')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profile?.mobile_verified) {
        onAuthSuccess();
      } else {
        setStep('mobile_verify');
      }
    };
    checkProfile();
  }, [onAuthSuccess]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        throw result.error;
      }
      // If redirected, the page will reload and useEffect will pick up the session
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!mobileNumber.match(/^\d{10}$/)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setSuccessMsg(`A verification code has been sent to +91${mobileNumber}. For demo, enter 123456.`);
  };

  const handleVerifyMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mobileOtp !== '123456') throw new Error('Invalid OTP. For demo, use 123456.');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: profileError } = await supabase.from('customer_profiles').upsert({
        user_id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        mobile_number: mobileNumber,
        mobile_verified: true,
      });
      if (profileError) throw profileError;

      onAuthSuccess();
    } catch (err) {
      console.error('Verify Error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">

        {step === 'google' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                CampusEats
              </h1>
              <p className="text-gray-600 mt-2">Sign in to order your favourite food</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            {onGoToLanding && (
              <button onClick={onGoToLanding} className="w-full mt-6 text-gray-400 hover:text-gray-600 text-sm">
                ← Back to home
              </button>
            )}
          </>
        )}

        {step === 'mobile_verify' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Verify Your Mobile</h2>
              <p className="text-gray-500 text-sm mt-2">One last step — verify your mobile number to start ordering</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{successMsg}</div>}

            {!successMsg ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+91</span>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2"
                >
                  Send OTP <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyMobile} className="space-y-4">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={mobileOtp}
                  onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                />
                <button
                  type="submit"
                  disabled={loading || mobileOtp.length !== 6}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Start Ordering'}
                </button>
                <button
                  type="button"
                  onClick={() => { setSuccessMsg(''); setMobileOtp(''); }}
                  className="w-full text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Change number
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
