import React, { useEffect, useState } from 'react';
import HomePage from './components/HomePage';
import ChatInterface from './components/ChatInterface';
import BankingDashboard from './components/BankingDashboard';
import VoiceBot from './components/VoiceBot';
import { Mic, Home } from 'lucide-react';

function App() {
  const [userId] = useState('default_user');
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payees, setPayees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVoiceBot, setShowVoiceBot] = useState(false);
  const [showHomePage, setShowHomePage] = useState(true);

  useEffect(() => {
    const fetchBankingData = async () => {
      try {
        setLoading(true);

        const balanceRes = await fetch('http://localhost:5000/api/balance');
        const balanceData = await balanceRes.json();

        const transactionsRes = await fetch(
          'http://localhost:5000/api/transactions'
        );
        const transactionsData = await transactionsRes.json();

        const payeesRes = await fetch('http://localhost:5000/api/payees');
        const payeesData = await payeesRes.json();

        const paymentsRes = await fetch('http://localhost:5000/api/payments');
        const paymentsData = await paymentsRes.json();

        setBalance(balanceData.balance);
        setTransactions(transactionsData.transactions || []);
        setPayees(payeesData.payees || []);
        setPayments(paymentsData.payments || []);
      } catch (error) {
        console.error('Error fetching banking data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBankingData();
  }, []);

  const refreshData = async () => {
    const balanceRes = await fetch('http://localhost:5000/api/balance');
    const balanceData = await balanceRes.json();
    setBalance(balanceData.balance);

    const paymentsRes = await fetch('http://localhost:5000/api/payments');
    const paymentsData = await paymentsRes.json();
    setPayments(paymentsData.payments || []);
  };

  if (showHomePage) {
    return <HomePage onGetStarted={() => setShowHomePage(false)} />;
  }

  if (showVoiceBot) {
    return (
      <VoiceBot
        userId={userId}
        onClose={() => setShowVoiceBot(false)}
        onChatAction={refreshData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(180,140,40,0.08),transparent_50%)]"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.06),transparent_50%)]"></div>

      <header className="relative z-10 bg-gradient-to-br from-slate-100 to-slate-200 border-b-2 border-slate-300 py-6 px-6">
        <div className="skeu-raised rounded-2xl px-6 py-4">
          <div className="container mx-auto flex justify-between items-center">
            <button
              onClick={() => setShowHomePage(true)}
              className="skeu-button flex items-center gap-2 px-4 py-2 rounded-xl"
              title="Back to Home"
            >
              <Home className="w-5 h-5 text-slate-700" />
            </button>
            <h1 className="text-3xl font-bold text-slate-800 embossed-text">Voice Banking Elite</h1>
            <button
              onClick={() => setShowVoiceBot(true)}
              className="skeu-button flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-slate-700 embossed-text"
            >
              <Mic className="w-5 h-5" />
              <span>Voice Chat</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BankingDashboard
            balance={balance}
            transactions={transactions}
            payees={payees}
            payments={payments}
            loading={loading}
            onMakePayment={refreshData}
          />
        </div>
        <div className="lg:col-span-1">
          <ChatInterface userId={userId} onChatAction={refreshData} />
        </div>
      </main>
    </div>
  );
}

export default App;
