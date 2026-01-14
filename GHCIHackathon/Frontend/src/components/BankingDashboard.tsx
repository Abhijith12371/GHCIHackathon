import React, { useState } from 'react';
import BalanceCard from './BalanceCard';
import TransactionList from './TransactionList';
import PaymentHistory from './PaymentHistory';
import PaymentForm from './PaymentForm';

interface BankingDashboardProps {
  balance: any;
  transactions: any[];
  payees: string[];
  payments: any[];
  loading: boolean;
  onMakePayment: () => Promise<void>;
}

const BankingDashboard: React.FC<BankingDashboardProps> = ({
  balance,
  transactions,
  payees,
  payments,
  loading,
  onMakePayment
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="skeu-card rounded-3xl p-6 min-h-[600px] flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-6 text-slate-700 font-medium text-lg embossed-text">Loading banking information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="skeu-card rounded-3xl overflow-hidden">
      <div className="border-b-2 border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 font-semibold text-sm transition-all duration-300 ${
              activeTab === 'overview'
                ? 'skeu-card-pressed text-slate-800 embossed-text'
                : 'text-slate-600 hover:text-slate-800 debossed-text'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-4 font-semibold text-sm transition-all duration-300 ${
              activeTab === 'transactions'
                ? 'skeu-card-pressed text-slate-800 embossed-text'
                : 'text-slate-600 hover:text-slate-800 debossed-text'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-6 py-4 font-semibold text-sm transition-all duration-300 ${
              activeTab === 'payments'
                ? 'skeu-card-pressed text-slate-800 embossed-text'
                : 'text-slate-600 hover:text-slate-800 debossed-text'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab('makePayment')}
            className={`px-6 py-4 font-semibold text-sm transition-all duration-300 ${
              activeTab === 'makePayment'
                ? 'skeu-card-pressed text-slate-800 embossed-text'
                : 'text-slate-600 hover:text-slate-800 debossed-text'
            }`}
          >
            Make Payment
          </button>
        </nav>
      </div>
      <div className="p-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <BalanceCard balance={balance} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-800 embossed-text">
                  Recent Transactions
                </h3>
                <TransactionList transactions={transactions.slice(0, 3)} />
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="mt-3 text-blue-700 text-sm hover:text-blue-600 transition-colors font-medium embossed-text"
                >
                  View all transactions →
                </button>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-800 embossed-text">Recent Payments</h3>
                <PaymentHistory payments={payments.slice(0, 3)} />
                <button
                  onClick={() => setActiveTab('payments')}
                  className="mt-3 text-blue-700 text-sm hover:text-blue-600 transition-colors font-medium embossed-text"
                >
                  View all payments →
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'transactions' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-800 embossed-text">Transaction History</h2>
            <TransactionList transactions={transactions} />
          </div>
        )}
        {activeTab === 'payments' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-800 embossed-text">Payment History</h2>
            <PaymentHistory payments={payments} />
          </div>
        )}
        {activeTab === 'makePayment' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-800 embossed-text">Make a Payment</h2>
            <PaymentForm payees={payees} onPaymentComplete={onMakePayment} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BankingDashboard;
