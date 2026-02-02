import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import { chains } from '@/lib/mock-data';

// USDC contract ABI (balanceOf only)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)'
];

// Chain config: { id, rpcUrl, usdcAddress }
const chainConfigs = {
  'ARC-TESTNET': {
    rpcUrl: 'https://arc-testnet.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x3600000000000000000000000000000000000000',
  },
  'AVAX-FUJI': {
    rpcUrl: 'https://avax-fuji.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x5425890298aed601595a70AB815c96711a31Bc65',
  },
  'BASE-SEPOLIA': {
    rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
  'ARB-SEPOLIA': {
    rpcUrl: 'https://arb-sepolia.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  },
  'ETH-SEPOLIA': {
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },
  'MATIC-AMOY': {
    rpcUrl: 'https://polygon-amoy.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
  },
  'MONAD-TESTNET': {
    rpcUrl: 'https://monad-testnet.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x534b2f3A21130d7a60830c2Df862319e593943A3',
  },
  'OP-SEPOLIA': {
    rpcUrl: 'https://opt-sepolia.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
  },
  'UNI-SEPOLIA': {
    rpcUrl: 'https://unichain-sepolia.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId, address } = req.query;
  if (!chainId || !address) {
    const errorResp = { error: 'Missing chainId or address' };
    console.log('API response:', errorResp);
    return res.status(400).json(errorResp);
  }

  const config = chainConfigs[chainId as keyof typeof chainConfigs];
  if (!config) {
    const errorResp = { error: 'Unsupported chain' };
    console.log('API response:', errorResp);
    return res.status(400).json(errorResp);
  }

  try {
    console.log(`Checking USDC balance for address: ${address} on chain: ${chainId}`);
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const usdc = new ethers.Contract(config.usdcAddress, ERC20_ABI, provider);
    const balance = await usdc.balanceOf(address);
    const formatted = ethers.formatUnits(balance, 6);
    const resp = { balance: formatted };
    console.log('API response:', resp);
    return res.status(200).json(resp);
  } catch (err) {
    const errorResp = { error: 'Failed to fetch balance', details: String(err) };
    console.log('API response:', errorResp);
    return res.status(500).json(errorResp);
  }
}
