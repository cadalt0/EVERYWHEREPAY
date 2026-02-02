/**
 * CCTP Contract Addresses and Chain Mappings
 * Sources:
 * - CCTP Contract Addresses: https://developers.circle.com/cctp/references/contract-addresses.md
 * - USDC Contract Addresses: https://developers.circle.com/stablecoins/usdc-contract-addresses.md
 * - CCTP Domains: https://developers.circle.com/cctp/concepts/supported-chains-and-domains.md
 */

export const CCTP_CONTRACTS = {
  "ETH-SEPOLIA": {
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    domain: 0,
  },
  "AVAX-FUJI": {
    usdc: "0x5425890298aed601595a70AB815c96711a31Bc65",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    domain: 1,
  },
  "OP-SEPOLIA": {
    usdc: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    domain: 2,
  },
  "ARB-SEPOLIA": {
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    domain: 3,
  },
  "BASE-SEPOLIA": {
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    domain: 6,
  },
  "MATIC-AMOY": {
    usdc: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    domain: 7,
  },
  "UNI-SEPOLIA": {
    usdc: "0x31d0220469e10c4E71834a79b1f276d740d3768F",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    domain: 10,
  },
  "MONAD-TESTNET": {
    usdc: "0x534b2f3A21130d7a60830c2Df862319e593943A3",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    domain: 15,
  },
  "ARC-TESTNET": {
    usdc: "0x3600000000000000000000000000000000000000",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    domain: 26,
  },
};

export const chainMap = {
  "ETH-SEPOLIA": "ETH-SEPOLIA",
  "ETHEREUM-SEPOLIA": "ETH-SEPOLIA",
  "AVAX-FUJI": "AVAX-FUJI",
  "AVALANCHE-FUJI": "AVAX-FUJI",
  "OP-SEPOLIA": "OP-SEPOLIA",
  "OPTIMISM-SEPOLIA": "OP-SEPOLIA",
  "ARB-SEPOLIA": "ARB-SEPOLIA",
  "ARBITRUM-SEPOLIA": "ARB-SEPOLIA",
  "BASE-SEPOLIA": "BASE-SEPOLIA",
  "MATIC-AMOY": "MATIC-AMOY",
  "POLYGON-AMOY": "MATIC-AMOY",
  "UNI-SEPOLIA": "UNI-SEPOLIA",
  "UNICHAIN-SEPOLIA": "UNI-SEPOLIA",
  "MONAD-TESTNET": "MONAD-TESTNET",
  "ARC-TESTNET": "ARC-TESTNET",
};

export function normalizeChainName(chainInput) {
  const normalized = chainMap[chainInput.toUpperCase()];
  if (!normalized || !CCTP_CONTRACTS[normalized]) {
    throw new Error(`Invalid or unsupported chain: ${chainInput}. Supported: ${Object.keys(CCTP_CONTRACTS).join(", ")}`);
  }
  return normalized;
}

export function parseUsdcAmount(amountStr) {
  const [whole, fraction = ""] = amountStr.split(".");
  const fractionPadded = (fraction + "000000").slice(0, 6);
  const normalized = `${whole}${fractionPadded}`.replace(/^0+/, "") || "0";
  return normalized;
}
