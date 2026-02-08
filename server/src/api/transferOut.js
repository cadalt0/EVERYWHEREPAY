import { randomBytes } from 'crypto';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

const chainConfig = {
  'BASE-SEPOLIA': {
    chainName: 'Base Sepolia',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    domain: 6,
    walletChain: 'BASE-SEPOLIA',
  },
  'ARC-TESTNET': {
    chainName: 'Arc Testnet',
    usdc: '0x3600000000000000000000000000000000000000',
    domain: 26,
    walletChain: 'ARC-TESTNET',
  },
  'AVAX-FUJI': {
    chainName: 'Avalanche Fuji',
    usdc: '0x5425890298aed601595a70AB815c96711a31Bc65',
    domain: 1,
    walletChain: 'AVAX-FUJI',
  },
  'ETH-SEPOLIA': {
    chainName: 'Ethereum Sepolia',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    domain: 0,
    walletChain: 'ETH-SEPOLIA',
  },
};

const GATEWAY_WALLET_ADDRESS = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9';
const GATEWAY_MINTER_ADDRESS = '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B';
const MAX_UINT256_DEC = (BigInt(1) << BigInt(256)) - BigInt(1);

const DEPOSITOR_ADDRESS = '0x91c3b5a5334d163958a8f60d4556ac5b4bcf717a';
const DELEGATE_WALLET_ADDRESS = '0x33a4f74d44225272fa0e75a11efa68af79b325f5';
const MAX_FEE = BigInt(2010000);

const domain = { name: 'GatewayWallet', version: '1' };
const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
];
const TransferSpec = [
  { name: 'version', type: 'uint32' },
  { name: 'sourceDomain', type: 'uint32' },
  { name: 'destinationDomain', type: 'uint32' },
  { name: 'sourceContract', type: 'bytes32' },
  { name: 'destinationContract', type: 'bytes32' },
  { name: 'sourceToken', type: 'bytes32' },
  { name: 'destinationToken', type: 'bytes32' },
  { name: 'sourceDepositor', type: 'bytes32' },
  { name: 'destinationRecipient', type: 'bytes32' },
  { name: 'sourceSigner', type: 'bytes32' },
  { name: 'destinationCaller', type: 'bytes32' },
  { name: 'value', type: 'uint256' },
  { name: 'salt', type: 'bytes32' },
  { name: 'hookData', type: 'bytes' },
];
const BurnIntent = [
  { name: 'maxBlockHeight', type: 'uint256' },
  { name: 'maxFee', type: 'uint256' },
  { name: 'spec', type: 'TransferSpec' },
];

function addressToBytes32(address) {
  return (
    '0x' + address.toLowerCase().replace(/^0x/, '').padStart(64, '0')
  );
}

function parseBalance(value) {
  const str = String(value ?? '0');
  const [whole, decimal = ''] = str.split('.');
  const decimal6 = (decimal + '000000').slice(0, 6);
  return BigInt((whole || '0') + decimal6);
}

function stringifyTypedData(obj) {
  return JSON.stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
}

function burnIntentTypedData(burnIntent, domain) {
  return {
    types: { EIP712Domain, TransferSpec, BurnIntent },
    domain,
    primaryType: 'BurnIntent',
    message: {
      ...burnIntent,
      spec: {
        ...burnIntent.spec,
        sourceContract: addressToBytes32(burnIntent.spec.sourceContract),
        destinationContract: addressToBytes32(burnIntent.spec.destinationContract),
        sourceToken: addressToBytes32(burnIntent.spec.sourceToken),
        destinationToken: addressToBytes32(burnIntent.spec.destinationToken),
        sourceDepositor: addressToBytes32(burnIntent.spec.sourceDepositor),
        destinationRecipient: addressToBytes32(burnIntent.spec.destinationRecipient),
        sourceSigner: addressToBytes32(burnIntent.spec.sourceSigner),
        destinationCaller: addressToBytes32(
          burnIntent.spec.destinationCaller ?? '0x0000000000000000000000000000000000000000'
        ),
      },
    },
  };
}

