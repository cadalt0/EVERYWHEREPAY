"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { getUserWallets } from '@/lib/client-wallets';

// Global state for buffering (persists across page navigations)
if (typeof window !== 'undefined') {
  (window as any).__usdcBuffering = false;
}

interface WebSocketContextType {
  isConnected: boolean;
  isBuffering: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const walletsRef = useRef<Array<{ chain: string; address: string }>>([]);
  const saveTxDbEnabled = (process.env.NEXT_PUBLIC_SAVETXDB ?? 'on').toLowerCase() !== 'off';

  useEffect(() => {
    // Fetch wallets from cache or API
    const fetchWallets = async () => {
      let wallets: Array<{ chain: string; address: string }> = [];

      // Use shared cache (deduped)
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        try {
          const user = JSON.parse(userStr);
          const email = user.email;
          if (!email) return;
          wallets = await getUserWallets(email);
        } catch (err) {
          console.error('Failed to fetch wallets:', err);
        }
      }

      walletsRef.current = wallets;
      connectWebSocket(wallets);
    };

    const connectWebSocket = (wallets: Array<{ chain: string; address: string }>) => {
      if (!wallets || wallets.length === 0) return;

      const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      if (!wsUrl) {
        console.error('NEXT_PUBLIC_SOCKET_URL not configured');
        return;
      }

      // Don't reconnect if already connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }

      if (reconnectTimerRef.current) {
        window.clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      console.log('Connecting WebSocket...');
      
      // Update global buffering state
      if (typeof window !== 'undefined') {
        (window as any).__usdcBuffering = true;
        window.dispatchEvent(new CustomEvent('usdc-buffering', { detail: true }));
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);

        // Get EVM address (same for all chains)
        const evmAddress = wallets.length > 0 ? wallets[0].address : '';

        let email = '';
        try {
          if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              email = user?.email || '';
            }
          }
        } catch (e) {
          console.error('Failed to parse user from localStorage', e);
        }

        // Subscribe to all chains
        ws.send(JSON.stringify({
          type: 'subscribe_all',
          address: evmAddress,
          email
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          // Log all incoming WebSocket messages
          console.log('===========================================');
          console.log('📨 WebSocket Message Received:');
          console.log('Type:', msg.type);
          console.log('Data:', msg.data);
          console.log('Full Message:', JSON.stringify(msg, null, 2));
          console.log('===========================================');

          if (msg.type === 'updatetx') {
            const detail = msg.data || {};
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('tx-update', { detail }));
            }
          }

          if (msg.type === 'usdc_transfer') {
            console.log('USDC Transfer detected:', msg.data);

            const amount = msg.data?.amount ?? msg.data?.value ?? '';
            const txHash = msg.data?.txHash ?? '';
            const chain = msg.data?.chain ?? '';
            const from = msg.data?.from ?? '';

            // Save transaction to backend database (can be disabled via env)
            if (saveTxDbEnabled && typeof window !== 'undefined') {
              const userStr = localStorage.getItem('user');
              if (userStr) {
                try {
                  const user = JSON.parse(userStr);
                  const email = user.email;

                  fetch(`/api/save-transaction?email=${encodeURIComponent(email)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      txhash: txHash,
                      amount,
                      chain,
                      sender: from
                    })
                  })
                    .then(res => res.json())
                    .then(data => {
                      if (data.success) {
                        console.log('Transaction saved to DB:', txHash);
                      } else if (data.duplicate) {
                        console.log('Transaction already exists in DB:', txHash);
                      } else {
                        console.error('Failed to save transaction:', data.error);
                      }
                    })
                    .catch(err => console.error('Error saving transaction:', err));
                } catch (e) {
                  console.error('Failed to parse user from localStorage', e);
                }
              }
            }

            // Show toast notification
            const explorerMap: Record<string, string> = {
              'AVAX-FUJI': 'https://testnet.snowtrace.io/tx/',
              'BASE-SEPOLIA': 'https://sepolia.basescan.org/tx/',
              'ARB-SEPOLIA': 'https://sepolia.arbiscan.io/tx/',
              'ETH-SEPOLIA': 'https://sepolia.etherscan.io/tx/',
              'MATIC-AMOY': 'https://amoy.polygonscan.com/tx/',
              'OP-SEPOLIA': 'https://sepolia-optimism.etherscan.io/tx/',
              'UNI-SEPOLIA': 'https://sepolia.uniscan.xyz/tx/',
              'CELO-ALFAJORES': 'https://alfajores.celoscan.io/tx/',
              'LINEA-SEPOLIA': 'https://sepolia.lineascan.build/tx/',
            };

            const explorerBase = explorerMap[chain];
            const explorerUrl = explorerBase && txHash ? `${explorerBase}${txHash}` : '';

            toast({
              title: `USDC received on ${chain}`,
              description: `Received ${amount} USDC from ${from}`,
              duration: 5000,
              className: explorerUrl ? 'cursor-pointer' : undefined,
              onClick: explorerUrl ? () => window.open(explorerUrl, '_blank') : undefined,
            });
          }

          if (msg.type === 'subscribed_all') {
            console.log('Subscribed to all chains');
          }

          if (msg.type === 'error') {
            console.error('WebSocket server error:', msg.message || msg);
          }
        } catch (e) {
          console.error('WebSocket message parse error', e);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed', { code: event.code, reason: event.reason });
        setIsConnected(false);

        // Update global buffering state
        if (typeof window !== 'undefined') {
          (window as any).__usdcBuffering = false;
          window.dispatchEvent(new CustomEvent('usdc-buffering', { detail: false }));
        }

        if (!reconnectTimerRef.current && typeof window !== 'undefined') {
          reconnectTimerRef.current = window.setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              return;
            }
            console.log('Reconnecting WebSocket...');
            connectWebSocket(walletsRef.current);
          }, 2000);
        }
      };

      ws.onerror = () => {
        console.error('WebSocket error', {
          url: wsUrl,
          readyState: ws.readyState,
        });

        if (!reconnectTimerRef.current && typeof window !== 'undefined') {
          reconnectTimerRef.current = window.setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              return;
            }
            console.log('Reconnecting WebSocket...');
            connectWebSocket(walletsRef.current);
          }, 2000);
        }
      };
    };

    // Start fetching wallets (only in browser)
    if (typeof window !== 'undefined') {
      fetchWallets();
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimerRef.current) {
        window.clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'unsubscribe_all' }));
        wsRef.current.close();
      }
    };
  }, [saveTxDbEnabled]);

  return (
    <WebSocketContext.Provider value={{ isConnected, isBuffering: false }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
