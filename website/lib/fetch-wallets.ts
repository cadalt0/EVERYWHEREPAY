// lib/fetch-wallets.ts
import { getUserAddressesByGmail } from './db';

/**
 * Fetches wallet addresses for a user from the database by email (gmail).
 * Returns a map of chain to address, or null if not found.
 */
export async function fetchWalletsByEmail(email: string): Promise<Record<string, string> | null> {
  const user = await getUserAddressesByGmail(email);
  if (!user || !user.addresses) return null;
  // addresses is expected to be a JSON object: { chain: address, ... }
  try {
    const addresses = typeof user.addresses === 'string' ? JSON.parse(user.addresses) : user.addresses;
    return addresses && typeof addresses === 'object' ? addresses : null;
  } catch {
    return null;
  }
}
