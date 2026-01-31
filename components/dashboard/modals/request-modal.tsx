'use client';

import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { chains } from '@/lib/mock-data';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestModal({ isOpen, onClose }: RequestModalProps) {
  const [amount, setAmount] = useState('');
  const [chain, setChain] = useState('eth');
  const [message, setMessage] = useState('');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const requestLink = `https://everywherepay.com/request/${Math.random().toString(36).slice(2, 9)}`;

  const handleGenerate = () => {
    if (amount) {
      setGenerated(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(requestLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold font-mono">Request Payment</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!generated ? (
            <>
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-2 block">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-2 block">
                  Chain
                </label>
                <select
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                >
                  {chains.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-2 block">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Payment for services..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="text-3xl font-bold font-mono mb-2">
                  ${amount}
                </div>
                <div className="text-sm text-muted-foreground">
                  on {chains.find((c) => c.id === chain)?.name}
                </div>
              </div>

              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">█ ▄▄ ▄ ▄</div>
                  <div className="text-xs text-muted-foreground font-mono">QR Code</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground mb-2 block">
                  Request Link
                </label>
                <input
                  type="text"
                  value={requestLink}
                  readOnly
                  className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground font-mono text-xs"
                />
              </div>

              <button
                onClick={copyLink}
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
                    Copy Link
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-border rounded-lg font-mono hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          {!generated ? (
            <button
              onClick={handleGenerate}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!amount}
            >
              Generate Request
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
