# WebSocket Notification System - Setup Complete

## Overview
Centralized WebSocket connection that subscribes to ALL user wallet addresses at once on dashboard load. Backend monitors all chains simultaneously and sends transfer notifications to frontend for toast display.

---

## Frontend Implementation

### 1. New Hook: `/hooks/use-websocket-notifications.ts`
- **Purpose**: Manages global WebSocket connection for USDC transfer notifications
- **Lifecycle**: Connects when dashboard loads with wallets, stays open across all pages
- **Features**:
  - Connects to `NEXT_PUBLIC_SOCKET_URL` from environment
  - Subscribes to all user addresses with `{ type: 'subscribe_all', addresses: [...] }`
  - Shows toast on `usdc_transfer` message with chain name, amount, and explorer link
  - Dispatches `usdc-buffering` event to trigger loading animation on topbar bell icon
  - Cleans up connection on unmount

### 2. Dashboard Integration: `/app/dashboard/page.tsx`
- Imports and uses `useWebSocketNotifications` hook
- Passes all user wallets to hook after fetching from API
- Connection stays active while user is on dashboard

### 3. Removed from: `/components/DepositMain/DepositContainer.tsx`
- Removed all WebSocket connection logic (subscribe/unsubscribe per chain)
- Removed toast notification logic (now handled globally)
- Removed buffering state management (now handled globally)
- Component is now simpler - only handles QR display and address copying

---

## Backend Message Format

### Subscribe Message (Frontend → Backend)
```json
{
  "type": "subscribe_all",
  "addresses": [
    { "chain": "ETH-SEPOLIA", "address": "0x..." },
    { "chain": "BASE-SEPOLIA", "address": "0x..." },
    { "chain": "ARB-SEPOLIA", "address": "0x..." }
    // ... all 9 chains
  ]
}
```

### Transfer Notification (Backend → Frontend)
```json
{
  "type": "usdc_transfer",
  "data": {
    "amount": "10.5",
    "txHash": "0xabc123...",
    "chain": "ETH-SEPOLIA",
    "from": "0x123..."
  }
}
```

### Subscription Confirmation (Backend → Frontend)
```json
{
  "type": "subscribed_all",
  "count": 9
}
```

### Error Message (Backend → Frontend)
```json
{
  "type": "error",
  "message": "Failed to subscribe to chain X"
}
```

---

## Environment Variable
Add to `.env.local`:
```
NEXT_PUBLIC_SOCKET_URL=ws://localhost:8090
```

---

## Behavior

### On Dashboard Load:
1. User wallets fetched from `/api/user-details`
2. WebSocket connects to backend
3. Subscribes to all 9 chains at once
4. Buffering animation starts on topbar bell icon
5. Connection stays open across all page navigations

### On USDC Transfer:
1. Backend detects transfer on any monitored chain
2. Backend sends `usdc_transfer` message to frontend
3. Frontend shows toast: "USDC received on [CHAIN]" with amount and sender
4. Toast is clickable → opens block explorer

### On Chain Selection (Deposit UI):
- Bell icon changes to selected chain logo
- Buffering animation continues (always active)
- No new WebSocket connection (already subscribed to all chains)

### On Page Navigation:
- WebSocket connection persists
- User continues receiving notifications on any page

### On Logout/Close:
- WebSocket sends `unsubscribe_all` message
- Connection closes gracefully
- Buffering animation stops

---

## Benefits
✅ Subscribe to all chains once instead of per-chain subscriptions
✅ Real-time notifications regardless of which page user is on
✅ Simpler frontend code - no subscribe/unsubscribe on chain changes
✅ Better UX - user gets notified for ANY deposit, not just selected chain
✅ Fewer WebSocket reconnections
✅ Bell icon always shows buffering (monitoring all chains)

---

## Next Steps for Backend
1. Implement WebSocket server at `NEXT_PUBLIC_SOCKET_URL`
2. Handle `subscribe_all` message and monitor all provided addresses
3. Send `usdc_transfer` messages when transfers detected
4. Handle `unsubscribe_all` for cleanup
