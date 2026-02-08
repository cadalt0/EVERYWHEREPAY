"use client";

import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface WebSocketNotificationProps {
  wallets: Array<{ chain: string; address: string }>;
  enabled?: boolean;
}

export function useWebSocketNotifications({ wallets, enabled = true }: WebSocketNotificationProps) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled || !wallets || wallets.length === 0) {
      return;
    }

    // Get WebSocket URL from environment
    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!wsUrl) {
      console.error('NEXT_PUBLIC_SOCKET_URL not configured');
      return;
    }

    // Dispatch buffering event to show loading animation on bell icon
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('usdc-buffering', { detail: true }));
    }

    // Connect to WebSocket
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected - subscribing to all chains');

      // Get the EVM address (same for all chains)
      const evmAddress = wallets.length > 0 ? wallets[0].address : '';

      // Get email from localStorage
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

      if (!email) {
        console.error('WebSocket subscribe aborted: missing email address');
        ws.close();
        return;
      }

      // Subscribe to single address for all chains, with email
      ws.send(JSON.stringify({
        type: 'subscribe_all',
        address: evmAddress,
        email
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        if (msg.type === 'usdc_transfer') {
          console.log('USDC Transfer detected:', msg.data);
          
          const amount = msg.data?.amount ?? msg.data?.value ?? '';
          const txHash = msg.data?.txHash ?? '';
          const chain = msg.data?.chain ?? '';
          const from = msg.data?.from ?? '';

          // Save transaction to backend database
          if (typeof window !== 'undefined') {
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

          // Explorer URL mapping for all chains
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

          // Skip toast for ARC-TESTNET mint transactions (from 0x000...)
          const isMintTx = from && from.toLowerCase().startsWith('0x000');
          if (chain === 'ARC-TESTNET' && isMintTx) {
            console.log('Skipping toast for ARC-TESTNET mint transaction:', txHash);
            return;
          }

          // Show toast notification
          toast({
            title: `USDC received on ${chain}`,
            description: `Received ${amount} USDC from ${from}`,
            duration: 5000,
            className: explorerUrl ? 'cursor-pointer' : undefined,
            onClick: explorerUrl ? () => window.open(explorerUrl, '_blank') : undefined,
          });
        }

        if (msg.type === 'subscribed_all') {
          console.log('Subscribed to all chains:', msg.count || wallets.length, 'addresses');
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
      
      // Stop buffering animation when connection closes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('usdc-buffering', { detail: false }));
      }
    };

    ws.onerror = () => {
      console.error('WebSocket error', {
        url: wsUrl,
        readyState: ws.readyState,
      });
    };

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('usdc-buffering', { detail: false }));
      }
      
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'unsubscribe_all' }));
        }
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [wallets, enabled]);

  return null;
}
