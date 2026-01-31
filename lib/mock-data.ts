export const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
};

export const mockBalance = {
  total: 125420.50,
  ethereum: 45230.20,
  polygon: 38910.15,
  arbitrum: 41280.15,
};

export const mockTransactions = [
  {
    id: '1',
    type: 'send',
    recipient: 'alice.eth',
    amount: 2500.0,
    chain: 'Ethereum',
    status: 'completed',
    date: '2024-01-29',
    timestamp: '14:32:00',
  },
  {
    id: '2',
    type: 'receive',
    sender: 'bob.eth',
    amount: 5000.0,
    chain: 'Polygon',
    status: 'completed',
    date: '2024-01-28',
    timestamp: '09:15:00',
  },
  {
    id: '3',
    type: 'send',
    recipient: '0x742d...5e8c',
    amount: 1200.0,
    chain: 'Arbitrum',
    status: 'completed',
    date: '2024-01-27',
    timestamp: '16:45:00',
  },
  {
    id: '4',
    type: 'multisend',
    recipients: 3,
    totalAmount: 7500.0,
    chain: 'Ethereum',
    status: 'completed',
    date: '2024-01-26',
    timestamp: '11:20:00',
  },
  {
    id: '5',
    type: 'request',
    requester: 'carol.eth',
    amount: 3000.0,
    chain: 'Polygon',
    status: 'pending',
    date: '2024-01-25',
    timestamp: '13:00:00',
  },
];

export const mockInvoices = [
  {
    id: 'INV-001',
    client: 'Acme Corp',
    amount: 15000.0,
    status: 'paid',
    dueDate: '2024-01-15',
    createdDate: '2024-01-01',
  },
  {
    id: 'INV-002',
    client: 'TechStart Inc',
    amount: 8500.0,
    status: 'pending',
    dueDate: '2024-02-05',
    createdDate: '2024-01-20',
  },
  {
    id: 'INV-003',
    client: 'Global Services',
    amount: 22000.0,
    status: 'pending',
    dueDate: '2024-02-15',
    createdDate: '2024-01-22',
  },
];

export const mockPayouts = [
  {
    id: '1',
    recipient: 'alice.eth',
    chain: 'Ethereum',
    amount: 5000.0,
    status: 'completed',
    date: '2024-01-28',
  },
  {
    id: '2',
    recipient: 'bob.eth',
    chain: 'Polygon',
    amount: 3200.0,
    status: 'pending',
    date: '2024-01-29',
  },
  {
    id: '3',
    recipient: 'carol.eth',
    chain: 'Arbitrum',
    amount: 7800.0,
    status: 'processing',
    date: '2024-01-29',
  },
];

// Supported chains for Deposit Modal
export const chains = [
  { id: 'ARC-TESTNET', name: 'Arc Testnet', logo: '/arc.webp', color: '#00bcd4' },
  { id: 'AVAX-FUJI', name: 'Avalanche Fuji', logo: '/avax.webp', color: '#e84142' },
  { id: 'BASE-SEPOLIA', name: 'Base Sepolia', logo: '/base%20logo.webp', color: '#0052ff' },
  { id: 'ARB-SEPOLIA', name: 'Arbitrum Sepolia', logo: '/arb.webp', color: '#28a0f0' },
  { id: 'ETH-SEPOLIA', name: 'Ethereum Sepolia', logo: '/eth.webp', color: '#627eea' },
  { id: 'MATIC-AMOY', name: 'Polygon Amoy', logo: '/ploygon.webp', color: '#8247e5' },
  { id: 'MONAD-TESTNET', name: 'Monad Testnet', logo: '/monad.webp', color: '#222' },
  { id: 'OP-SEPOLIA', name: 'Optimism Sepolia', logo: '/op.webp', color: '#ff0420' },
  { id: 'UNI-SEPOLIA', name: 'Unichain Sepolia Testnet', logo: '/unichain.webp', color: '#ff00ff' },
];