export async function transferOutUSDC({ amount, destinationChain, recipientAddress }) {
  const API_KEY = process.env.CIRCLE_API_KEY;
  const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;
  if (!API_KEY || !ENTITY_SECRET) {
    throw new Error('Missing CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET in environment');
  }
  const allowedDestinations = ['BASE-SEPOLIA', 'ARC-TESTNET', 'AVAX-FUJI', 'ETH-SEPOLIA'];
  const normalizedChain = destinationChain.trim().toUpperCase();
  const match = allowedDestinations.find(c => c.toUpperCase() === normalizedChain);
  if (!match) {
    throw new Error(`Invalid destination chain. Must be one of: ${allowedDestinations.join(', ')}`);
  }
  console.log(`[TransferOut] Initiating transfer from Arc to ${match} for ${amount} USDC to ${recipientAddress}`);
  const client = initiateDeveloperControlledWalletsClient({
    apiKey: API_KEY,
    entitySecret: ENTITY_SECRET,
  });
  const burnIntent = {
    maxBlockHeight: MAX_UINT256_DEC.toString(),
    maxFee: MAX_FEE,
    spec: {
      version: 1,
      sourceDomain: chainConfig['ARC-TESTNET'].domain,
      destinationDomain: chainConfig[match].domain,
      sourceContract: GATEWAY_WALLET_ADDRESS,
      destinationContract: GATEWAY_MINTER_ADDRESS,
      sourceToken: chainConfig['ARC-TESTNET'].usdc,
      destinationToken: chainConfig[match].usdc,
      sourceDepositor: DEPOSITOR_ADDRESS,
      destinationRecipient: recipientAddress,
      sourceSigner: DELEGATE_WALLET_ADDRESS,
      destinationCaller: '0x0000000000000000000000000000000000000000',
      value: parseBalance(amount),
      salt: '0x' + randomBytes(32).toString('hex'),
      hookData: '0x',
    },
  };
  console.log('[TransferOut] Burn intent prepared:', JSON.stringify(burnIntent, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  const typedData = burnIntentTypedData(burnIntent, domain);
  console.log('[TransferOut] Signing typed data...');
  const sigResp = await client.signTypedData({
    walletAddress: DELEGATE_WALLET_ADDRESS,
    blockchain: chainConfig['ARC-TESTNET'].walletChain,
    data: stringifyTypedData(typedData),
  });
  console.log('[TransferOut] Signature response:', sigResp.data?.signature);
  const requests = [
    {
      burnIntent: typedData.message,
      signature: sigResp.data?.signature,
    },
  ];
  console.log('[TransferOut] Sending transfer request to Circle Gateway API...');
  const response = await fetch(
    'https://gateway-api-testnet.circle.com/v1/transfer',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: stringifyTypedData(requests),
    }
  );
  if (!response.ok) {
    const errText = await response.text();
    console.error('[TransferOut] Gateway API error:', errText);
    throw new Error(`Gateway API error status: ${response.status}\n${errText}`);
  }
  const json = await response.json();
  console.log('[TransferOut] Gateway API response:', JSON.stringify(json, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  const attestation = json?.attestation;
  const operatorSig = json?.signature;
  if (!attestation || !operatorSig) {
    console.error('[TransferOut] Missing attestation or operator signature');
    throw new Error('Gateway /transfer error: missing attestation or signature');
  }
  console.log(`[TransferOut] Minting funds on ${chainConfig[match].chainName}...`);
  const tx = await client.createContractExecutionTransaction({
    walletAddress: DEPOSITOR_ADDRESS,
    blockchain: chainConfig[match].walletChain,
    contractAddress: GATEWAY_MINTER_ADDRESS,
    abiFunctionSignature: 'gatewayMint(bytes,bytes)',
    abiParameters: [attestation, operatorSig],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
  });
  console.log('[TransferOut] Mint transaction submitted:', tx.data?.id);
  const txId = tx.data?.id;
  if (!txId) throw new Error('Failed to submit mint transaction');
  return {
    success: true,
    txId,
    destinationChain: chainConfig[match].chainName,
    recipientAddress,
    attestation,
    operatorSig,
  };
}
