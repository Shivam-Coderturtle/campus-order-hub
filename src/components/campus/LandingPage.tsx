import { ArrowRight, DollarSign, Truck, Users, Star, Clock, Shield } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export default function LandingPage({ onLogin, onSignUp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          CampusEats
        </h1>
        <div className="flex gap-3">
          <button onClick={onLogin}
            className="px-5 py-2 rounded-lg border border-orange-500 text-orange-500 font-semibold hover:bg-orange-50 transition-colors text-sm">
            Log In
          </button>
          <button onClick={onSignUp}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 transition-all text-sm flex items-center gap-1">
            Sign Up <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
        <div className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
          Built for students, by students
        </div>
        <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Campus food delivery<br />
          <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            without the markup
          </span>
        </h2>
        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          No surge pricing. No hidden fees. Just honest food delivery across your campus — 
          and a chance to earn money delivering between classes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={onSignUp}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-200 flex items-center gap-2">
            Start Ordering <ArrowRight className="h-5 w-5" />
          </button>
          <button onClick={onLogin}
            className="px-8 py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-lg hover:border-orange-300 hover:text-orange-600 transition-all">
            I have an account
          </button>
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-center text-2xl md:text-3xl font-bold text-gray-900 mb-12">
            Why CampusEats?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-5">
                <DollarSign className="h-7 w-7 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Honest Pricing</h4>
              <p className="text-gray-500 leading-relaxed">
                What you see is what you pay. No inflated menu prices, no dynamic surge, no packaging fees hidden at checkout. 
                The same price as ordering at the counter.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                <Truck className="h-7 w-7 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Low Delivery Fees</h4>
              <p className="text-gray-500 leading-relaxed">
                Flat ₹10–20 delivery fee. That's it. No distance surcharges, no peak-hour multipliers. 
                We keep it affordable because it's a campus, not a city.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-5">
                <Users className="h-7 w-7 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Earn While You Learn</h4>
              <p className="text-gray-500 leading-relaxed">
                Freelance delivery model — pick up orders between classes, earn on your schedule. 
                No commitments, no minimum hours. Toggle on when free, toggle off when busy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <h3 className="text-center text-2xl md:text-3xl font-bold text-gray-900 mb-12">How It Works</h3>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '1', icon: '📱', title: 'Sign Up', desc: 'Create your account in 30 seconds' },
            { step: '2', icon: '🍕', title: 'Browse & Order', desc: 'Pick from campus outlets' },
            { step: '3', icon: '🚴', title: 'Delivery Partner Accepts', desc: 'A fellow student picks it up' },
            { step: '4', icon: '🎉', title: 'Enjoy!', desc: 'Food at your doorstep in minutes' },
          ].map(item => (
            <div key={item.step} className="text-center">
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                Step {item.step}
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { value: '₹0', label: 'Hidden Fees' },
            { value: '₹10-20', label: 'Flat Delivery' },
            { value: '15 min', label: 'Avg Delivery' },
            { value: 'Flexible', label: 'Earn Schedule' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold">{s.value}</div>
              <div className="text-orange-100 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* For Delivery Partners */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              For Students
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Turn your free time into earnings
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              CampusEats uses a freelancing model — no interviews, no shifts, no boss. Just sign up as a delivery partner, 
              toggle "Online" when you have free time between classes, and start earning. Deliver food within your campus 
              with zero extra effort.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'No minimum hours or commitments',
                'Earn per delivery — transparent payouts',
                'Work only when it suits your schedule',
                'Build your profile with ratings & reviews',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-gray-700">
                  <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <button onClick={onSignUp}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-200">
              Start Earning Today
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
        <p>© 2026 CampusEats. Built with ❤️ for campus communities.</p>
      </footer>
    </div>
  );
}
