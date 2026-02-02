'use client';

import { chains } from '@/lib/mock-data';
import { fetchArcUsdcBalance } from '@/lib/arc-balance';
import { useAutoArcBalance } from '@/lib/useAutoArcBalance';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { checkChainBalance, getUserEmail, getWalletsForUser } from '@/lib/balance-checker';
import { useToast } from '@/hooks/use-toast';

export function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true);
  const [walletMap, setWalletMap] = useState<Record<string, string>>({});
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [checkingChain, setCheckingChain] = useState<string | null>(null);
  const [arcBalance, setArcBalance] = useState<number | null>(null);
  const [arcLoading, setArcLoading] = useState(false);
  // Placeholder for other chain balances if needed
  // const [otherBalances, setOtherBalances] = useState<Record<string, number | null>>({});
  const { toast } = useToast();

  // Refresh Arc balance
  const handleRefreshArcBalance = () => {
    const arcAddr = walletMap['ARC-TESTNET'];
    if (arcAddr) {
      setArcLoading(true);
      fetchArcUsdcBalance(arcAddr)
        .then((bal) => setArcBalance(bal))
        .finally(() => setArcLoading(false));
    }
  };

  useEffect(() => {
    setWalletsLoading(true);
    getUserEmail().then((email) => {
      if (!email) {
        setWalletsLoading(false);
        return;
      }
      getWalletsForUser(email).then((map) => {
        setWalletMap(map);
        setWalletsLoading(false);
        // Arc Testnet balance fetch
        const arcAddr = map['ARC-TESTNET'];
        if (arcAddr) {
          setArcLoading(true);
          fetchArcUsdcBalance(arcAddr)
            .then((bal) => setArcBalance(bal))
            .finally(() => setArcLoading(false));
        }
      });
    });
  }, []);

  // Auto-update Arc balance every 10s if address is present
  const arcAddr = walletMap['ARC-TESTNET'];
  useAutoArcBalance(
    arcAddr,
    (bal) => {
      setArcBalance((prev) => (prev !== bal ? bal : prev));
    }
  );

  const handleCheckBalance = async (chainId: string, chainName: string) => {
    const address = walletMap[chainId];
    const email = await getUserEmail();

    if (!address || !email) {
      toast({
        title: 'Wallet not ready',
        description: 'Please wait for the wallet to load.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCheckingChain(chainId);
      const processingToast = toast({
        title: 'Checking balance',
        description: `Checking ${chainName}...`,
      });

      const result = await checkChainBalance(chainId, email, address);

      if (result.error) {
        processingToast.update({
          id: processingToast.id,
          title: 'Balance check failed',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        const balanceValue = Number(result.balance.replace(' USDC', ''));
        if (balanceValue >= 0.1) {
          processingToast.update({
            id: processingToast.id,
            title: 'Settling funds',
            description: `Settling ${result.balance} on ${chainName}`,
            className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
          });
        } else {
          processingToast.update({
            id: processingToast.id,
            title: 'Not found',
            description: `No settleable balance on ${chainName}.`,
            className: 'border-slate-400/40 bg-slate-400/10 text-slate-600 dark:text-slate-300',
          });
        }
      }
    } catch (err) {
      toast({
        title: 'Balance check failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCheckingChain(null);
    }
  };

  // Only show real Arc balance for now, never mock
  let totalBalance: number | null = null;
  if (arcBalance !== null) {
    totalBalance = arcBalance;
  }
  return (
    <div className="bg-primary text-primary-foreground rounded-lg p-8 shadow-lg border border-primary/30">
      <div className="flex items-start justify-between mb-8 gap-6">
        <div className="w-1/2">
          <div className="text-sm opacity-80 mb-2">Total Balance</div>
            <div className="flex items-center gap-3">
            <div className="text-4xl font-bold font-mono">
              {showBalance ? (
                (walletsLoading || arcLoading) ? (
                  <span className="animate-pulse">Loading...</span>
                ) : totalBalance !== null ? (
                  `$${totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                ) : (
                  <span className="opacity-60">No balance</span>
                )
              ) : '••••••'}
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleRefreshArcBalance}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Refresh balance"
              disabled={arcLoading || walletsLoading}
            >
              <RefreshCw className={`w-5 h-5 ${arcLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="w-1/2 flex flex-col items-end gap-4">
          <div className="w-full grid grid-cols-5 grid-rows-2 justify-items-end gap-3">
            {chains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleCheckBalance(chain.id, chain.name)}
                disabled={checkingChain !== null || !walletMap[chain.id]}
                className="relative inline-flex items-center justify-center rounded-full bg-white/15 border border-white/20 shadow-sm transition-transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ width: 64, height: 64, perspective: '800px' }}
                title={chain.name}
              >
                {checkingChain === chain.id && (
                  <div className="absolute inset-0 flex items-center justify-center animate-spin z-10">
                    <svg className="w-[90%] h-[90%] text-green-400" viewBox="0 0 24 24">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                )}
                <Image
                  src={chain.logo}
                  alt={chain.name}
                  width={56}
                  height={56}
                  className="rounded-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs opacity-70">Total balance across all chains</div>
    </div>
  );
}
