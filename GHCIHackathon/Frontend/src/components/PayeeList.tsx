import React from 'react';
import { User } from 'lucide-react';

interface PayeeListProps {
  payees: string[];
  onSelectPayee?: (payee: string) => void;
}

const PayeeList: React.FC<PayeeListProps> = ({ payees, onSelectPayee }) => {
  if (!payees || payees.length === 0) {
    return <p className="text-gray-500">No payees available.</p>;
  }

  return (
    <div className="space-y-2">
      {payees.map((payee, index) => (
        <div
          key={index}
          className={`border rounded-lg p-3 flex items-center ${
            onSelectPayee ? 'cursor-pointer hover:bg-gray-50' : ''
          }`}
          onClick={() => onSelectPayee && onSelectPayee(payee)}
        >
          <div className="bg-gray-100 p-2 rounded-full mr-3">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <span className="font-medium">{payee}</span>
        </div>
      ))}
    </div>
  );
};

export default PayeeList;
