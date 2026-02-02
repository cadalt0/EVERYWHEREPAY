"use client";
import DepositModalWrapper from '@/components/DepositMain/DepositModalWrapper';

// Add global type for wallet cache
declare global {
  interface Window {
    __userWallets?: Array<{ chain: string; address: string }>;
  }
}



interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Array<{ chain: string; address: string }>;
  selectedChain: string | null;
  setSelectedChain: (chain: string | null) => void;
  isLoading?: boolean;
}

export default function DepositModal(props: DepositModalProps) {
  // Use cached wallets if available for instant modal display
  let wallets = props.wallets;
  if (typeof window !== 'undefined' && window.__userWallets) {
    wallets = window.__userWallets;
  }
  return <DepositModalWrapper {...props} wallets={wallets} selectedChain={props.selectedChain} setSelectedChain={props.setSelectedChain} isLoading={props.isLoading} />;
}
