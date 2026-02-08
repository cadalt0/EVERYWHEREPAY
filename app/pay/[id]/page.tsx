'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { getWalletsForUser } from '@/lib/balance-checker';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { chains } from '@/lib/mock-data';
import { QRCodeSVG } from 'qrcode.react';

export default function PayPage() {
  const params = useParams();
  const requestId = params.id as string;
  const [walletMap, setWalletMap] = useState<Record<string, string>>({});


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    async function fetchRequest() {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_SETTLE_API_URL || (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_SETTLE_API_URL);
        const url = `${apiUrl?.replace(/\/$/, '')}/request/${requestId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch request');
        const data = await res.json();
        if (!data.success || !data.request) throw new Error('Request not found');
        setRequest(data.request);
        // Fetch wallet map for the user (email)
        if (data.request.user) {
          const wallets = await getWalletsForUser(data.request.user);
          setWalletMap(wallets);
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching request');
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [requestId]);

  useEffect(() => {
    if (!Object.values(walletMap)[0] || !request?.amount) return;
    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_SOCKET_URL);
    if (!wsUrl) return;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe_all',
        address: Object.values(walletMap)[0],
        email: request.user || ''
      }));
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'usdc_transfer') {
          const amount = parseFloat(msg.data?.amount ?? msg.data?.value ?? '');
          if (amount === parseFloat(request.amount)) {
            setShowConfirmation(true);
          }
        }
      } catch {}
    };
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [walletMap, request]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 font-mono text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Card */}
        <div className="border border-border rounded-lg p-8 space-y-6 bg-card">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground font-mono">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-destructive font-mono">{error}</div>
          ) : request ? (
            <>
              <div className="text-center">
                <p className="text-sm text-muted-foreground font-mono mb-2">Payment Request</p>
                <h1 className="text-3xl font-bold font-mono">${parseFloat(request.amount).toLocaleString()}</h1>
                <p className="text-xs text-muted-foreground font-mono mt-2">USDC</p>
              </div>

              {request.message && !request.message.includes('invoiceNo') && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground font-mono uppercase mb-2">Note</p>
                  <p className="font-mono text-sm">{request.message}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-mono text-muted-foreground mb-2 block">Supported Chains</label>
                <div className="flex gap-3 items-center mb-2 flex-wrap">
                  {chains.map((chain: any) => (
                    <div key={chain.id} className="flex flex-col items-center">
                      {chain.logo && (
                        <img
                          src={chain.logo}
                          alt={chain.name}
                          className="w-8 h-8 mb-1"
                          title={chain.name}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-2">You can send from these networks to this address:</div>
                {Object.values(walletMap)[0] && (
                  <>
                    <div className="flex flex-col items-center gap-2 mb-2">
                      <div className="bg-white p-3 rounded-lg border border-border">
                        <QRCodeSVG value={Object.values(walletMap)[0]} size={128} />
                      </div>
                      <div className="flex items-center gap-2 bg-muted/50 border border-border rounded px-3 py-2 w-full">
                        <span className="font-mono text-xs break-all flex-1">{Object.values(walletMap)[0]}</span>
                        <button
                          className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded font-mono hover:opacity-90 transition"
                          onClick={() => navigator.clipboard.writeText(Object.values(walletMap)[0])}
                        >Copy</button>
                      </div>
                    </div>
                  </>
                )}
              </div>


              <div className="p-4 border border-border rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground font-mono">
                  Request ID: <span className="text-foreground">{request.requestid}</span>
                </p>
              </div>


              <p className="text-xs text-muted-foreground font-mono text-center">
                You're about to send {parseFloat(request.amount)} USDC to the address above from any supported network.
              </p>
            </>
          ) : null}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-md w-full p-8 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4">Payment Detected!</h2>
            <p className="mb-4 text-center font-mono">A payment of {request.amount} USDC has been received.</p>
            <button className="w-full py-2 mt-2 border border-border rounded font-mono hover:bg-muted transition-colors" onClick={() => setShowConfirmation(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
