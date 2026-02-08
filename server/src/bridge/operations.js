/**
 * CCTP Bridge Operations
 * Handles approve, burn, attestation retrieval, and mint operations
 */

import { randomUUID } from "crypto";
import { CCTP_CONTRACTS, parseUsdcAmount } from "./contracts.js";

const transferSpeed = (process.env.TRANSFER_SPEED || "STANDARD").toUpperCase();
const minFinalityThreshold = transferSpeed === "FAST" ? "1000" : "2000";
const defaultMaxFee = process.env.MAX_FEE || "1000000"; // 0.001 USDC

/**
 * Get wallet for a specific blockchain from Circle API
 */
export async function getWallet(client, walletSetId, blockchain) {
  const res = await client.listWallets({ 
    walletSetId, 
    blockchain, 
    pageSize: 10 
  });
  const wallet = res?.data?.wallets?.[0];
  if (!wallet) {
    throw new Error(`No wallet found for blockchain ${blockchain} in wallet set ${walletSetId}`);
  }
  return wallet;
}

/**
 * Wait for transaction to complete
 */
export async function waitForTransaction(client, txId, description) {
  console.log(`[Bridge] Waiting for ${description} to complete...`);

  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    const txResponse = await client.getTransaction({ id: txId });
    const txData = txResponse?.data?.transaction || txResponse?.data;
    const state = txData?.state;
    const txHash = txData?.txHash;

    console.log(`[Bridge] ${description} state: ${state}`);

    if (state === "COMPLETE" || state === "CONFIRMED") {
      console.log(`[Bridge] ✅ ${description} completed! TxHash: ${txHash}`);
      return txHash;
    }

    if (state === "FAILED") {
      console.error(`[Bridge] ❌ ${description} failed:`, JSON.stringify(txData, null, 2));
      throw new Error(`${description} failed`);
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
    attempts++;
  }

  throw new Error(`${description} timeout after ${maxAttempts * 3}s`);
}

/**
 * Step 1: Approve USDC spend by TokenMessenger
 */
export async function approveUSDC(client, fromWallet, fromChain, amount) {
  console.log(`[Bridge] Step 1: Approve USDC on ${fromChain}`);
  const contracts = CCTP_CONTRACTS[fromChain];
  const amountUnits = parseUsdcAmount(amount);

  const response = await client.createContractExecutionTransaction({
    idempotencyKey: randomUUID(),
    walletId: fromWallet.id,
    contractAddress: contracts.usdc,
    abiFunctionSignature: "approve(address,uint256)",
    abiParameters: [contracts.tokenMessenger, amountUnits],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const approvalId = response?.data?.id || response?.data?.transaction?.id;
  console.log(`[Bridge] Approval Transaction ID: ${approvalId}`);
  return approvalId;
}

/**
 * Step 2: Burn USDC on source chain
 */
export async function burnUSDC(client, fromWallet, fromChain, toChain, amount, recipientAddress) {
  console.log(`[Bridge] Step 2: Burn USDC on ${fromChain}`);
  const contracts = CCTP_CONTRACTS[fromChain];
  const destinationDomain = CCTP_CONTRACTS[toChain].domain;

  const recipientBytes32 = "0x000000000000000000000000" + recipientAddress.slice(2).toLowerCase();
  const destinationCallerBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

  const usdcAmount = parseUsdcAmount(amount);

  const response = await client.createContractExecutionTransaction({
    idempotencyKey: randomUUID(),
    walletId: fromWallet.id,
    contractAddress: contracts.tokenMessenger,
    abiFunctionSignature: "depositForBurn(uint256,uint32,bytes32,address,bytes32,uint256,uint32)",
    abiParameters: [
      usdcAmount,
      destinationDomain.toString(),
      recipientBytes32,
      contracts.usdc,
      destinationCallerBytes32,
      defaultMaxFee,
      minFinalityThreshold,
    ],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const burnId = response?.data?.id || response?.data?.transaction?.id;
  console.log(`[Bridge] Burn Transaction ID: ${burnId}`);
  return burnId;
}

/**
 * Step 3: Retrieve attestation from Circle's Iris API
 */
export async function retrieveAttestation(sourceDomain, burnTxHash) {
  console.log(`[Bridge] Step 3: Retrieve Attestation for tx ${burnTxHash}`);

  const url = `https://iris-api-sandbox.circle.com/v2/messages/${sourceDomain}?transactionHash=${burnTxHash}`;

  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    const response = await fetch(url, { method: "GET" });
    if (response.ok) {
      const data = await response.json();
      if (data?.messages?.[0]?.status === "complete") {
        console.log("[Bridge] ✅ Attestation retrieved!");
        return data.messages[0];
      }
    }

    console.log(`[Bridge] Waiting for attestation... (attempt ${attempts + 1}/${maxAttempts})`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error("Attestation timeout - transaction may still be pending");
}

/**
 * Step 4: Mint USDC on destination chain
 */
export async function mintUSDC(client, toWallet, toChain, attestation) {
  console.log(`[Bridge] Step 4: Mint USDC on ${toChain}`);
  const contracts = CCTP_CONTRACTS[toChain];

  const response = await client.createContractExecutionTransaction({
    idempotencyKey: randomUUID(),
    walletId: toWallet.id,
    contractAddress: contracts.messageTransmitter,
    abiFunctionSignature: "receiveMessage(bytes,bytes)",
    abiParameters: [attestation.message, attestation.attestation],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const mintId = response?.data?.id || response?.data?.transaction?.id;
  console.log(`[Bridge] Mint Transaction ID: ${mintId}`);
  return mintId;
}
