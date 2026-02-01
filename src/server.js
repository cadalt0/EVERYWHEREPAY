import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { chainConfigs } from './config.js';
import { ensureChainListener, isValidAddress } from './subscriptions.js';

const DEFAULT_PORT = process.env.PORT || 8090;

export const startServer = (port = DEFAULT_PORT) => {
  // Create Express app
  const app = express();
  app.use(express.json());

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

  // Create HTTP server
  const server = createServer(app);

  // Attach WebSocket server to HTTP server
  const wss = new WebSocketServer({ server });
  const clientState = new Map();

  console.log(`HTTP + WebSocket server started on port ${port}`);
  console.log(`HTTP: http://localhost:${port}`);
  console.log(`WebSocket: ws://localhost:${port}`);

  wss.on('connection', (ws) => {
    clientState.set(ws, { chain: null, watchAddress: null });
    ws.send(JSON.stringify({
      type: 'info',
      message: 'Connected. Send {"type":"subscribe","chain":"AVAX-FUJI","address":"0x..."}.'
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
        if (!chainConfigs[chain]) {
          ws.send(JSON.stringify({ type: 'error', message: 'Unsupported chain.' }));
          return;
        }
        if (!isValidAddress(address)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid address.' }));
          return;
        }
        clientState.set(ws, { chain, watchAddress: address });
        ensureChainListener(chain, wss, clientState);
        console.log(`Client subscribed: ${chain} - ${address}`);
        ws.send(JSON.stringify({ type: 'subscribed', chain, address }));
        return;
      }

      if (msg.type === 'unsubscribe') {
        clientState.set(ws, { chain: null, watchAddress: null });
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