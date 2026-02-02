"use client";
import { useState } from 'react';
import { DepositContainer } from './DepositContainer';
import { X, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';


export interface DepositModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Array<{ chain: string; address: string }>;
  selectedChain: string | null;
  setSelectedChain: (chain: string | null) => void;
  isLoading?: boolean;
}

export default function DepositModalWrapper({ isOpen, onClose, wallets, selectedChain, setSelectedChain, isLoading }: DepositModalWrapperProps) {

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0">
      <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg mt-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">Deposit</span>
            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b border-accent"></div>}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/deposit" className="p-1 hover:bg-muted rounded transition-colors" title="Open full page">
              <ArrowUpRight className="w-5 h-5" />
            </Link>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="px-6 py-6">
          <DepositContainer 
            wallets={wallets} 
            selectedChain={selectedChain} 
            setSelectedChain={setSelectedChain} 
            showBack={true}
            isLoading={isLoading}
          />
        </div>
        {/* Removed duplicate Close button, cross button remains in header */}
      </div>
    </div>
  );
}
