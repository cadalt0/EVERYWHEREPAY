import { WebSocketProvider, Contract, formatUnits } from 'ethers';
import { chainConfigs, ERC20_ABI } from './config.js';
import { getUserByGmail, saveTxcoming, updateTxcomingStatus } from './db.js';
import { bridgeToArc } from './bridge/engine.js';
import { depositToGatewayWallet } from './gateway/deposit.js';

const providerCache = new Map();
const contractCache = new Map();
const addressListenerAttached = new Set();
const pendingConnections = new Map(); // Track pending connections to avoid duplicates
const nativeBalanceCache = new Map();
const nativeProcessedTx = new Set();
let connectionDelay = 0; // Stagger connections to avoid rate limits

export const getProvider = async (chain) => {
  // If already cached, return immediately
  if (providerCache.has(chain)) {
    return providerCache.get(chain);
  }

  // If connection is pending, wait for it
  if (pendingConnections.has(chain)) {
    return await pendingConnections.get(chain);
  }

  // Add staggered delay to avoid rate limits (500ms per connection)
  const delay = connectionDelay;
  connectionDelay += 500;
  
  const connectionPromise = new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[Provider] Connecting to ${chain}...`);
      const config = chainConfigs[chain];
      const provider = new WebSocketProvider(config.wssUrl);
      
      provider.on('error', (err) => {
        console.error(`[Provider] Error for ${chain}:`, err.message || err);
        if (err.message && err.message.includes('401')) {
          console.error('[Provider] Authentication failed. Check your ALCHEMY_KEY in .env file.');
        } else if (err.message && err.message.includes('429')) {
          console.error('[Provider] Rate limit exceeded for Alchemy. Retrying later...');
          // Remove from cache so it can retry later
          providerCache.delete(chain);
        }
      });
      
      provider._websocket?.on('error', (err) => {
        console.error(`[WebSocket] Connection error for ${chain}:`, err.message || err);
      });
      
      provider._websocket?.on('close', () => {
        console.log(`[Provider] WebSocket closed for ${chain}. Will reconnect on next use.`);
        providerCache.delete(chain);
      });
      
      providerCache.set(chain, provider);
      pendingConnections.delete(chain);
      resolve(provider);
    }, delay);
  });

  pendingConnections.set(chain, connectionPromise);
  return await connectionPromise;
};

export const getUsdcContract = async (chain) => {
  if (!contractCache.has(chain)) {
    const config = chainConfigs[chain];
    const provider = await getProvider(chain);
    const contract = new Contract(config.usdcAddress, ERC20_ABI, provider);
    contractCache.set(chain, contract);
  }
  return contractCache.get(chain);
};

export const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

export const ensureAddressListener = async (chain, address, wss, clientState) => {
  const addressLower = (address || '').toLowerCase();
  const key = `${chain}:${addressLower}`;
  if (addressListenerAttached.has(key)) {
    return;
  }
  addressListenerAttached.add(key);

  if (chain === 'ARC-TESTNET') {
    return await attachArcNativeListener(chain, addressLower, wss, clientState, key);
  }

  try {
    const contract = await getUsdcContract(chain);
    console.log(`[Listener] Attaching to ${chain} for address ${addressLower} (Contract: ${chainConfigs[chain].usdcAddress})...`);
    
    try {
      const filter = contract.filters.Transfer(null, addressLower);
      contract.on(filter, async (eventPayload) => {
        try {
          // Extract args from event payload
          const [from, to, value] = eventPayload.args || [];
          
          // Validate parameters
          if (!from || !to || value === undefined) {
            console.warn(`[Listener] Incomplete Transfer event on ${chain}`);
            return;
          }
          console.log(`[Listener] Transfer event detected on ${chain}:`, { from, to, value: value.toString() });
          
          const formattedValue = formatUnits(value, 6);
          const transfer = {
            chain,
            from,
            to,
            value: formattedValue,
            txHash: eventPayload.log?.transactionHash,
            blockNumber: eventPayload.log?.blockNumber
      };
      
      console.log(`[Listener] ${chain} Transfer:`, transfer);
      
      // Minimum amount check: 0.1 USDC
      const MIN_USDC_AMOUNT = 0.1;
      const transferAmount = parseFloat(formattedValue);
      if (transferAmount < MIN_USDC_AMOUNT) {
        console.log(`[Listener] ${chain} Transfer below minimum (${transferAmount}), ignoring`);
        return; // Ignore transfers below minimum
      }
      
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
        const logPrefix = state?.id ? `[WS#${state.id} ${state.email}]` : '[WS]';
        const watch = state.watchAddress;
      
      // Only process INCOMING transfers (where user is the receiver)
      const isIncoming = toLower === watch;
      if (!isIncoming) {
        return; // Ignore outgoing transfers
      }
      
      client.send(JSON.stringify({ type: 'usdc_transfer', data: transfer }));
      if (transfer.txHash) {
        void (async () => {
          try {
            console.log(`${logPrefix} Processing transaction for: ${state.email}`);
            const user = await getUserByGmail(state.email);
            if (!user || !user.walletSetId || !user.addresses) {
              console.error(`${logPrefix} User not found or missing walletSetId/addresses for email:`, state.email);
              return;
            }
              console.log(`${logPrefix} User found:`, { walletSetId: user.walletSetId, addressCount: Object.keys(user.addresses).length });
              const addressValues = Object.values(user.addresses || {}).filter((v) => typeof v === 'string');
              const expectedAddress = addressValues.length > 0 ? addressValues[0] : null;
              if (!expectedAddress) {
                console.error(`${logPrefix} Missing addresses for user:`, state.email);
                return;
              }
              console.log(`${logPrefix} Expected address:`, expectedAddress, 'Receiver:', transfer.to, 'WatchAddress:', state.watchAddress);
              const expectedLower = expectedAddress.toLowerCase();
              const receiverLower = transfer.to.toLowerCase();
              if (receiverLower !== expectedLower || receiverLower !== state.watchAddress) {
                console.error(`${logPrefix} Receiver address mismatch:`, { expectedLower, receiverLower, watchAddress: state.watchAddress, email: state.email });
                return;
              }
              console.log(`${logPrefix} Address validation passed. Saving transaction...`);
              
              // Determine status based on chain
              const isArcTestnet = transfer.chain === 'ARC-TESTNET';
              const txStatus = isArcTestnet ? 'bridged' : 'received';
              
              await saveTxcoming({
                mail: state.email,
                walletid: user.walletSetId,
                txhash: transfer.txHash,
                amount: transfer.value,
                chain: transfer.chain,
                sender: transfer.from,
                txtype: 'IN',
                status: txStatus
              });
              console.log(`${logPrefix} Transaction saved successfully (status: ${txStatus}):`, transfer.txHash);

              // Only bridge if NOT arriving on ARC-TESTNET (final destination)
              if (!isArcTestnet) {
                console.log(`${logPrefix} Initiating automatic bridge to ARC-TESTNET...`);
                
                try {
                  const bridgeResult = await bridgeToArc(
                    transfer.chain,           // FROM_CHAIN: where funds arrived
                    transfer.value,           // AMOUNT: received amount
                    user.walletSetId,         // WALLET_SET_ID: user's wallet
                    'ARC-TESTNET',            // TO_CHAIN: always ARC-TESTNET
                    {
                      // Callback when burn is confirmed
                      onBurnConfirmed: async (burnTxHash, fromChain) => {
                        console.log('[Bridge] Burn confirmed callback triggered');
                        
                        // Create row with burn hash to track the bridged transaction
                        const bridgeRoute = `${transfer.chain} → ARC-TESTNET`;
                        await saveTxcoming({
                          mail: state.email,
                          walletid: user.walletSetId,
                          txhash: burnTxHash,
                          amount: transfer.value,
                          chain: bridgeRoute,
                          sender: 'ws_auto_bridge',
                          txtype: 'IN',
                          status: 'settling'
                        });
                        console.log(`${logPrefix} Burn hash row created with status: settling`);
                        
                        // Update status to 'bridging' when burn is confirmed
                        await updateTxcomingStatus(transfer.txHash, 'bridging');
                        console.log('Transaction status updated to: bridging (burn confirmed)');
                        
                        // Notify client that burn is confirmed
                        client.send(JSON.stringify({
                          type: 'updatetx',
                          data: {
                            txHash: transfer.txHash,
                            status: 'bridging',
                            message: 'Burn confirmed, waiting for attestation and mint',
                            burnTxHash
                          }
                        }));
                      }
                    }
                  );
                  console.log(`${logPrefix} Bridge completed successfully:`, bridgeResult);
                  
                  // Update status to 'bridged' and chain to show bridge route
                  const bridgeRoute = `${transfer.chain} → ARC-TESTNET`;
                  await updateTxcomingStatus(transfer.txHash, 'bridged', bridgeRoute);
                  console.log(`${logPrefix} Transaction status updated to: bridged, chain: ${bridgeRoute}`);
                  
                  // Notify client of final status update
                  client.send(JSON.stringify({
                    type: 'updatetx',
                    data: {
                      txHash: transfer.txHash,
                      status: 'bridged',
                      message: 'Bridge completed successfully',
                      chain: bridgeRoute,
                      mintTxHash: bridgeResult.mintTxHash
                    }
                  }));
                  
                  // Send bridge success notification to client
                  client.send(JSON.stringify({ 
                    type: 'bridge_complete', 
                    data: {
                      originalTx: transfer.txHash,
                      fromChain: transfer.chain,
                      toChain: 'ARC-TESTNET',
                      amount: transfer.value,
                      bridgeTxHashes: {
                        approve: bridgeResult.approveTxHash,
                        burn: bridgeResult.burnTxHash,
                        mint: bridgeResult.mintTxHash
                      }
                    }
                  }));

                  // After successful bridge to ARC-TESTNET, wait 1.5 seconds and deposit to Gateway Wallet
                  console.log(`${logPrefix} Bridge to ARC-TESTNET successful. Waiting 1.5s before Gateway deposit...`);
                  const burnTxHashFromBridge = bridgeResult.burnTxHash;
                  
                  // Wait 1.5 seconds to allow settlement
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  
                  console.log(`${logPrefix} Initiating Gateway Wallet deposit...`);
                  try {
                    const gatewayResult = await depositToGatewayWallet(
                      transfer.value,
                      user.walletSetId,
                      `WS#${state.id}`
                    );
                    console.log(`${logPrefix} Gateway deposit completed:`, gatewayResult);
                    
                    // Update the burn hash row to completed
                    if (burnTxHashFromBridge) {
                      await updateTxcomingStatus(burnTxHashFromBridge, 'completed');
                      console.log(`${logPrefix} Updated bridged transaction to completed: ${burnTxHashFromBridge}`);
                    } else {
                      console.warn(`${logPrefix} Could not find burn hash to update`);
                    }
                    
                    // Send gateway deposit success notification to client
                    client.send(JSON.stringify({
                      type: 'gateway_deposit_complete',
                      data: {
                        originalTx: transfer.txHash,
                        amount: transfer.value,
                        approveTxHash: gatewayResult.approveTxHash,
                        depositTxHash: gatewayResult.depositTxHash
                      }
                    }));
                  } catch (gatewayError) {
                    console.error(`${logPrefix} Gateway deposit failed:`, gatewayError);
                    // Find and update the bridged transaction row to STUCK_G using burn hash
                    if (burnTxHashFromBridge) {
                      try {
                        await updateTxcomingStatus(burnTxHashFromBridge, 'STUCK_G');
                        console.log(`${logPrefix} Transaction status updated to: STUCK_G`);
                      } catch (dbError) {
                        console.error(`${logPrefix} Failed to update status to STUCK_G:`, dbError);
                      }
                    }
                  }
                } catch (bridgeError) {
                  console.error(`${logPrefix} Bridge to ARC-TESTNET failed:`, bridgeError);
                  
                  // Extract burn tx hash from error if available
                  const burnTxHash = bridgeError?.burnTxHash;
                  const fromChain = bridgeError?.fromChain || transfer.chain;
                  
                  if (burnTxHash) {
                    // Update original transfer row to 'pending' and burn hash row to 'stuck'
                    await updateTxcomingStatus(transfer.txHash, 'pending');
                    await updateTxcomingStatus(burnTxHash, 'stuck');
                    console.log(`${logPrefix} Updated original row to: pending, burn hash row to: stuck`);
                    
                    // Notify client of status update
                    client.send(JSON.stringify({
                      type: 'updatetx',
                      data: {
                        txHash: transfer.txHash,
                        status: 'pending',
                        message: 'Bridge stuck - attestation or mint failed',
                        burnTxHash,
                        fromChain
                      }
                    }));
                    
                    // Send bridge error notification
                    client.send(JSON.stringify({ 
                      type: 'bridge_error', 
                      data: {
                        originalTx: transfer.txHash,
                        error: bridgeError?.message || 'Unknown bridge error',
                        status: 'stuck',
                        burnTxHash,
                        fromChain
                      }
                    }));
                  } else {
                    // Error before burn, just send error notification
                    client.send(JSON.stringify({ 
                      type: 'bridge_error', 
                      data: {
                        originalTx: transfer.txHash,
                        error: bridgeError?.message || 'Unknown bridge error'
                      }
                    }));
                  }
                }
              } else {
                console.log(`${logPrefix} Transfer received on ARC-TESTNET (final destination). Skipping bridge.`);
                
                // Check if this is a mint event (from 0x0000... address)
                const MINT_ADDRESS = '0x0000000000000000000000000000000000000000';
                const isMintEvent = transfer.from.toLowerCase() === MINT_ADDRESS;
                
                if (isMintEvent) {
                  console.log(`${logPrefix} Mint event detected on ARC-TESTNET. Skipping deposit (already handled by auto-bridge).`);
                  return;
                }
                
                // Only process deposits from real user addresses
                console.log(`${logPrefix} Real user transfer on ARC-TESTNET. Processing deposit...`);
                
                // Deposit to Gateway Wallet on ARC-TESTNET
                console.log(`${logPrefix} Initiating Gateway Wallet deposit...`);
                try {
                  const gatewayResult = await depositToGatewayWallet(
                    transfer.value,
                    user.walletSetId,
                    `WS#${state.id}`
                  );
                  console.log(`${logPrefix} Gateway deposit completed:`, gatewayResult);
                  
                  // Update direct ARC deposit status to completed
                  await updateTxcomingStatus(transfer.txHash, 'completed');
                  console.log(`${logPrefix} Updated direct ARC deposit to completed: ${transfer.txHash}`);
                  
                  // Send gateway deposit success notification to client
                  client.send(JSON.stringify({
                    type: 'gateway_deposit_complete',
                    data: {
                      originalTx: transfer.txHash,
                      amount: transfer.value,
                      approveTxHash: gatewayResult.approveTxHash,
                      depositTxHash: gatewayResult.depositTxHash
                    }
                  }));
                } catch (gatewayError) {
                  console.error(`${logPrefix} Gateway deposit failed:`, gatewayError);
                  
                  // Update direct ARC deposit status to STUCK_G if it fails
                  try {
                    await updateTxcomingStatus(transfer.txHash, 'STUCK_G');
                    console.log(`${logPrefix} Transaction status updated to: STUCK_G`);
                  } catch (dbError) {
                    console.error(`${logPrefix} Failed to update status to STUCK_G:`, dbError);
                  }
                  
                  // Send gateway error notification to client
                  client.send(JSON.stringify({
                    type: 'gateway_deposit_error',
                    data: {
                      originalTx: transfer.txHash,
                      error: gatewayError?.message || 'Unknown gateway deposit error'
                    }
                  }));
                }
              }
            } catch (err) {
              console.error(`${logPrefix} Failed to save transaction:`, err);
            }
          })();
        }
        matched = true;
    });
    // Only log if the transfer matched a subscribed address
    if (matched) {
      console.log('USDC Transfer:', transfer);
    }
    } catch (error) {
      console.error('[Transfer Listener] Unexpected error processing transfer:', error);
      console.error('Transfer data:', transfer);
      // Don't crash - just log and continue
    }
      });
      console.log(`[Listener] ✅ Transfer listener successfully attached to ${chain} for ${addressLower}`);
    } catch (listenerError) {
      console.error(`[Listener] Failed to attach Transfer listener for ${chain} (${addressLower}):`, listenerError);
      addressListenerAttached.delete(key);
      throw listenerError;
    }
  } catch (error) {
    console.error(`[Listener] Failed to setup listener for ${chain} (${addressLower}):`, error);
    addressListenerAttached.delete(key); // Allow retry
    throw error;
  }
};

