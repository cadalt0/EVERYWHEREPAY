# EverywherePay

EverywherePay is a next-generation USDC wallet platform for seamless, gasless, and fully automated cross-chain payments, requests, and invoicing. The platform abstracts all blockchain complexity, letting users interact with USDC across chains in a single, unified experience.


![Screenshot](https://i.ibb.co/5XXfT4yg/Screenshot-From-2026-02-08-23-07-50.png)

## User Journey & Platform Logic

### 1. Authentication & Wallet Initialization
- User logs in with Google or other authentication
- Platform initializes a Circle developer-controlled wallet (SCA)

### 2. User Action Selection
- User chooses action:
	- Deposit USDC
	- Send USDC
	- Create payment request or invoice

---

## Deposit Flow
- User deposits USDC from any supported chain
- Backend monitors wallet addresses
- USDC detected in wallet
- Circle CCTPv2 bridges USDC to ARC
- Funds settle in Circle Gateway on ARC

---

## Send Flow
- User selects recipient(s)
- User selects single or multiple recipients
- Platform uses Circle Gateway to transfer USDC

---

## Request & Invoice Flow
- User creates payment request or invoice
- Request or invoice shared as link or PDF
- Client pays from any chain
- Platform auto-detects payment
- Circle CCTPv2 bridges USDC
- Funds settle in Circle Gateway on ARC

---

## Automation & Settlement
- All transactions verifiable and settled via Circle Gateway on ARC
- All actions automated, gasless, and abstracted
- Multi-chain support for deposits, payouts, and payments


Server (Backend)

The EverywherePay server is the backend engine that powers all USDC cross-chain operations, wallet management, and real-time notifications.

**Key Features:**
- **Express API:** Handles REST endpoints for transfers, requests, wallet info, bridging, and attestation.
- **WebSocket Server:** Provides real-time notifications for USDC deposits, payments, and cross-chain events.
- **Circle Wallet Integration:** Initializes and manages Circle developer-controlled wallets (SCA) for each user.
- **Deposit Monitoring:** Watches all user wallet addresses for incoming USDC on supported chains.
- **Automated Bridging:** Uses Circle CCTPv2 to bridge USDC to ARC, settling funds in the Circle Gateway.
- **Transfer & Request APIs:** Supports sending USDC to any chain, creating payment requests, and handling invoices.
- **Error Handling & Resilience:** Global error handlers and graceful shutdown logic ensure reliability.

**API Endpoints:**
- `/api/transfer-out/:mail/:recipientAddress/:chain` — Send USDC cross-chain
- `/request/:requestid/:user/:amount/:message` — Create payment request
- `/request/:requestid` — Get request details
- `/api/bridge/:chain/:email` — Manually bridge funds
- `/api/attest/:burnHash/:route/:email` — Attestation for minting after burn
- `/api/wallets?email=` — Get user wallet address
- `/api/chains` — Supported chains and USDC addresses
- WebSocket — Subscribe to wallet events for real-time updates

![Screenshot](https://i.ibb.co/5XXfT4yg/Screenshot-From-2026-02-08-23-07-50.png)

