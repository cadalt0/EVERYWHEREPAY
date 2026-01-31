'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Copy, Check } from 'lucide-react';

export default function RequestPage() {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [copiedRequestId, setCopiedRequestId] = useState(false);

  const createRequest = () => {
    if (!amount) return;
    const id = Math.random().toString(36).substring(2, 11).toUpperCase();
    setRequestId(id);
  };

  const copyRequestLink = () => {
    if (!requestId) return;
    const link = `${window.location.origin}/pay/${requestId}`;
    navigator.clipboard.writeText(link);
    setCopiedRequestId(true);
    setTimeout(() => setCopiedRequestId(false), 2000);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Request Payment" />

        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-2xl">
            <div className="border border-border rounded-lg p-8">
              {!requestId ? (
                <>
                  <h1 className="text-2xl font-bold font-mono mb-8">Create Payment Request</h1>

                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-mono text-muted-foreground mb-2 block">
                        Amount (USDC)
                      </label>
                      <input
                        type="number"
                        placeholder="100.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-lg"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-mono text-muted-foreground mb-2 block">
                        Note (optional)
                      </label>
                      <textarea
                        placeholder="Invoice #123, Project milestone payment, etc."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-border">
                      <button className="flex-1 py-3 border border-border rounded-lg font-mono hover:bg-muted transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={createRequest}
                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity"
                      >
                        Create Request
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-mono mb-2">✓ Request Created Successfully</p>
                    <h2 className="text-2xl font-bold font-mono">Payment Request: {requestId}</h2>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-xs text-muted-foreground font-mono uppercase">Amount Requested</p>
                    <p className="text-2xl font-bold font-mono">${parseFloat(amount).toLocaleString()}</p>
                  </div>

                  {note && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground font-mono uppercase mb-2">Note</p>
                      <p className="font-mono text-sm">{note}</p>
                    </div>
                  )}

                  <div className="p-4 border border-border rounded-lg space-y-3">
                    <p className="text-sm font-mono font-semibold">Share this link:</p>
                    <div className="flex items-center gap-2 bg-background p-3 rounded border border-border">
                      <code className="text-xs font-mono flex-1 break-all text-foreground/70">
                        {`${window.location.origin}/pay/${requestId}`}
                      </code>
                      <button
                        onClick={copyRequestLink}
                        className="p-2 hover:bg-muted rounded transition-colors flex-shrink-0"
                      >
                        {copiedRequestId ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-border">
                    <button
                      onClick={() => {
                        setRequestId(null);
                        setAmount('');
                        setNote('');
                      }}
                      className="flex-1 py-3 border border-border rounded-lg font-mono hover:bg-muted transition-colors"
                    >
                      Create Another
                    </button>
                    <button className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity">
                      View Requests
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
