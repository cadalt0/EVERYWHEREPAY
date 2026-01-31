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

      <div className="text-xs opacity-70 mb-4">Across all supported chains</div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ethereum', value: mockBalance.ethereum },
          { label: 'Polygon', value: mockBalance.polygon },
          { label: 'Arbitrum', value: mockBalance.arbitrum },
        ].map((chain) => (
          <div key={chain.label}>
            <div className="text-xs opacity-70 mb-1">{chain.label}</div>
            <div className="text-sm font-mono font-semibold">
              ${chain.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
