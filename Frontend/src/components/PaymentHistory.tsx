import React from 'react';
import { CheckCircle } from 'lucide-react';

interface PaymentHistoryProps {
  payments: any[];
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments }) => {
  if (!payments || payments.length === 0) {
    return <p className="text-slate-500 text-center py-4 debossed-text">No payment history available.</p>;
  }

  return (
    <div className="space-y-3">
      {payments.map((payment, index) => {
        const amount = parseFloat(payment.amount || 0);
        const date = payment.date
          ? new Date(payment.date).toLocaleDateString()
          : 'Recent';

        return (
          <div
            key={index}
            className="skeu-card rounded-2xl p-4 flex justify-between items-center"
          >
            <div className="flex items-center">
              <div className="skeu-button bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-xl mr-4">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 embossed-text">Payment to {payment.payee}</p>
                <p className="text-xs text-slate-500 mt-1 debossed-text">{date}</p>
              </div>
            </div>
            <span className="font-bold text-lg text-red-700 embossed-text">
              -${amount.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PaymentHistory;
