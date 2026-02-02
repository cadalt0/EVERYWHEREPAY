# CCTP Bridge Integration

## Overview
The WebSocket server now **automatically bridges** all incoming USDC transfers to **ARC-TESTNET** using Circle's CCTP (Cross-Chain Transfer Protocol).

## Flow
```
1. User receives USDC on any chain (e.g., AVAX-FUJI, BASE-SEPOLIA, etc.)
   ↓
2. WebSocket detects Transfer event
   ↓
3. Validates receiver address matches user's stored address
   ↓
4. Saves transaction to DB (txcoming table)
   ↓
5. Automatically triggers bridge engine:
   - FROM_CHAIN: Source chain where funds arrived
   - TO_CHAIN: ARC-TESTNET (fixed destination)
   - AMOUNT: Received USDC amount
   - WALLET_SET_ID: User's Circle wallet ID from database
   ↓
6. Bridge executes 4 steps:
   - Step 1: Approve USDC spend
   - Step 2: Burn USDC on source chain
   - Step 3: Retrieve attestation from Circle
   - Step 4: Mint USDC on ARC-TESTNET
   ↓
7. Client receives WebSocket notifications:
   - 'usdc_transfer' → Original transfer detected
   - 'bridge_complete' → Bridge successful (includes all tx hashes)
   - 'bridge_error' → Bridge failed (includes error message)
```

## File Structure
```
websocket-usdc-avax/
├── src/
│   ├── bridge/
│   │   ├── contracts.js      # CCTP contract addresses & chain mappings
│   │   ├── operations.js     # approve, burn, attestation, mint functions
│   │   └── engine.js          # Main bridge function (bridgeToArc)
│   ├── config.js              # WebSocket chain configs
│   ├── server.js              # Express + WebSocket server
│   ├── subscriptions.js       # Event listeners + auto-bridge trigger
│   └── db.js                  # PostgreSQL operations
├── engine.js                  # CLI wrapper for manual bridging
├── index.js                   # Entry point
└── package.json
```

## WebSocket Messages

### Incoming (Client → Server)
```json
{
  "type": "subscribe",
  "chain": "AVAX-FUJI",
  "address": "0x...",
  "email": "user@gmail.com"
}
```

### Outgoing (Server → Client)

**Transfer Detected:**
```json
{
  "type": "usdc_transfer",
  "data": {
    "chain": "AVAX-FUJI",
    "from": "0x...",
    "to": "0x...",
    "value": "10.5",
    "txHash": "0x...",
    "blockNumber": 12345
  }
}
```

**Bridge Completed:**
```json
{
  "type": "bridge_complete",
  "data": {
    "originalTx": "0x...",
    "fromChain": "AVAX-FUJI",
    "toChain": "ARC-TESTNET",
    "amount": "10.5",
    "bridgeTxHashes": {
      "approve": "0x...",
      "burn": "0x...",
      "mint": "0x..."
    }
  }
}
```

**Bridge Error:**
```json
{
  "type": "bridge_error",
  "data": {
    "originalTx": "0x...",
    "error": "Attestation timeout - transaction may still be pending"
  }
}
```

## Environment Variables Required
```env
# Blockchain RPC
ALCHEMY_KEY=your_alchemy_key

# Database
DATABASE_URL=postgresql://...

# Circle Developer Wallets (for bridge)
CIRCLE_API_KEY=your_circle_api_key
ENTITY_SECRET=your_entity_secret

# Bridge Configuration (optional)
TRANSFER_SPEED=FAST          # FAST or STANDARD
MAX_FEE=1000000              # Max fee in USDC units (1000000 = 1 USDC)
```

## Manual CLI Usage
You can still manually trigger bridges using the CLI:

```bash
# Bridge from any chain to ARC-TESTNET
node engine.js BASE-SEPOLIA ARC-TESTNET 1.5

# Resume bridge from burn tx hash (if mint failed)
node engine.js BASE-SEPOLIA ARC-TESTNET 0xabc123...
```

## Supported Chains
All 9 testnet chains are supported:
- ETH-SEPOLIA
- AVAX-FUJI
- OP-SEPOLIA
- ARB-SEPOLIA
- BASE-SEPOLIA
- MATIC-AMOY
- UNI-SEPOLIA
- MONAD-TESTNET
- ARC-TESTNET

## Key Features
✅ **Automatic bridging** - No manual intervention needed  
✅ **User-specific wallets** - Uses each user's Circle wallet from DB  
✅ **Real-time notifications** - Client gets updates at each step  
✅ **Error handling** - Graceful failure with error messages  
✅ **Resume capability** - Can retry from attestation step if needed  
✅ **Modular architecture** - Clean separation of concerns  

## Database Schema
The `everywherepay` table must have:
- `gmail` (text) - User's email
- `walletSetId` (text) - Circle wallet set ID
- `addresses` (jsonb) - Map of chain addresses

The `txcoming` table stores all incoming transfers:
- `mail`, `walletid`, `txhash`, `amount`, `chain`, `sender`, `txtype`, `status`

## Next Steps
1. Test with real USDC transfer on testnet
2. Monitor logs for bridge execution
3. Verify funds arrive on ARC-TESTNET
4. Check WebSocket client receives all notifications
