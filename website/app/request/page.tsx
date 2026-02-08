'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Copy, Check } from 'lucide-react';

export default function RequestPage() {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [copiedRequestId, setCopiedRequestId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generateRequestId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 10; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
  }

  const createRequest = async () => {
    setError(null);
    if (!amount) return;
    const id = generateRequestId();
    let email = null;
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          email = user.email || null;
        } catch {}
      }
    }
    if (!email) {
      setError('User email not found. Please log in again.');
      return;
    }
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SETTLE_API_URL?.trim() || '';
      const msg = message && message.trim() ? message : 'everywherepay';
      const url = `${baseUrl}/request/${id}/${email}/${amount}/${encodeURIComponent(msg)}`;
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) {
        setError('Failed to create request.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data && data.success && data.request && data.request.requestid) {
        setRequestId(data.request.requestid);
      } else {
        setError('Failed to create request.');
      }
    } catch (err) {
      setError('Failed to create request.');
    } finally {
      setLoading(false);
    }
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
                        Message (optional)
                      </label>
                      <textarea
                        placeholder="Payment for services, invoice #123, etc."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
                        rows={4}
                      />
                    </div>
                    {error && <div className="text-red-500 font-mono text-sm">{error}</div>}
                    <div className="flex gap-3 pt-6 border-t border-border">
                      <button className="flex-1 py-3 border border-border rounded-lg font-mono hover:bg-muted transition-colors" disabled={loading}>
                        Cancel
                      </button>
                      <button
                        onClick={createRequest}
                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity"
                        disabled={loading}
                      >
                        {loading ? 'Creating...' : 'Create Request'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
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
                        setMessage('');
                      }}
                      className="flex-1 py-3 border border-border rounded-lg font-mono hover:bg-muted transition-colors"
                    >
                      Create Another
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
