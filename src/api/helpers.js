/**
 * Bridge API Helper - Get USDC Balance
 */

import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const API_KEY = process.env.CIRCLE_API_KEY;
const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET || process.env.ENTITY_SECRET;

/**
 * Get user's USDC balance on a specific chain
 * 
 * @param {string} chain - Chain name (e.g., "BASE-SEPOLIA")
 * @param {string} walletSetId - User's wallet set ID
 * @returns {Promise<string>} USDC balance as string (e.g., "10.5")
 */
export async function getUsdcBalance(chain, walletSetId) {
  const client = initiateDeveloperControlledWalletsClient({
    apiKey: API_KEY,
    entitySecret: ENTITY_SECRET,
  });

  // Get wallet for the chain
  const res = await client.listWallets({ 
    walletSetId, 
    blockchain: chain, 
    pageSize: 10 
  });
  
  const wallet = res?.data?.wallets?.[0];
  if (!wallet) {
    throw new Error(`No wallet found for blockchain ${chain} in wallet set ${walletSetId}`);
  }

  // Get wallet balances
  const balancesRes = await client.getWalletTokenBalance({
    id: wallet.id,
  });

  // Find USDC balance (check for both "USDC" and "USDC-TESTNET")
  const tokenBalances = balancesRes?.data?.tokenBalances || [];
  const usdcBalance = tokenBalances.find(
    (b) => b.token?.symbol === "USDC" || b.token?.symbol === "USDC-TESTNET"
  );

  if (!usdcBalance || !usdcBalance.amount) {
    return "0";
  }

  // Circle SDK already returns amount in decimal format
  return usdcBalance.amount.toString();
}
