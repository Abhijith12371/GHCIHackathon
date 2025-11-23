import React, { useState } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface PaymentFormProps {
  payees: string[];
  onPaymentComplete: () => Promise<void>;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  payees,
  onPaymentComplete
}) => {
  const [selectedPayee, setSelectedPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPayeeDropdown, setShowPayeeDropdown] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayee || !amount || isNaN(parseFloat(amount))) {
      setStatus({
        type: 'error',
        message: 'Please select a payee and enter a valid amount'
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('http://localhost:5000/api/direct-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payee: selectedPayee,
          amount: parseFloat(amount)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus({
          type: 'success',
          message: data.message || 'Payment successful!'
        });
        setSelectedPayee('');
        setAmount('');
        await onPaymentComplete();
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Payment failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error making payment:', error);
      setStatus({
        type: 'error',
        message: 'An error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="skeu-card rounded-3xl p-6">
      {status.type && (
        <div
          className={`mb-6 p-4 rounded-xl skeu-inset ${
            status.type === 'success'
              ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-800'
              : 'bg-gradient-to-br from-red-100 to-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center">
            {status.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-3" />
            ) : (
              <AlertTriangle className="w-5 h-5 mr-3" />
            )}
            <p className="font-medium embossed-text">{status.message}</p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label
            htmlFor="payee"
            className="block text-sm font-semibold text-slate-700 mb-2 embossed-text"
          >
            Select Payee
          </label>
          <div className="relative">
            <input
              type="text"
              id="payee"
              value={selectedPayee}
              onChange={e => setSelectedPayee(e.target.value)}
              onFocus={() => setShowPayeeDropdown(true)}
              onBlur={() => setTimeout(() => setShowPayeeDropdown(false), 200)}
              className="w-full skeu-input rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 transition-all font-medium"
              placeholder="Select or type payee name"
              required
            />
            {showPayeeDropdown && payees.length > 0 && (
              <div className="absolute z-10 w-full mt-2 skeu-card rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {payees
                  .filter(payee =>
                    payee.toLowerCase().includes(selectedPayee.toLowerCase())
                  )
                  .map((payee, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-200 text-slate-800 transition-colors embossed-text"
                      onClick={() => {
                        setSelectedPayee(payee);
                        setShowPayeeDropdown(false);
                      }}
                    >
                      {payee}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        <div className="mb-8">
          <label
            htmlFor="amount"
            className="block text-sm font-semibold text-slate-700 mb-2 embossed-text"
          >
            Amount
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-amber-700 font-bold text-lg">
              $
            </span>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full skeu-input rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 text-lg font-semibold transition-all"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full skeu-button gold-accent py-4 px-6 rounded-2xl font-bold text-lg text-amber-900 embossed-text disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <div className="w-6 h-6 border-3 border-amber-900 border-t-transparent rounded-full animate-spin mr-3"></div>
              Processing...
            </span>
          ) : (
            <span>Make Payment</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;
