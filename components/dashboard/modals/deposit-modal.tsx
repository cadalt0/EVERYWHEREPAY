'use client';

import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { chains } from '@/lib/mock-data';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f5e8c';

  const copyAddress = () => {
    navigator.clipboard.writeText(mockAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold font-mono">Deposit USDC</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!selectedChain ? (
            <>
              <p className="text-sm text-muted-foreground">
                Select a blockchain to deposit USDC
              </p>
              <div className="grid grid-cols-3 gap-3">
                {chains.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => setSelectedChain(chain.id)}
                    className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center"
                  >
                    <div className="text-2xl mb-2">{chain.icon}</div>
                    <div className="text-xs font-mono font-semibold">{chain.name}</div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-2 block">
                  Chain
                </label>
                <button
                  onClick={() => setSelectedChain(null)}
                  className="w-full px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-left font-mono text-sm"
                >
                  {chains.find((c) => c.id === selectedChain)?.name}
                </button>
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-2 block">
                  Treasury Address
                </label>
                <div className="p-3 bg-muted rounded-lg border border-border">
                  <div className="font-mono text-xs break-all">{mockAddress}</div>
                </div>
              </div>

              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Send USDC to this address on{' '}
                  <span className="font-semibold">
                    {chains.find((c) => c.id === selectedChain)?.name}
                  </span>
                  . Funds will be consolidated automatically.
                </p>
              </div>

              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">█ ▄▄ ▄ ▄</div>
                  <div className="text-xs text-muted-foreground font-mono">QR Code</div>
                </div>
              </div>

              <button
                onClick={copyAddress}
                className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg font-mono font-semibold hover:opacity-90 transition-opacity"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Address
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-2 border border-border rounded-lg font-mono hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
