// lib/useAutoArcBalance.ts
import { useEffect, useRef } from 'react';

export function useAutoArcBalance(address: string | undefined, onUpdate: (bal: number | null) => void) {
  const lastValue = useRef<number | null>(null);
  useEffect(() => {
    if (!address) return;
    let mounted = true;
    let interval: NodeJS.Timeout;
    async function check() {
      try {
        const res = await fetch('https://gateway-api-testnet.circle.com/v1/balances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: 'USDC',
            sources: [{ domain: 26, depositor: address }],
          }),
        });
        const result = await res.json();
        if (result?.balances?.[0]?.balance) {
          const bal = parseFloat(result.balances[0].balance);
          if (lastValue.current !== bal) {
            lastValue.current = bal;
            if (mounted) onUpdate(bal);
          }
        }
      } catch {}
    }
    check();
    interval = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [address, onUpdate]);
}
