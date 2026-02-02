/**
 * CCTP V2 Engine CLI Wrapper
 * Supports the 9 testnet chains:
 * ARB-SEPOLIA, ARC-TESTNET, AVAX-FUJI, BASE-SEPOLIA,
 * ETH-SEPOLIA, MONAD-TESTNET, OP-SEPOLIA, MATIC-AMOY, UNI-SEPOLIA
 *
 * Usage: node engine.js <FROM_CHAIN> <TO_CHAIN> <AMOUNT>
 * Example: node engine.js BASE-SEPOLIA ARC-TESTNET 1.0
 *
 * Resume Mode: node engine.js <FROM_CHAIN> <TO_CHAIN> <BURN_TX_HASH>
 * Example: node engine.js BASE-SEPOLIA ARC-TESTNET 0xabc123...
 */

import "dotenv/config";
import { bridgeToArc, resumeBridge } from "./src/bridge/engine.js";

const WALLET_SET_ID = process.env.WALLET_SET_ID;

if (!WALLET_SET_ID) {
  console.error("❌ Missing WALLET_SET_ID in .env");
  process.exit(1);
}




async function main() {
  const fromChainInput = process.argv[2];
  const toChainInput = process.argv[3];
  const amountOrTxHash = process.argv[4] || "1.0";

  if (!fromChainInput || !toChainInput) {
    console.error("Usage: node engine.js <FROM_CHAIN> <TO_CHAIN> <AMOUNT>");
    console.error("Example: node engine.js ARB-SEPOLIA ARC-TESTNET 1.0");
    console.error("\nResume Mode:");
    console.error("Usage: node engine.js <FROM_CHAIN> <TO_CHAIN> <BURN_TX_HASH>");
    console.error("Example: node engine.js ARB-SEPOLIA ARC-TESTNET 0xabc123...");
    process.exit(1);
  }

  try {
    // Detect resume mode: if 4th arg looks like a tx hash (0x + 64 hex chars)
    const isResumeMode = amountOrTxHash.startsWith("0x") && amountOrTxHash.length === 66;

    if (isResumeMode) {
      const result = await resumeBridge(fromChainInput, amountOrTxHash, WALLET_SET_ID, toChainInput);
      console.log("\n✅ Bridge Result:", JSON.stringify(result, null, 2));
    } else {
      const result = await bridgeToArc(fromChainInput, amountOrTxHash, WALLET_SET_ID, toChainInput);
      console.log("\n✅ Bridge Result:", JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("\n❌ Bridge Failed:", error?.message || error);
    process.exit(1);
  }
}

main();

