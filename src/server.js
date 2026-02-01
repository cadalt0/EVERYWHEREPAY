import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { chainConfigs } from './config.js';
import { ensureChainListener, isValidAddress } from './subscriptions.js';
import { getUserByGmail } from './db.js';

const DEFAULT_PORT = process.env.PORT || 8090;

export const startServer = (port = DEFAULT_PORT) => {
  // Create Express app
  const app = express();
  app.use(express.json());
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://everywherepay-e63bce248faa.herokuapp.com'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  }));

  // HTTP REST endpoints
  app.get('/', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'USDC Transfer WebSocket Server',
      endpoints: {
        websocket: 'ws://localhost:' + port,
        chains: '/api/chains',
        health: '/api/health'
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

  // Create HTTP server
  const server = createServer(app);

  // Attach WebSocket server to HTTP server
  const wss = new WebSocketServer({ server });
  const clientState = new Map();

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
    clientState.set(ws, { chains: new Set(), watchAddress: null, email: null });
    ws.send(JSON.stringify({
      type: 'info',
      message: 'Connected. Send {"type":"subscribe","chain":"AVAX-FUJI","address":"0x..."} or {"type":"subscribe_all","address":"0x..."}.'
    }));

    ws.on('message', (raw) => {
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
        ensureChainListener(chain, wss, clientState);
        console.log(`Client subscribed: ${chain} - ${address} - ${email}`);
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
        allChains.forEach(chain => {
          state.chains.add(chain);
          ensureChainListener(chain, wss, clientState);
        });
        state.watchAddress = address;
        state.email = email;
        console.log(`Client subscribed to ALL chains - ${address} - ${email}`);
        ws.send(JSON.stringify({ type: 'subscribed_all', chains: allChains, address, email }));
        return;
      }

      if (msg.type === 'unsubscribe') {
        const state = clientState.get(ws);
        state.chains.clear();
        state.watchAddress = null;
        state.email = null;
        console.log('Client unsubscribed');
        ws.send(JSON.stringify({ type: 'unsubscribed' }));
        return;
      }

      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type.' }));
    });

    ws.on('close', () => {
      clientState.delete(ws);
    });
  });

  // Start HTTP server (which also serves WebSocket)
  server.listen(port);

  return { app, server, wss };
};