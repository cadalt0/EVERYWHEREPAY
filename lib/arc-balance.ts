// lib/arc-balance.ts
// Query USDC balance for an EVM address on Arc Testnet via Circle Gateway API

export const ARC_DOMAIN = 26;

export async function fetchArcUsdcBalance(address: string): Promise<number | null> {
  const body = {
    token: 'USDC',
    sources: [
      {
        domain: ARC_DOMAIN,
        depositor: address,
      },
    ],
  };

  try {
    const res = await fetch('https://gateway-api-testnet.circle.com/v1/balances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!result.balances || !Array.isArray(result.balances) || result.balances.length === 0) {
      return null;
    }
    const balance = result.balances[0];
    return parseFloat(balance.balance);
  } catch (e) {
    return null;
  }
}
