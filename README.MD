# EverywherePay

EverywherePay is a next-generation USDC wallet platform for seamless, gasless, and fully automated cross-chain payments, requests, and invoicing. The platform abstracts all blockchain complexity, letting users interact with USDC across chains in a single, unified experience.



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


