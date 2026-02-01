export const chainConfigs = {
  'ARC-TESTNET': {
    wssUrl: 'wss://arc-testnet.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x3600000000000000000000000000000000000000'
  },
  'AVAX-FUJI': {
    wssUrl: 'wss://avax-fuji.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x5425890298aed601595a70AB815c96711a31Bc65'
  },
  'BASE-SEPOLIA': {
    wssUrl: 'wss://base-sepolia.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
  },
  'ARB-SEPOLIA': {
    wssUrl: 'wss://arb-sepolia.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'
  },
  'ETH-SEPOLIA': {
    wssUrl: 'wss://eth-sepolia.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  },
  'MATIC-AMOY': {
    wssUrl: 'wss://polygon-amoy.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582'
  },
  'MONAD-TESTNET': {
    wssUrl: 'wss://monad-testnet.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x534b2f3A21130d7a60830c2Df862319e593943A3'
  },
  'OP-SEPOLIA': {
    wssUrl: 'wss://opt-sepolia.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7'
  },
  'UNI-SEPOLIA': {
    wssUrl: 'wss://unichain-sepolia.g.alchemy.com/v2/' + process.env.ALCHEMY_KEY,
    usdcAddress: '0x31d0220469e10c4E71834a79b1f276d740d3768F'
  }
};

export const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];