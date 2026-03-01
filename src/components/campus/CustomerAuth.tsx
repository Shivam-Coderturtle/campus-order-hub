import { useState } from 'react';
import { Mail, Lock, Phone, User, ArrowRight, MapPin, Calendar, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CustomerAuthProps {
  onAuthSuccess: () => void;
  onGoToLanding?: () => void;
}

type Step = 'auth' | 'profile' | 'mobile_verify';

export default function CustomerAuth({ onAuthSuccess, onGoToLanding }: CustomerAuthProps) {
  const [step, setStep] = useState<Step>('auth');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const isTransientAuthError = (err: unknown) => {
    if (!(err instanceof Error)) return false;
    const msg = err.message.toLowerCase();
    return msg.includes('failed to fetch') || msg.includes('network') || err.name === 'TypeError';
  };

  const withRetry = async <T,>(operation: () => Promise<T>, retries = 2): Promise<T> => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (!isTransientAuthError(error) || attempt === retries) break;
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
    throw lastError;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');

        const { data, error: signUpError } = await withRetry(() => supabase.auth.signUp({ email, password }));
        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('Failed to create user');

        // Auto-confirmed — go straight to profile
        setStep('profile');
      } else {
        const { data, error: signInError } = await withRetry(() =>
          supabase.auth.signInWithPassword({ email, password })
        );
        if (signInError) throw signInError;
        if (!data.user) throw new Error('No user data returned');
        onAuthSuccess();
      }
    } catch (err) {
      if (isTransientAuthError(err)) {
        setError('Temporary network issue. Please retry in a few seconds.');
      } else {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required'); return; }
    if (!mobileNumber.match(/^\d{10}$/)) { setError('Please enter a valid 10-digit mobile number'); return; }

    setLoading(true);
    try {
      setSuccessMsg(`A verification code has been sent to +91${mobileNumber}. For demo, enter 123456.`);
      setStep('mobile_verify');
    } finally {
      setLoading(false);
    }
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
        name: name.trim(),
        age: age ? parseInt(age) : null,
        gender: gender || null,
        city: city || null,
        state: state || null,
        country: country || null,
        mobile_number: mobileNumber,
        mobile_verified: true,
      });
      if (profileError) throw profileError;

      onAuthSuccess();
    } catch (err) {
      console.error('Profile Error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const stepIndicator = (currentStep: Step) => {
    const steps = [
      { key: 'auth', label: 'Account' },
      { key: 'profile', label: 'Profile' },
      { key: 'mobile_verify', label: 'Verify Mobile' },
    ];
    const currentIdx = steps.findIndex(s => s.key === currentStep);

    return (
      <div className="flex items-center justify-center gap-1 mb-6">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              idx <= currentIdx ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-6 h-0.5 ${idx < currentIdx ? 'bg-orange-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {isSignUp && step !== 'auth' && stepIndicator(step)}

        {step === 'auth' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                CampusEats
              </h1>
              <p className="text-gray-600 mt-2">
                {isSignUp ? 'Join us for quick delivery' : 'Welcome back'}
              </p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="your@email.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="••••••••" />
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="••••••••" />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="text-center text-gray-600 mt-6">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-orange-500 font-bold hover:text-orange-600">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>

            {onGoToLanding && (
              <button onClick={onGoToLanding} className="w-full mt-4 text-gray-400 hover:text-gray-600 text-sm">
                ← Back to home
              </button>
            )}
          </>
        )}

        {step === 'profile' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <User className="h-6 w-6 text-orange-500" />
              Complete Your Profile
            </h2>
            <p className="text-gray-500 text-sm mb-5">Fill in your details to start ordering</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form onSubmit={handleProfileSubmit} className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="John Doe" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} min="10" max="100"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="20" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select value={gender} onChange={(e) => setGender(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Delhi" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                  <input type="text" value={state} onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Delhi" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="India" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mobile Number * <Phone className="inline h-3.5 w-3.5 text-gray-400" />
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+91</span>
                  <input type="tel" required value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="9876543210" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 mt-2">
                {loading ? 'Sending OTP...' : 'Verify Mobile & Complete'}
              </button>
            </form>
          </>
        )}

        {step === 'mobile_verify' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Verify Mobile Number</h2>
              <p className="text-gray-500 text-sm mt-2">
                Enter the OTP sent to <span className="font-semibold text-gray-700">+91 {mobileNumber}</span>
              </p>
            </div>

            {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{successMsg}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form onSubmit={handleVerifyMobile} className="space-y-4">
              <input type="text" required maxLength={6} value={mobileOtp}
                onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000" />
              <button type="submit" disabled={loading || mobileOtp.length !== 6}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-bold disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Start Ordering'}
              </button>
            </form>

            <button onClick={() => setStep('profile')}
              className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm">
              ← Back to profile
            </button>
          </>
        )}
      </div>
    </div>
  );
}
