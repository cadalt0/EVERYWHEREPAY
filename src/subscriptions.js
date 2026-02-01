import { WebSocketProvider, Contract, formatUnits } from 'ethers';
import { chainConfigs, ERC20_ABI } from './config.js';
import { getUserByGmail, saveTxcoming } from './db.js';

const providerCache = new Map();
const contractCache = new Map();
const listenerAttached = new Set();

export const getProvider = (chain) => {
  if (!providerCache.has(chain)) {
    const config = chainConfigs[chain];
    const provider = new WebSocketProvider(config.wssUrl);
    provider.on('error', (err) => {
      console.error(`Provider error for ${chain}:`, err);
      if (err.message && err.message.includes('401')) {
        console.error('Authentication failed. Check your ALCHEMY_KEY in .env file.');
      }
    });
    providerCache.set(chain, provider);
  }
  return providerCache.get(chain);
};

export const getUsdcContract = (chain) => {
  if (!contractCache.has(chain)) {
    const config = chainConfigs[chain];
    const provider = getProvider(chain);
    const contract = new Contract(config.usdcAddress, ERC20_ABI, provider);
    contractCache.set(chain, contract);
  }
  return contractCache.get(chain);
};

export const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

export const ensureChainListener = (chain, wss, clientState) => {
  if (listenerAttached.has(chain)) {
    return;
  }
  listenerAttached.add(chain);

  const contract = getUsdcContract(chain);
  contract.on('Transfer', (from, to, value, event) => {
    const formattedValue = formatUnits(value, 6);
    const transfer = {
      chain,
      from,
      to,
      value: formattedValue,
      txHash: event?.log?.transactionHash,
      blockNumber: event?.log?.blockNumber
    };
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();
    let matched = false;
    wss.clients.forEach((client) => {
      if (client.readyState !== 1) {
        return;
      }
      const state = clientState.get(client);
      if (!state || !state.chains.has(chain) || !state.watchAddress || !state.email) {
        return;
      }
      const watch = state.watchAddress;
      if (fromLower === watch || toLower === watch) {
        client.send(JSON.stringify({ type: 'usdc_transfer', data: transfer }));
        if (transfer.txHash) {
          void (async () => {
            try {
              console.log('Processing transaction for:', state.email);
              const user = await getUserByGmail(state.email);
              if (!user || !user.walletSetId || !user.addresses) {
                console.error('User not found or missing walletSetId/addresses for email:', state.email);
                return;
              }
              console.log('User found:', { walletSetId: user.walletSetId, addressCount: Object.keys(user.addresses).length });
              const addressValues = Object.values(user.addresses || {}).filter((v) => typeof v === 'string');
              const expectedAddress = addressValues.length > 0 ? addressValues[0] : null;
              if (!expectedAddress) {
                console.error('Missing addresses for user:', state.email);
                return;
              }
              console.log('Expected address:', expectedAddress, 'Receiver:', transfer.to, 'WatchAddress:', state.watchAddress);
              const expectedLower = expectedAddress.toLowerCase();
              const receiverLower = transfer.to.toLowerCase();
              if (receiverLower !== expectedLower || receiverLower !== state.watchAddress) {
                console.error('Receiver address mismatch:', { expectedLower, receiverLower, watchAddress: state.watchAddress, email: state.email });
                return;
              }
              console.log('Address validation passed. Saving transaction...');
              await saveTxcoming({
                mail: state.email,
                walletid: user.walletSetId,
                txhash: transfer.txHash,
                amount: transfer.value,
                chain: transfer.chain,
                sender: transfer.from,
                status: 'pending'
              });
              console.log('Transaction saved successfully:', transfer.txHash);
            } catch (err) {
              console.error('Failed to save transaction:', err);
            }
          })();
        }
        matched = true;
      }
    });
    // Only log if the transfer matched a subscribed address
    if (matched) {
      console.log('USDC Transfer:', transfer);
    }
  });
};