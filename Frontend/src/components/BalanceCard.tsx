import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

interface BalanceCardProps {
  balance: any;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance }) => {
  if (!balance) {
    return (
      <div className="skeu-card rounded-3xl p-8 animate-pulse">
        <div className="h-6 bg-slate-300 rounded w-1/3 mb-2"></div>
        <div className="h-10 bg-slate-300 rounded w-1/2"></div>
      </div>
    );
  }

  const availableBalance = parseFloat(balance.available || 0).toFixed(2);
  const ledgerBalance = parseFloat(balance.ledger || 0).toFixed(2);

  return (
    <div className="relative skeu-card rounded-3xl p-8 overflow-hidden group">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-700 embossed-text">Available Balance</h2>
          <div className="skeu-button gold-accent p-3 rounded-2xl">
            <DollarSign className="w-6 h-6 text-amber-900" />
          </div>
        </div>
        <div className="text-5xl font-bold mb-6 text-slate-800 embossed-text">
          ${availableBalance}
        </div>
        <div className="flex justify-between text-sm pt-4 border-t-2 border-slate-300">
          <div>
            <p className="text-slate-500 mb-1 debossed-text">Ledger Balance</p>
            <p className="font-semibold text-slate-800 text-lg embossed-text">${ledgerBalance}</p>
          </div>
          <div className="skeu-raised flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-green-100 to-green-200">
            <TrendingUp className="w-4 h-4 text-green-700" />
            <span className="text-green-800 font-medium embossed-text">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
