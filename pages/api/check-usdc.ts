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
  const { chainId, address, fromTimestamp } = req.query;
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
    console.log(`Checking USDC for address: ${address} on chain: ${chainId}`);
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const usdc = new ethers.Contract(config.usdcAddress, ERC20_ABI, provider);
    // Only return the latest USDC transfer to this address after fromTimestamp (if provided)
    const filter = {
      address: config.usdcAddress,
      topics: [
        ethers.id('Transfer(address,address,uint256)'),
        null,
        ethers.zeroPadValue(address, 32)
      ]
    };
    let fromBlock = 'latest';
    if (fromTimestamp) {
      // Estimate block number from timestamp
      const ts = Number(fromTimestamp);
      const latestBlock = await provider.getBlock('latest');
      let block = latestBlock.number;
      // Walk back to find a block with timestamp <= fromTimestamp
      while (block > 0) {
        const b = await provider.getBlock(block);
        if (b.timestamp <= ts) break;
        block -= 10; // step back 10 blocks at a time for speed
      }
      fromBlock = block;
    }
    const logs = await provider.getLogs({ ...filter, fromBlock, toBlock: 'latest' });
    // Only consider logs after fromTimestamp
    let foundLog = null;
    let txHash = '';
    let fromWho = '';
    let amount = '';
    if (logs.length > 0) {
      for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];
        const blockTs = (await provider.getBlock(log.blockNumber)).timestamp;
        if (!fromTimestamp || blockTs >= Number(fromTimestamp)) {
          foundLog = log;
          break;
        }
      }
      if (foundLog) {
        txHash = foundLog.transactionHash;
        fromWho = '0x' + foundLog.topics[1].slice(26);
        // decode amount from log.data
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], foundLog.data);
        amount = (Number(decoded[0]) / 1e6).toString();
      }
    }
    let resp;
    if (foundLog) {
      resp = { result: `${amount}:${txHash}:${chainId}:${fromWho}` };
    } else {
      resp = { result: 'NA' };
    }
    console.log('API response:', resp);
    return res.status(200).json(resp);
  } catch (err) {
    const errorResp = { error: 'Failed to fetch balance', details: String(err) };
    console.log('API response:', errorResp);
    return res.status(500).json(errorResp);
  }
}
