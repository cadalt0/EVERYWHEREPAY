'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { chains } from '@/lib/mock-data';
import { Plus, X } from 'lucide-react';

export default function SendPage() {
  const [isMulti, setIsMulti] = useState(false);
  const [recipients, setRecipients] = useState([{ chain: 'eth', address: '', amount: '' }]);

  const addRecipient = () => {
    setRecipients([...recipients, { chain: 'eth', address: '', amount: '' }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Send USDC" />

        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-2xl">
            <div className="border border-border rounded-lg p-8">
              <h1 className="text-2xl font-bold font-mono mb-8">Send USDC</h1>

              {/* Multi-send toggle */}
              <div className="flex items-center justify-between mb-8 p-4 bg-muted/50 rounded-lg">
                <label className="text-sm font-mono font-semibold">Enable Multi-send</label>
                <button
                  onClick={() => setIsMulti(!isMulti)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    isMulti ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      isMulti ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Recipients */}
              <div className={isMulti ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6' : 'space-y-6 mb-6'}>
                {recipients.map((recipient, index) => (
                  <div key={index} className="p-6 border border-border rounded-lg space-y-4">
                    {index > 0 && (
                      <button
                        onClick={() => removeRecipient(index)}
                        className="float-right p-1 hover:bg-muted rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    )}

                    {isMulti && (
                      <div className="clear-both">
                        <label className="text-sm font-mono text-muted-foreground mb-2 block">
                          Chain
                        </label>
                        <select
                          value={recipient.chain}
                          onChange={(e) => {
                            const newRecipients = [...recipients];
                            newRecipients[index].chain = e.target.value;
                            setRecipients(newRecipients);
                          }}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
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
                      <label className="text-sm font-mono text-muted-foreground mb-2 block">
                        {isMulti ? `Recipient ${index + 1} Address` : 'Recipient Address'}
                      </label>
                      <input
                        type="text"
                        placeholder="0x... or .eth"
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-mono text-muted-foreground mb-2 block">
                        Amount (USDC)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add recipient button */}
              {isMulti && (
                <button
                  onClick={addRecipient}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-lg text-primary hover:bg-muted transition-colors font-mono text-sm mb-6"
                >
                  <Plus className="w-4 h-4" />
                  Add another recipient
                </button>
              )}

              {/* Note field */}
              {!isMulti && (
                <div className="mb-6">
                  <label className="text-sm font-mono text-muted-foreground mb-2 block">
                    Note (optional)
                  </label>
                  <textarea
                    placeholder="Payment for services, invoice ID, or any notes..."
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
                    rows={4}
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-6 border-t border-border">
                <button className="flex-1 py-3 border border-border rounded-lg font-mono hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity">
                  {isMulti ? 'Send to All' : 'Send USDC'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
