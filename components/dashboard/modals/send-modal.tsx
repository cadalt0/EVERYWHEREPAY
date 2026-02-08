
'use client';

import { X, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { SendForm } from '@/components/send/send-form';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';


interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SendModal({ isOpen, onClose }: SendModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Handler to call /api/send-multi (same as Send page, but only for single send)
  const handleSend = async (recipients: Array<{ chain: string; address: string; amount: string }>, note: string) => {
    setLoading(true);
    try {
      let email: string | null = null;
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
        toast({ title: 'User email not found', description: 'Please log in again.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const res = await fetch('/api/send-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recipients }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Send failed', description: data.error || 'Unknown error', variant: 'destructive' });
      } else {
        toast({ title: 'Send submitted', description: `Transaction ID: ${data.txId || 'pending'}`, variant: 'success' });
        onClose();
      }
    } catch (err: any) {
      toast({ title: 'Send error', description: err?.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold font-mono">Send USDC</h2>
          <div className="flex items-center gap-2">
            <Link href="/send" target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-muted rounded transition-colors" title="Open full page">
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
        <div className="p-6">
          <SendForm
            showCancel
            onCancel={onClose}
            submitLabel={loading ? 'Sending...' : 'Send USDC'}
            isMultiDefault={false}
            disableMultiSend={true}
            className="modal-context"
            onSend={handleSend}
          />
        </div>
      </div>
    </div>
  );
}
