import { getUserWallets } from './client-wallets';

export interface BalanceCheckResult {
  balance: string;
  bridgeData?: {
    success: boolean;
    chain: string;
    email: string;
    amount: string;
    burnTxHash?: string;
    mintTxHash?: string;
    gatewayApproveTxHash?: string;
    gatewayDepositTxHash?: string;
    status?: string;
  };
  error?: string;
}

export async function checkChainBalance(
  chainId: string,
  email: string,
  walletAddress: string
): Promise<BalanceCheckResult> {
  try {
    // Step 1: Check USDC balance via Alchemy RPC
    const balanceRes = await fetch(
      `/api/check-usdc?chainId=${encodeURIComponent(chainId)}&address=${encodeURIComponent(walletAddress)}`
    );
    const balanceData = await balanceRes.json();

    if (!balanceRes.ok || balanceData.error) {
      throw new Error(balanceData.error || 'Failed to fetch balance');
    }

    // Balance is already formatted with 6 decimals from API
    const balanceValue = Number(balanceData.balance);
    const balance = `${balanceData.balance} USDC`;

    // Step 2: Only call settle API for bridge if balance >= 0.1 USDC
    // USDC has 6 decimals, so 0.1 USDC = 0.1
    if (balanceValue >= 0.1) {
      const settleApiUrl = process.env.NEXT_PUBLIC_SETTLE_API_URL || 'http://localhost:8090';
      const bridgeRes = await fetch(
        `${settleApiUrl}/api/bridge/${chainId.toLowerCase()}/${encodeURIComponent(email)}`
      );
      const bridgeData = await bridgeRes.json();

      console.log('Bridge API response:', bridgeData);

      return {
        balance,
        bridgeData: bridgeData.success ? bridgeData : undefined,
      };
    }

    // Balance is less than 0.1 USDC, skip bridge API call
    return {
      balance,
    };
  } catch (err) {
    return {
      balance: '0 USDC',
      error: String(err),
    };
  }
}

export async function getUserEmail(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr);
    return user.email || null;
  } catch {
    return null;
  }
}

export async function getWalletsForUser(email: string) {
  try {
    const wallets = await getUserWallets(email);
    return wallets.reduce((acc, w) => {
      acc[w.chain] = w.address;
      return acc;
    }, {} as Record<string, string>);
  } catch {
    return {};
  }
}
