'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { chains } from '@/lib/mock-data';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [preferredChains, setPreferredChains] = useState<string[]>(['eth', 'polygon']);
  const [defaultChain, setDefaultChain] = useState('eth');

  const toggleChain = (chainId: string) => {
    setPreferredChains((prev) =>
      prev.includes(chainId) ? prev.filter((c) => c !== chainId) : [...prev, chainId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <h2 className="text-xl font-bold font-mono">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Payment Chains Section */}
          <div>
            <h3 className="text-sm font-bold font-mono uppercase text-muted-foreground mb-4">
              Preferred Payment Chains
            </h3>
            <p className="text-xs text-muted-foreground font-mono mb-4">
              Select which chains you want to receive payments on
            </p>

            <div className="space-y-2">
              {chains.map((chain) => (
                <label
                  key={chain.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={preferredChains.includes(chain.id)}
                    onChange={() => toggleChain(chain.id)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-mono font-semibold">{chain.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {chain.chainName}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Default Chain Section */}
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-bold font-mono uppercase text-muted-foreground mb-4">
              Default Payment Chain
            </h3>
            <p className="text-xs text-muted-foreground font-mono mb-4">
              Select the default chain for send operations
            </p>

            <select
              value={defaultChain}
              onChange={(e) => setDefaultChain(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            >
              {preferredChains.map((chainId) => {
                const chain = chains.find((c) => c.id === chainId);
                return chain ? (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ) : null;
              })}
            </select>
          </div>

          {/* Other Settings */}
          <div className="border-t border-border pt-6 space-y-4">
            <h3 className="text-sm font-bold font-mono uppercase text-muted-foreground mb-4">
              Account
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  disabled
                  className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground/50 font-mono text-sm opacity-50"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <p className="text-sm font-mono">Two-Factor Authentication</p>
                <button className="px-3 py-1 border border-border rounded text-xs font-mono hover:bg-muted transition-colors">
                  Enable
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 sticky bottom-0 bg-card">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-border rounded-lg font-mono hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
