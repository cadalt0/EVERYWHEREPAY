'use client';

import { Send, ArrowDownLeft, Share2, Clock, X, Copy, Check, RefreshCw, ArrowRight, Wand2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebSocket } from '@/components/WebSocketProvider';
import Image from 'next/image';
import { chains } from '@/lib/mock-data';
import { attestTransaction, getUserEmail } from '@/lib/attest-transaction';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  txhash: string;
  amount: string;
  chain: string;
  sender: string;
  status: string;
  txtype: string;
  bridged_to?: string;
  message?: string;
  mintTxHash?: string;
  burnTxHash?: string;
  fromChain?: string;
  createdAt: string;
}

export function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [attesting, setAttesting] = useState<string | null>(null);
  const { isConnected } = useWebSocket();
  const { toast } = useToast();

  const filterTransactions = (txs: Transaction[]): Transaction[] => {
    return txs.filter((tx) => {
      // Hide transactions from 0x000 on ARC-TESTNET only
      const isMintTx = tx.sender.toLowerCase().startsWith('0x0');
      const isArcTestnet = tx.chain === 'ARC-TESTNET';
      if (isMintTx && isArcTestnet) {
        return false;
      }
      return true;
    });
  };

  const fetchTransactions = async (currentOffset: number, limit: number = 2) => {
    const isLoadingMore = currentOffset > 0;
    if (isLoadingMore) {
      setLoadingMore(true);
    }

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.log('[TransactionTable] No user in localStorage');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      const email = user.email;
      if (!email) {
        console.log('[TransactionTable] No email in user object');
        setLoading(false);
        return;
      }

      const fetchLimit = Math.max(limit * 3, limit + 3);
      console.log('[TransactionTable] Fetching transactions for:', email, { offset: currentOffset, limit, fetchLimit });
      const res = await fetch(`/api/get-transactions?email=${encodeURIComponent(email)}&limit=${fetchLimit}&offset=${currentOffset}`);
      const data = await res.json();

      console.log('[TransactionTable] API Response:', data);

      if (data.success && data.transactions) {
        console.log('[TransactionTable] Found transactions:', data.transactions.length);

        const filtered = filterTransactions(data.transactions);
        const finalTxs = filtered.slice(0, limit);

        if (isLoadingMore) {
          setTransactions(prev => [...prev, ...finalTxs]);
        } else {
          setTransactions(finalTxs);
        }

        // If we got fewer filtered results than requested, there are no more transactions
        if (filtered.length < limit) {
          setHasMore(false);
        }

        setOffset(currentOffset + data.transactions.length);
      } else {
        console.log('[TransactionTable] No transactions or API error:', data);
        setHasMore(false);
      }
    } catch (err) {
      console.error('[TransactionTable] Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    console.log('[TransactionTable] useEffect triggered, isConnected:', isConnected);
    
    // Wait for WebSocket to connect, then wait 2 seconds before fetching
    if (isConnected) {
      console.log('[TransactionTable] WebSocket is connected, starting 2 second timer...');
      const timer = setTimeout(() => {
        console.log('[TransactionTable] Timer completed, fetching transactions...');
        fetchTransactions(0);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  const handleLoadMore = () => {
    fetchTransactions(offset);
  };
  const getStatusColor = (status: string) => {
    const normalizedStatus = (status || '').split(':')[0].toLowerCase();
    switch (normalizedStatus) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      case 'received':
      case 'recvied':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950';
      case 'settling':
        return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950';
      case 'bridging':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950';
      case 'bridged':
      case 'minted':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950';
      case 'stuck':
      case 'stuck_g':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getStatusLabel = (status: string) => {
    const key = (status || '').split(':')[0].toLowerCase();
    switch (key) {
      case 'received':
      case 'recvied':
        return 'Received';
      case 'settling':
        return 'Settling';
      case 'bridging':
        return 'Bridging';
      case 'bridged':
        return 'Bridged';
      case 'minted':
        return 'Minted';
      case 'stuck':
        return 'Stuck';
      case 'stuck_g':
        return 'Gateway Failed';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      default:
        return key || status;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 6 
    });
  };

  const getExplorerUrl = (chain: string, txhash: string) => {
    const explorerMap: Record<string, string> = {
      'ARC-TESTNET': 'https://testnet.arcscan.app/tx/',
      'MONAD-TESTNET': 'https://testnet.monadvision.com/tx/',
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

    // For bridge transactions like "AVAX-FUJI → ARC-TESTNET", use only the first chain
    let chainForExplorer = chain;
    if (chain.includes('→')) {
      chainForExplorer = chain.split('→')[0].trim();
    } else if (chain.includes('->')) {
      chainForExplorer = chain.split('->')[0].trim();
    }

    const explorerBase = explorerMap[chainForExplorer];
    return explorerBase ? `${explorerBase}${txhash}` : '';
  };

  const getChainLogo = (chainId: string): string => {
    const chain = chains.find(c => c.id === chainId);
    return chain?.logo || '/placeholder-logo.svg';
  };

  const getBridgeChains = (tx: Transaction): { from: string; to: string } | null => {
    if (tx.bridged_to) {
      return { from: tx.chain, to: tx.bridged_to };
    }

    if (tx.chain.includes('→')) {
      const [from, to] = tx.chain.split('→').map((part) => part.trim());
      if (from && to) {
        return { from, to };
      }
    }

    if (tx.chain.includes('->')) {
      const [from, to] = tx.chain.split('->').map((part) => part.trim());
      if (from && to) {
        return { from, to };
      }
    }

    return null;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    });
  };

  const handleAttest = async (tx: Transaction) => {
    const email = getUserEmail();
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please login to attest transactions',
        variant: 'destructive',
      });
      return;
    }

    setAttesting(tx.txhash);

    try {
      const result = await attestTransaction(tx, email);
      
      if (result.success) {
        toast({
          title: 'Attestation initiated',
          description: result.message || 'Transaction attestation started',
          className: 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300',
        });
        
        // Refresh transactions after a short delay
        setTimeout(() => {
          fetchTransactions(0);
        }, 2000);
      } else {
        toast({
          title: 'Attestation failed',
          description: result.error || 'Failed to attest transaction',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Attestation error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setAttesting(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    setHasMore(true);
    try {
      await fetchTransactions(0, 5);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const txHash = detail.txHash;
      if (!txHash) return;

      let found = false;
      setTransactions((prev) =>
        prev.map((tx) => {
          if (tx.txhash !== txHash) return tx;
          found = true;
          return {
            ...tx,
            status: detail.status ?? tx.status,
            message: detail.message ?? tx.message,
            mintTxHash: detail.mintTxHash ?? tx.mintTxHash,
            burnTxHash: detail.burnTxHash ?? tx.burnTxHash,
            fromChain: detail.fromChain ?? tx.fromChain,
          };
        })
      );

      setSelectedTx((prev) => {
        if (!prev || prev.txhash !== txHash) return prev;
        return {
          ...prev,
          status: detail.status ?? prev.status,
          message: detail.message ?? prev.message,
          mintTxHash: detail.mintTxHash ?? prev.mintTxHash,
          burnTxHash: detail.burnTxHash ?? prev.burnTxHash,
          fromChain: detail.fromChain ?? prev.fromChain,
        };
      });

      if (!found) {
        fetchTransactions(0);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('tx-update', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('tx-update', handler as EventListener);
      }
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-mono">Recent Activity</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-mono border border-border rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh recent 5 transactions"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                Type
              </th>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                Details
              </th>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                Amount
              </th>
              <th className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                Chain
              </th>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                Status
              </th>
              <th className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="border-b border-border">
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <Skeleton className="h-4 w-4 rounded" />
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <Skeleton className="h-4 w-32 md:w-48" />
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <Skeleton className="h-4 w-16 md:w-20" />
                  </td>
                  <td className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                  <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-mono text-sm">
                  No recent transactions
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2">
                      {tx.txtype === 'OUT' ? (
                        <Send className="w-4 h-4 text-red-600" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div className="text-xs md:text-sm font-mono">
                      {tx.txtype === 'OUT' 
                        ? `Outgoing to ${tx.sender.slice(0, 6)}...${tx.sender.slice(-4)}`
                        : `Incoming from ${tx.sender.slice(0, 6)}...${tx.sender.slice(-4)}`
                      }
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div className="text-xs md:text-sm font-semibold font-mono">
                      ${formatAmount(tx.amount)}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2">
                      {getBridgeChains(tx) ? (
                        (() => {
                          const bridge = getBridgeChains(tx)!;
                          return (
                            <>
                              <div className="flex items-center justify-center" style={{ width: 28, height: 28 }}>
                                <Image
                                  src={getChainLogo(bridge.from)}
                                  alt={bridge.from}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <div className="flex items-center justify-center" style={{ width: 28, height: 28 }}>
                                <Image
                                  src={getChainLogo(bridge.to)}
                                  alt={bridge.to}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <div className="flex items-center justify-center" style={{ width: 28, height: 28 }}>
                          <Image
                            src={getChainLogo(tx.chain)}
                            alt={tx.chain}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs font-semibold font-mono capitalize ${getStatusColor(
                          tx.status
                        )}`}
                      >
                        {getStatusLabel(tx.status)}
                      </span>
                      {tx.status.trim().toLowerCase() === 'stuck' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAttest(tx);
                          }}
                          disabled={attesting === tx.txhash}
                          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Retry attestation"
                        >
                          {attesting === tx.txhash ? (
                            <svg className="w-4 h-4 text-purple-600 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                          ) : (
                            <Wand2 className="w-4 h-4 text-purple-600" />
                          )}
                        </button>
                      )}
                      {tx.status.trim().toLowerCase() === 'stuck_g' && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setAttesting(tx.txhash);
                            const userStr = localStorage.getItem('user');
                            const email = userStr ? JSON.parse(userStr).email : null;
                            const settleApiUrl = process.env.NEXT_PUBLIC_SETTLE_API_URL || 'http://localhost:8090';
                            try {
                              const url = `${settleApiUrl}/api/bridge/ARC-TESTNET/${encodeURIComponent(email)}`;
                              const res = await fetch(url, { method: 'GET' });
                              // Optionally handle response
                            } finally {
                              setAttesting(null);
                            }
                          }}
                          disabled={attesting === tx.txhash}
                          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Retry gateway deposit"
                        >
                          {attesting === tx.txhash ? (
                            <svg className="w-4 h-4 text-red-600 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                          ) : (
                            <Wand2 className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4">
                    <div className="text-xs md:text-sm text-muted-foreground font-mono">
                      {formatDate(tx.createdAt)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Load More Button */}
      {!loading && transactions.length > 0 && hasMore && (
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-2 px-4 border border-border rounded-lg font-mono hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-mono">Transaction Details</h2>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {selectedTx.txtype === 'OUT' ? (
                  <Send className="w-5 h-5 text-red-600" />
                ) : (
                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                )}
                <div>
                  <p className="text-sm font-mono font-semibold">
                    {selectedTx.txtype === 'OUT' 
                      ? `Outgoing to ${selectedTx.sender}`
                      : `Incoming from ${selectedTx.sender}`
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">Amount</p>
                  <p className="font-mono font-semibold">${formatAmount(selectedTx.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">Chain</p>
                  <p className="font-mono font-semibold capitalize">{selectedTx.chain}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-mono mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold font-mono capitalize ${getStatusColor(
                      selectedTx.status
                    )}`}
                  >
                    {getStatusLabel(selectedTx.status)}
                  </span>
                  {selectedTx.status.trim().toLowerCase() === 'stuck' && (
                    <button
                      onClick={() => handleAttest(selectedTx)}
                      disabled={attesting === selectedTx.txhash}
                      className="p-2 hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border"
                      title="Retry attestation"
                    >
                      {attesting === selectedTx.txhash ? (
                        <svg className="w-4 h-4 text-purple-600 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      ) : (
                        <Wand2 className="w-4 h-4 text-purple-600" />
                      )}
                    </button>
                  )}
                  {selectedTx.status.trim().toLowerCase() === 'stuck_g' && (
                    <button
                      onClick={async () => {
                        setAttesting(selectedTx.txhash);
                        const userStr = localStorage.getItem('user');
                        const email = userStr ? JSON.parse(userStr).email : null;
                        const settleApiUrl = process.env.NEXT_PUBLIC_SETTLE_API_URL || 'http://localhost:8090';
                        try {
                          const url = `${settleApiUrl}/api/bridge/ARC-TESTNET/${encodeURIComponent(email)}`;
                          const res = await fetch(url, { method: 'GET' });
                          // Optionally handle response
                        } finally {
                          setAttesting(null);
                        }
                      }}
                      disabled={attesting === selectedTx.txhash}
                      className="p-2 hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border"
                      title="Retry gateway deposit"
                    >
                      {attesting === selectedTx.txhash ? (
                        <svg className="w-4 h-4 text-red-600 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      ) : (
                        <Wand2 className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-mono mb-1">Date</p>
                <p className="font-mono text-sm">{formatDate(selectedTx.createdAt)}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground font-mono">Transaction Hash</p>
                  <button
                    onClick={() => copyToClipboard(selectedTx.txhash)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="Copy hash"
                  >
                    {copiedHash ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => {
                    const explorerUrl = getExplorerUrl(selectedTx.chain, selectedTx.txhash);
                    if (explorerUrl) {
                      window.open(explorerUrl, '_blank');
                    }
                  }}
                  disabled={!getExplorerUrl(selectedTx.chain, selectedTx.txhash)}
                  className="font-mono text-xs break-all text-primary hover:underline cursor-pointer text-left disabled:text-foreground/70 disabled:cursor-default disabled:hover:no-underline"
                >
                  {selectedTx.txhash}
                </button>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-mono mb-1">Sender</p>
                <p className="font-mono text-xs break-all text-foreground/70">{selectedTx.sender}</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
