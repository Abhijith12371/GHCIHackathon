import React from 'react';
import { Mic, Shield, Zap, TrendingUp, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(180,140,40,0.08),transparent_50%)]"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.06),transparent_50%)]"></div>

      <header className="relative z-20 bg-gradient-to-br from-slate-100 to-slate-200 border-b-2 border-slate-300 shadow-lg">
        <div className="skeu-raised">
          <div className="container mx-auto px-6 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="skeu-button p-3 rounded-2xl gold-accent">
                <Mic className="w-6 h-6 text-amber-900" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 embossed-text">Voice Banking</h1>
            </div>
            <button
              onClick={onGetStarted}
              className="skeu-button px-7 py-3 rounded-xl font-semibold text-slate-700 embossed-text"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6">
        <section className="py-28 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="inline-block mb-8">
              <div className="skeu-raised flex items-center gap-2 px-6 py-3 rounded-full">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-slate-700 font-semibold text-sm embossed-text">The Future of Banking</span>
              </div>
            </div>
            <h2 className="text-7xl md:text-8xl font-black mb-10 leading-tight text-slate-800 embossed-text">
              Banking Made
              <br />
              <span className="text-slate-700">Effortlessly Simple</span>
            </h2>
            <p className="text-2xl text-slate-600 mb-14 max-w-3xl mx-auto leading-relaxed">
              Simply speak. Instantly access your accounts, transfer funds, and manage your finances with the power of conversational AI.
            </p>
            <div className="flex gap-6 justify-center flex-wrap">
              <button
                onClick={onGetStarted}
                className="skeu-button px-9 py-4 rounded-2xl font-bold text-lg text-slate-700 embossed-text flex items-center gap-3"
              >
                <span>Start Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={onGetStarted}
                className="skeu-button px-9 py-4 rounded-2xl font-bold text-lg text-slate-700 embossed-text flex items-center gap-3"
              >
                <Mic className="w-5 h-5" />
                Try Voice Demo
              </button>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="skeu-card rounded-3xl p-8 group">
              <div className="skeu-raised w-16 h-16 rounded-2xl flex items-center justify-center mb-6 gold-accent">
                <Mic className="w-8 h-8 text-amber-900" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3 embossed-text">Voice-First Design</h3>
              <p className="text-slate-600 leading-relaxed">
                Talk naturally to your bank. No apps to navigate, no buttons to click. Just pure conversation.
              </p>
            </div>

            <div className="skeu-card rounded-3xl p-8 group">
              <div className="skeu-raised w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-blue-100 to-blue-200">
                <Shield className="w-8 h-8 text-blue-700" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3 embossed-text">Enterprise Security</h3>
              <p className="text-slate-600 leading-relaxed">
                Military-grade encryption protects every transaction. Your data is always safe and secure.
              </p>
            </div>

            <div className="skeu-card rounded-3xl p-8 group">
              <div className="skeu-raised w-16 h-16 rounded-2xl flex items-center justify-center mb-6 gold-accent">
                <Zap className="w-8 h-8 text-amber-900" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3 embossed-text">Instantly Fast</h3>
              <p className="text-slate-600 leading-relaxed">
                AI-powered responses in milliseconds. Complete any banking task in seconds, not minutes.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="skeu-card rounded-3xl p-16 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-5xl font-black text-slate-800 mb-8 leading-tight embossed-text">
                  Everything
                  <br />
                  <span className="text-slate-700">You Need</span>
                </h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="skeu-button p-3 rounded-xl flex-shrink-0 mt-1">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold mb-1 text-lg embossed-text">Instant Balance Checks</p>
                      <p className="text-slate-600">Real-time account information at your fingertips</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="skeu-button p-3 rounded-xl flex-shrink-0 mt-1">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold mb-1 text-lg embossed-text">Voice Payments</p>
                      <p className="text-slate-600">Transfer money with just a spoken command</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="skeu-button p-3 rounded-xl flex-shrink-0 mt-1">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold mb-1 text-lg embossed-text">Full Transaction History</p>
                      <p className="text-slate-600">Track every transaction with intelligent insights</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="skeu-button p-3 rounded-xl flex-shrink-0 mt-1">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold mb-1 text-lg embossed-text">Smart Recommendations</p>
                      <p className="text-slate-600">AI insights to help optimize your finances</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="skeu-card rounded-3xl p-8">
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b-2 border-slate-300">
                      <div className="skeu-button gold-accent p-3 rounded-2xl">
                        <TrendingUp className="w-6 h-6 text-amber-900" />
                      </div>
                      <div>
                        <p className="text-slate-500 text-sm font-medium debossed-text">Total Balance</p>
                        <p className="text-4xl font-black text-slate-800 embossed-text">$12,847</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="skeu-inset flex justify-between items-center p-4 rounded-xl">
                        <span className="text-slate-700 font-medium debossed-text">Available</span>
                        <span className="text-slate-800 font-bold text-lg embossed-text">$8,234</span>
                      </div>
                      <div className="skeu-inset flex justify-between items-center p-4 rounded-xl">
                        <span className="text-slate-700 font-medium debossed-text">Pending</span>
                        <span className="text-slate-800 font-bold text-lg embossed-text">$4,613</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 text-center">
          <div className="max-w-4xl mx-auto skeu-card rounded-3xl p-20 relative overflow-hidden leather-texture">
            <div className="relative z-10">
              <h3 className="text-6xl font-black text-amber-50 mb-6 drop-shadow-lg">
                Ready to
                <br />
                Transform Banking?
              </h3>
              <p className="text-xl text-amber-100 mb-12 drop-shadow">
                Join thousands who've already embraced the future of financial management.
              </p>
              <button
                onClick={onGetStarted}
                className="skeu-button px-10 py-5 rounded-2xl font-bold text-lg text-slate-700 embossed-text inline-flex items-center gap-3"
              >
                <span>Get Started Today</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t-2 border-slate-300 py-8 mt-20 skeu-raised">
        <div className="container mx-auto px-6 text-center text-slate-600 debossed-text">
          <p>&copy; 2025 Voice Banking. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
