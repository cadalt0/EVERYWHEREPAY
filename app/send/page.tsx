

'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { SendForm } from '@/components/send/send-form';
import { useToast } from '@/hooks/use-toast';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';


function SendPageContent() {
  const searchParams = useSearchParams();
  const isMultiDefault = searchParams.get('multi') === '1';
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Handler to call /api/send-multi
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

      // Multi-send: make one API call per recipient
      if (recipients.length > 1) {
        for (const recipient of recipients) {
          const res = await fetch('/api/send-multi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, recipients: [recipient] }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast({ title: `Send failed (${recipient.chain})`, description: data.error || 'Unknown error', variant: 'destructive' });
          } else {
            toast({ title: `Send submitted (${recipient.chain})`, description: `Transaction ID: ${data.txId || 'pending'}`, variant: 'success' });
          }
        }
      } else {
        // Single send
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
        }
      }
    } catch (err: any) {
      toast({ title: 'Send error', description: err?.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Send USDC" />
        <main className="flex-1 overflow-auto">
          <div className="w-full h-full flex flex-col items-center justify-start p-8">
            <SendForm
              showCancel={false}
              submitLabel={loading ? 'Sending...' : 'Send USDC'}
              isMultiDefault={isMultiDefault}
              className="sendpage-context"
              onSend={handleSend}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SendPage() {
  return (
    <Suspense>
      <SendPageContent />
    </Suspense>
  );
}
