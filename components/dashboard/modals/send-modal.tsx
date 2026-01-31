'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { chains } from '@/lib/mock-data';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SendModal({ isOpen, onClose }: SendModalProps) {
  const [isMulti, setIsMulti] = useState(false);
  const [recipients, setRecipients] = useState([{ chain: 'eth', address: '', amount: '' }]);

  if (!isOpen) return null;

  const addRecipient = () => {
    setRecipients([...recipients, { chain: 'eth', address: '', amount: '' }]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold font-mono">Send USDC</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Multi-send toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-mono">Multi-send</label>
            <button
              onClick={() => setIsMulti(!isMulti)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isMulti ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isMulti ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Recipients */}
          <div className={isMulti ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
            {recipients.map((recipient, index) => (
              <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                {isMulti && (
                  <div>
                    <label className="text-xs font-mono text-muted-foreground mb-1 block">
                      Chain
                    </label>
                    <select
                      value={recipient.chain}
                      onChange={(e) => {
                        const newRecipients = [...recipients];
                        newRecipients[index].chain = e.target.value;
                        setRecipients(newRecipients);
                      }}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    >
                      {chains.map((chain) => (
                        <option key={chain.id} value={chain.id}>
                          {chain.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1 block">
                    {isMulti ? `Recipient ${index + 1}` : 'Address'}
                  </label>
                  <input
                    type="text"
                    placeholder="0x... or .eth"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1 block">
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add recipient button */}
          {isMulti && (
            <button
              onClick={addRecipient}
              className="w-full flex items-center justify-center gap-2 py-2 border border-border rounded-lg text-primary hover:bg-muted transition-colors font-mono text-sm"
            >
              <Plus className="w-4 h-4" />
              Add recipient
            </button>
          )}

          {/* Note field */}
          {!isMulti && (
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">
                Note (optional)
              </label>
              <textarea
                placeholder="Payment for services..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
                rows={3}
              />
            </div>
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
          <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity">
            {isMulti ? 'Send to all' : 'Send USDC'}
          </button>
        </div>
      </div>
    </div>
  );
}
