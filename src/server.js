import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { chainConfigs } from './config.js';
import { ensureAddressListener, isValidAddress } from './subscriptions.js';
import { getUserByGmail } from './db.js';
import { handleBridgeRequest } from './api/bridge.js';
import { handleAttestationRequest } from './api/attest.js';
import { handleTransferOutRequest } from './api/transferOutHandler.js';
import { handleCreateRequest } from './api/transferOutHandler.js';
import { handleGetRequestById } from './api/transferOutHandler.js';


const DEFAULT_PORT = process.env.PORT || 8090;

export const startServer = (port = DEFAULT_PORT) => {
  // Create Express app
  const app = express();
  app.use(express.json());
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://everywherepay-e63bce248faa.herokuapp.com',
      'https://everywherepay.vercel.app'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  }));
  // Transfer Out API - Arc to [Avalanche Fuji, Base Sepolia, Ethereum Sepolia, Arc]
  // Usage: /api/transfer-out/:mail/:recipientAddress/:chain?amount=AMOUNT
  app.get('/api/transfer-out/:mail/:recipientAddress/:chain', handleTransferOutRequest);
  // Public API to create a new request
  // Usage: /request/:requestid/:user/:amount/:message
  app.post('/request/:requestid/:user/:amount/:message', handleCreateRequest);
  // Public API to get request details by requestid
  // Usage: /request/:requestid
  app.get('/request/:requestid', handleGetRequestById);

  const clientState = new Map();
  let clientCounter = 0;

  const isEmailSubscribed = (email) => {
    const target = (email || '').trim().toLowerCase();
    if (!target) {
      return false;
    }
    for (const [client, state] of clientState.entries()) {
      if (client.readyState !== 1 || !state?.email) {
        continue;
      }
      if (state.email.trim().toLowerCase() === target) {
        return true;
      }
    }
    return false;
  };

  // HTTP REST endpoints
  app.get('/', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'USDC Transfer WebSocket Server',
      endpoints: {
        websocket: 'ws://localhost:' + port,
        chains: '/api/chains',
        health: '/api/health',
        wallets: '/api/wallets?email=',
        bridge: '/api/bridge/:chain/:email',
        attest: '/api/attest/:burnHash/:route/:email'
      }
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  app.get('/api/chains', (req, res) => {
    const chains = Object.keys(chainConfigs).map(chain => ({
      name: chain,
      usdcAddress: chainConfigs[chain].usdcAddress
    }));
    res.json({ chains });
  });

  app.get('/api/wallets', async (req, res) => {
    const email = req.query.email;
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'Missing email' });
    }
    try {
      const user = await getUserByGmail(email);
      if (!user || !user.addresses) {
        return res.status(404).json({ error: 'User not found' });
      }
      const addressValues = Object.values(user.addresses || {}).filter((v) => typeof v === 'string');
      const address = addressValues.length > 0 ? addressValues[0] : null;
      if (!address) {
        return res.status(404).json({ error: 'Address not found' });
      }
      return res.status(200).json({ address });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch wallets', details: err.message });
    }
  });

  // Bridge API - Manual trigger to bridge all funds from chain to ARC-TESTNET
  app.get('/api/bridge/:chain/:email', async (req, res) => {
    const { chain, email } = req.params;
    
    if (!chain || !email) {
      return res.status(400).json({ error: 'Missing chain or email parameter' });
    }

    try {
      const result = await handleBridgeRequest(chain.toUpperCase(), email, isEmailSubscribed);
      return res.status(200).json(result);
    } catch (err) {
      console.error('[API] Bridge request failed:', err);
      return res.status(500).json({ 
        success: false,
        error: err.message || 'Bridge failed',
        details: err.stack
      });
    }
  });

  // Attestation API - Manual attestation and mint for a burn transaction
  app.get('/api/attest/:burnHash/:route/:email', async (req, res) => {
    const { burnHash, route, email } = req.params;
    
    if (!burnHash || !route || !email) {
      return res.status(400).json({ error: 'Missing burnHash, route, or email parameter' });
    }

    try {
      const result = await handleAttestationRequest(burnHash, route, email, isEmailSubscribed);
      return res.status(200).json(result);
    } catch (err) {
      console.error('[API] Attestation request failed:', err);
      return res.status(500).json({ 
        success: false,
        error: err.message || 'Attestation failed',
        details: err.stack
      });
    }
  });

  // Create HTTP server
  const server = createServer(app);

  // Attach WebSocket server to HTTP server
  const wss = new WebSocketServer({ server });

  // Add error handler for WebSocket server
  wss.on('error', (error) => {
    console.error('[WSS] WebSocket Server error:', error);
    // Don't crash - server will continue running
  });

  console.log(`HTTP + WebSocket server started on port ${port}`);
  console.log(`HTTP: http://localhost:${port}`);
  console.log(`WebSocket: ws://localhost:${port}`);

  // Heroku-friendly: ping clients every 5 seconds to keep connection alive
  setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.ping();
      }
    });
  }, 5000);

  wss.on('connection', (ws) => {
    const clientId = ++clientCounter;
    clientState.set(ws, { id: clientId, chains: new Set(), watchAddress: null, email: null });
    ws.send(JSON.stringify({
      type: 'info',
      message: 'Connected. Send {"type":"subscribe","chain":"AVAX-FUJI","address":"0x..."} or {"type":"subscribe_all","address":"0x..."}.'
    }));

    ws.on('message', (raw) => {
      try {
        let msg;
        try {
          msg = JSON.parse(raw.toString());
        } catch {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON message.' }));
          return;
        }

        if (msg.type === 'subscribe') {
        const chain = msg.chain;
        const address = (msg.address || '').toLowerCase();
        const email = (msg.email || '').trim();
        if (!chainConfigs[chain]) {
          ws.send(JSON.stringify({ type: 'error', message: 'Unsupported chain.' }));
          return;
        }
        if (!isValidAddress(address)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid address.' }));
          return;
        }
        if (!email) {
          ws.send(JSON.stringify({ type: 'error', message: 'Email is required.' }));
          return;
        }
        const state = clientState.get(ws);
        state.chains.add(chain);
        state.watchAddress = address;
        state.email = email;
        
        // Start listener asynchronously (don't wait)
        ensureAddressListener(chain, address, wss, clientState).catch(err => {
          console.error(`[WS#${state.id}] Failed to attach listener for ${chain}:`, err);
        });
        
        console.log(`[WS#${state.id}] Subscribed: ${chain} - ${address} - ${email}`);
        ws.send(JSON.stringify({ type: 'subscribed', chain, address, email }));
        return;
      }

      if (msg.type === 'subscribe_all') {
        const address = (msg.address || '').toLowerCase();
        const email = (msg.email || '').trim();
        if (!isValidAddress(address)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid address.' }));
          return;
        }
        if (!email) {
          ws.send(JSON.stringify({ type: 'error', message: 'Email is required.' }));
          return;
        }
        const state = clientState.get(ws);
        const allChains = Object.keys(chainConfigs);
        
        // Attach listeners with staggered delays
        allChains.forEach((chain, index) => {
          state.chains.add(chain);
          ensureAddressListener(chain, address, wss, clientState).catch(err => {
            console.error(`[WS#${state.id}] Failed to attach listener for ${chain}:`, err);
          });
        });
        state.watchAddress = address;
        state.email = email;
        console.log(`[WS#${state.id}] Subscribed to ALL chains - ${address} - ${email}`);
        ws.send(JSON.stringify({ type: 'subscribed_all', chains: allChains, address, email }));
        return;
      }

      if (msg.type === 'unsubscribe') {
        const state = clientState.get(ws);
        state.chains.clear();
        state.watchAddress = null;
        state.email = null;
        console.log(`[WS#${state.id}] Unsubscribed`);
        ws.send(JSON.stringify({ type: 'unsubscribed' }));
        return;
      }

      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type.' }));
      } catch (error) {
        console.error('[WebSocket] Error handling message:', error);
        try {
          ws.send(JSON.stringify({ type: 'error', message: 'Internal server error processing message.' }));
        } catch (sendError) {
          console.error('[WebSocket] Failed to send error message:', sendError);
        }
      }
    });

    ws.on('error', (error) => {
      console.error(`[WS#${clientId}] WebSocket error:`, error.message || error);
      // Don't crash - connection will be cleaned up
    });

    ws.on('close', () => {
      const state = clientState.get(ws);
      if (state) {
        console.log(`[WS#${state.id}] Client disconnected`);
      }
      clientState.delete(ws);
    });
  });

  // Start HTTP server (which also serves WebSocket)
  server.listen(port);

  return { app, server, wss };
};
