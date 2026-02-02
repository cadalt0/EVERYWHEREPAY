"use client";

// Add global type for wallet cache
declare global {
  interface Window {
    __userWallets?: Array<{ chain: string; address: string }>;
  }
}

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { DepositContainer } from './DepositContainer';
import { getUserWallets } from '@/lib/client-wallets';

export default function DepositPageWrapper() {
  const [wallets, setWallets] = useState<Array<{ chain: string; address: string }>>([]);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Use cached wallets if available, else fetch (deduped + cached)
    let email = null;
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          email = user.email;
        } catch {}
      }
    }
    if (!email) {
      setWallets([]);
      return;
    }
    setIsLoading(true);
    getUserWallets(email)
      .then((arr) => {
        setWallets(arr);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title={
            <div className="flex items-center gap-2">
              <span>Deposit USDC</span>
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b border-accent"></div>}
            </div>
          } 
          selectedChain={selectedChain} 
        />
        <main className="flex-1 overflow-auto">
          <DepositContainer 
            wallets={wallets} 
            selectedChain={selectedChain} 
            setSelectedChain={setSelectedChain}
            isLoading={isLoading}
          />
        </main>
      </div>
    </div>
  );
}
