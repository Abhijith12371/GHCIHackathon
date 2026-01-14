import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface TransactionListProps {
  transactions: any[];
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return <p className="text-slate-500 text-center py-4 debossed-text">No transactions available.</p>;
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction, index) => {
        const amount = parseFloat(transaction.amount || 0);
        const isNegative = amount < 0;

        return (
          <div
            key={index}
            className="skeu-card rounded-2xl p-4 flex justify-between items-center"
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-xl mr-4 skeu-button ${
                  isNegative
                    ? 'bg-gradient-to-br from-red-100 to-red-200'
                    : 'bg-gradient-to-br from-green-100 to-green-200'
                }`}
              >
                {isNegative ? (
                  <ArrowUp className="w-5 h-5 text-red-700" />
                ) : (
                  <ArrowDown className="w-5 h-5 text-green-700" />
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-800 embossed-text">
                  {transaction.description || 'Unknown Transaction'}
                </p>
                <p className="text-xs text-slate-500 mt-1 debossed-text">
                  {transaction.date || 'Recent'}
                </p>
              </div>
            </div>
            <span
              className={`font-bold text-lg embossed-text ${
                isNegative ? 'text-red-700' : 'text-green-700'
              }`}
            >
              {isNegative ? '-' : '+'}${Math.abs(amount).toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList;
