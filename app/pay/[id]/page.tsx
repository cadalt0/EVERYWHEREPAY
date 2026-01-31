'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PayPage() {
  const params = useParams();
  const requestId = params.id as string;
  const [selectedChain, setSelectedChain] = useState('eth');

  // Mock request data
  const mockRequest = {
    id: requestId,
    amount: 250.5,
    note: 'Invoice #2024-001 - Web Development Services',
    requester: 'john@example.com',
    createdAt: '2025-01-30',
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 font-mono text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Card */}
        <div className="border border-border rounded-lg p-8 space-y-6 bg-card">
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-mono mb-2">Payment Request</p>
            <h1 className="text-3xl font-bold font-mono">${mockRequest.amount.toLocaleString()}</h1>
            <p className="text-xs text-muted-foreground font-mono mt-2">USDC</p>
          </div>

          {mockRequest.note && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground font-mono uppercase mb-2">Note</p>
              <p className="font-mono text-sm">{mockRequest.note}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-mono text-muted-foreground mb-2 block">Select Chain</label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            >
              <option value="eth">Ethereum (ETH)</option>
              <option value="polygon">Polygon (MATIC)</option>
              <option value="arbitrum">Arbitrum (ARB)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-mono text-muted-foreground mb-2 block">Your Address</label>
            <input
              type="text"
              placeholder="0x... or .eth"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground font-mono">
              Request ID: <span className="text-foreground">{requestId}</span>
            </p>
          </div>

          <div className="flex gap-3 pt-6 border-t border-border">
            <button className="flex-1 py-3 border border-border rounded-lg font-mono hover:bg-muted transition-colors">
              Cancel
            </button>
            <button className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity">
              Confirm Payment
            </button>
          </div>

          <p className="text-xs text-muted-foreground font-mono text-center">
            You're about to send {mockRequest.amount} USDC on {selectedChain}
          </p>
        </div>
      </div>
    </div>
  );
}
