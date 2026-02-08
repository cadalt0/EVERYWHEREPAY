/**
 * Circle Gateway Configuration for ARC-TESTNET
 * Reference: https://developers.circle.com/gateway
 */

// Gateway Wallet contract address (same across all chains)
export const GATEWAY_WALLET_ADDRESS = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";

// USDC address on ARC-TESTNET
export const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

// Gateway Wallet ABI (only deposit function needed)
export const GATEWAY_WALLET_ABI = [
  {
    type: "function",
    name: "deposit",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "value",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
];

// ERC20 Approve ABI
export const ERC20_APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      {
        name: "spender",
        type: "address",
        internalType: "address",
      },
      {
        name: "value",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
];
