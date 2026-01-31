'use client';

import { mockBalance } from '@/lib/mock-data';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="bg-primary text-primary-foreground rounded-lg p-8 shadow-lg border border-primary/30">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-sm opacity-80 mb-2">Total Balance</div>
          <div className="text-4xl font-bold font-mono">
            {showBalance ? `$${mockBalance.total.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '••••••'}
          </div>
        </div>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          {showBalance ? (
            <Eye className="w-5 h-5" />
          ) : (
            <EyeOff className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="text-xs opacity-70">Total balance across all chains</div>
    </div>
  );
}
