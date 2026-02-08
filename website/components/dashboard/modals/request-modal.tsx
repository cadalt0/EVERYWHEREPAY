'use client';

import { X, Copy, Check, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { chains } from '@/lib/mock-data';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestModal({ isOpen, onClose }: RequestModalProps) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generateRequestId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 10; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
  }

  const handleGenerate = async () => {
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
        setGenerated(true);
      } else {
        setError('Failed to create request.');
      }
    } catch (err) {
      setError('Failed to create request.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!requestId) return;
    const link = `${window.location.origin}/pay/${requestId}`;
    navigator.clipboard.writeText(link);
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
          <div className="flex items-center gap-2">
            <Link href="/request" target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-muted rounded transition-colors" title="Open full page">
              <ArrowUpRight className="w-5 h-5" />
            </Link>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
              {error && <div className="text-red-500 font-mono text-sm">{error}</div>}
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-6">
              <div className="p-4 border border-border rounded-lg w-full max-w-full flex flex-col items-center">
                <p className="text-sm font-mono font-semibold mb-2">Share this link:</p>
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={`${window.location.origin}/pay/${requestId}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-muted text-foreground font-mono text-xs"
                  />
                  <button
                    onClick={copyLink}
                    className="p-2 hover:bg-muted rounded transition-colors flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3">
          {!generated ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-2 border border-border rounded-lg font-mono hover:bg-muted transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!amount || loading}
              >
                {loading ? 'Creating...' : 'Generate Request'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