const attachArcNativeListener = async (chain, addressLower, wss, clientState, key) => {
  try {
    const provider = await getProvider(chain);
    console.log(`[Listener] Attaching native balance listener on ${chain} for address ${addressLower}...`);

    const initialBalance = await provider.getBalance(addressLower);
    nativeBalanceCache.set(key, initialBalance);

    provider.on('block', async (blockNumber) => {
      try {
        const prevBalance = nativeBalanceCache.get(key) ?? 0n;
        const newBalance = await provider.getBalance(addressLower);

        if (newBalance <= prevBalance) {
          nativeBalanceCache.set(key, newBalance);
          return;
        }

        const delta = newBalance - prevBalance;
        nativeBalanceCache.set(key, newBalance);

        const formattedValue = formatUnits(delta, 18);

        // Try to find the txHash in this block for better tracking
        let txHash = null;
        let fromAddress = null;
        try {
          let block = null;
          try {
            block = await provider.getBlock(blockNumber, true);
          } catch {
            block = await provider.getBlock(blockNumber);
          }

          if (block?.transactions?.length) {
            let txs = Array.isArray(block.transactions)
              ? block.transactions
              : [];

            // If transactions are only hashes, fetch all
            if (txs.length && typeof txs[0] === 'string') {
              // Fetch all txs in parallel (limit to 50 for safety)
              const hashes = txs.slice(0, 50);
              txs = await Promise.all(hashes.map(h => provider.getTransaction(h)));
            }

            // Find the first tx to this address with value > 0
            const tx = txs.find(
              (t) => t && t.to && t.to.toLowerCase() === addressLower && t.value && t.value > 0n
            );

            if (tx && typeof tx === 'object') {
              txHash = tx.hash || null;
              fromAddress = tx.from || null;
            }
          }
        } catch (blockError) {
          console.warn(`[Listener] Failed to load block ${blockNumber} for ARC native transfer lookup:`, blockError?.message || blockError);
        }

        // Only process if we found a real transaction with a valid txHash
        if (!txHash || !fromAddress) {
          // No real transaction found for this block/address/value
          return;
        }
        const transfer = {
          chain,
          from: fromAddress,
          to: addressLower,
          value: formattedValue,
          txHash,
          blockNumber
        };

        // Reuse existing processing logic by emitting to subscribed clients
        wss.clients.forEach((client) => {
          if (client.readyState !== 1) {
            return;
          }
          const state = clientState.get(client);
          if (!state || !state.chains.has(chain) || !state.watchAddress || !state.email) {
            return;
          }
          if (state.watchAddress !== addressLower) {
            return;
          }

          // Only send WebSocket notification if we have a real transaction hash
          // (not synthetic native_* hash) OR if it's a mint from 0x0000...
          const hasRealTxHash = txHash !== null;
          const isMintFromZero = fromAddress && fromAddress.toLowerCase() === '0x0000000000000000000000000000000000000000';
          
          if (hasRealTxHash || isMintFromZero) {
            client.send(JSON.stringify({ type: 'usdc_transfer', data: transfer }));
          }

          if (transfer.txHash) {
            void (async () => {
              try {
                const logPrefix = state?.id ? `[WS#${state.id} ${state.email}]` : '[WS]';
                if (nativeProcessedTx.has(transfer.txHash)) {
                  console.log(`${logPrefix} ARC native transfer already processed: ${transfer.txHash}`);
                  return;
                }
                nativeProcessedTx.add(transfer.txHash);

                console.log(`${logPrefix} Processing ARC native transfer for: ${state.email} (${transfer.txHash})`);
                const user = await getUserByGmail(state.email);
                if (!user || !user.walletSetId || !user.addresses) {
                  console.error(`${logPrefix} User not found or missing walletSetId/addresses for email:`, state.email);
                  return;
                }

                console.log(`${logPrefix} Address validation passed. Determining transaction type...`);

                // Mint filtering (check if from 0x0000... ONLY if we have a real txHash)
                const MINT_ADDRESS = '0x0000000000000000000000000000000000000000';
                let isMint = false;
                if (txHash && fromAddress && fromAddress.toLowerCase() === MINT_ADDRESS) {
                  isMint = true;
                }

                // Set status based on whether this is a mint or direct transfer
                const txStatus = isMint ? 'minted' : 'received';
                const senderAddress = fromAddress || MINT_ADDRESS;

                console.log(`${logPrefix} ${isMint ? 'Mint event' : 'Direct transfer'} detected. Saving with status: ${txStatus}`);

                try {
                  const saveResult = await saveTxcoming({
                    mail: state.email,
                    walletid: user.walletSetId,
                    txhash: transfer.txHash,
                    amount: transfer.value,
                    chain: transfer.chain,
                    sender: senderAddress,
                    txtype: 'IN',
                    status: txStatus
                  });
                  console.log(`${logPrefix} ARC native transfer saved (status: ${txStatus}, saveResult:`, saveResult ? 'success' : 'false', '):',  transfer.txHash);
                } catch (saveError) {
                  console.error(`${logPrefix} Failed to save ARC native transfer:`, saveError);
                  return; // Don't proceed if save failed
                }

                // Skip deposit if it's a mint (already handled by auto-bridge)
                if (isMint) {
                  console.log(`${logPrefix} Mint event on ARC-TESTNET. Skipping Gateway deposit (already handled by auto-bridge).`);
                  return;
                }

                console.log(`${logPrefix} Real user transfer on ARC-TESTNET. Processing Gateway deposit...`);
                try {
                  const gatewayResult = await depositToGatewayWallet(
                    transfer.value,
                    user.walletSetId,
                    `WS#${state.id}`
                  );
                  console.log(`${logPrefix} Gateway deposit completed:`, gatewayResult);
                  
                  // Update DB status to completed
                  console.log(`${logPrefix} Updating DB status to 'completed' for txHash: ${transfer.txHash}`);
                  const updateResult = await updateTxcomingStatus(transfer.txHash, 'completed');
                  console.log(`${logPrefix} DB status update result:`, updateResult ? 'success' : 'failed');
                  
                  // Notify client
                  client.send(JSON.stringify({
                    type: 'updatetx',
                    data: {
                      txHash: transfer.txHash,
                      status: 'completed',
                      message: 'Gateway deposit completed',
                      depositTxHash: gatewayResult.depositTxHash
                    }
                  }));
                } catch (gatewayError) {
                  console.error(`${logPrefix} Gateway deposit failed:`, gatewayError);
                  try {
                    console.log(`${logPrefix} Updating DB status to 'STUCK_G' for txHash: ${transfer.txHash}`);
                    const updateResult = await updateTxcomingStatus(transfer.txHash, 'STUCK_G');
                    console.log(`${logPrefix} DB status update result:`, updateResult ? 'success' : 'failed');
                  } catch (dbError) {
                    console.error(`${logPrefix} Failed to update status to STUCK_G:`, dbError);
                  }
                  
                  // Notify client of error
                  client.send(JSON.stringify({
                    type: 'gateway_error',
                    data: {
                      txHash: transfer.txHash,
                      error: gatewayError?.message || 'Gateway deposit failed'
                    }
                  }));
                }
              } catch (err) {
                console.error(`[Listener] ARC native transfer processing failed:`, err);
              }
            })();
          }
        });
      } catch (err) {
        console.error(`[Listener] ARC native listener error:`, err);
      }
    });

    console.log(`[Listener] ✅ ARC native balance listener attached for ${addressLower}`);
  } catch (error) {
    console.error(`[Listener] Failed to setup ARC native listener for ${addressLower}:`, error);
    addressListenerAttached.delete(key);
    throw error;
  }
};