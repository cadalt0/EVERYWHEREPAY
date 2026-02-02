type Wallet = { chain: string; address: string };

declare global {
  interface Window {
    __userWallets?: Wallet[];
    __userWalletsPromise?: Promise<Wallet[]>;
    __userWalletsFetchedAt?: number;
  }
}

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

const SUPPORTED_CHAINS = [
  'ARC-TESTNET',
  'AVAX-FUJI',
  'BASE-SEPOLIA',
  'ARB-SEPOLIA',
  'ETH-SEPOLIA',
  'MATIC-AMOY',
  'MONAD-TESTNET',
  'OP-SEPOLIA',
  'UNI-SEPOLIA',
  'CELO-ALFAJORES',
  'LINEA-SEPOLIA'
];

export async function getUserWallets(email: string): Promise<Wallet[]> {
  if (typeof window === 'undefined') return [];

  const now = Date.now();
  if (window.__userWallets && window.__userWalletsFetchedAt && (now - window.__userWalletsFetchedAt) < CACHE_TTL_MS) {
    return window.__userWallets;
  }

  if (window.__userWalletsPromise) {
    return window.__userWalletsPromise;
  }

  console.log('[getUserWallets] Calling proxy API for email:', email);

  window.__userWalletsPromise = fetch(`/api/fetch-wallets-proxy?email=${encodeURIComponent(email)}`)
    .then((res) => res.json())
    .then((data) => {
      console.log('[getUserWallets] Proxy API response:', data);
      const address = data?.address || '';
      if (!address) {
        console.error('No address returned from wallets API');
        return [];
      }

      // Use same address for all supported chains
      const wallets: Wallet[] = SUPPORTED_CHAINS.map(chain => ({
        chain,
        address
      }));

      console.log('[getUserWallets] Generated wallets for all chains:', wallets.length);
      window.__userWallets = wallets;
      window.__userWalletsFetchedAt = Date.now();
      return wallets;
    })
    .catch((err) => {
      console.error('Failed to fetch wallets from proxy API:', err);
      return [];
    })
    .finally(() => {
      window.__userWalletsPromise = undefined;
    });

  return window.__userWalletsPromise;
}
