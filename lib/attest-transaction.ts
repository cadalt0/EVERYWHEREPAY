export interface AttestResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface Transaction {
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

export async function attestTransaction(
  tx: Transaction,
  email: string
): Promise<AttestResult> {
  try {
    const settleApiUrl = process.env.NEXT_PUBLIC_SETTLE_API_URL || 'http://localhost:8090';
    
    // Convert chain format: "BASE-SEPOLIA → ARC-TESTNET" to "BASE_SEPOLIA-ARC_TESTNET"
    // Replace hyphens with underscores within chain names, and connect chains with single hyphen
    const formattedChain = tx.chain
      .split(/\s*(?:→|->)\s*/)
      .map(part => part.trim().replace(/-/g, '_'))
      .join('-');
    
    const url = `${settleApiUrl}/api/attest/${tx.txhash}/${formattedChain}/${encodeURIComponent(email)}`;
    
    console.log('========================================');
    console.log('ATTEST API REQUEST:');
    console.log('URL:', url);
    console.log('Method: GET');
    console.log('Headers:', { 'Content-Type': 'application/json' });
    console.log('========================================');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      return {
        success: false,
        error: 'Server returned non-JSON response. Check API endpoint.',
      };
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Attestation failed',
      };
    }
    
    return {
      success: true,
      message: data.message || 'Attestation successful',
    };
  } catch (err) {
    console.error('Attest transaction error:', err);
    return {
      success: false,
      error: String(err),
    };
  }
}

export function getUserEmail(): string | null {
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
