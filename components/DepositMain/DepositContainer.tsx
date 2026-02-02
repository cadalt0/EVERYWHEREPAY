"use client";

import { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { chains } from '@/lib/mock-data';
import Image from 'next/image';
import { Copy, Check, ArrowLeft } from 'lucide-react';

export interface DepositContainerProps {
  wallets: Array<{ chain: string; address: string }>;
  selectedChain: string | null;
  setSelectedChain: (chain: string | null) => void;
  onBack?: () => void;
  onClose?: () => void;
  showBack?: boolean;
  showClose?: boolean;
  isModal?: boolean;
  isLoading?: boolean;
}

export function DepositContainer({
  wallets,
  selectedChain,
  setSelectedChain,
  onBack,
  onClose,
  showBack = true,
  showClose = false,
  isModal = false,
  isLoading = false,
}: DepositContainerProps) {
  const [copied, setCopied] = useState(false);
  const [qrZoom, setQrZoom] = useState(false);
  
  // Map wallets array to a lookup object for fast access
  const walletMap = useMemo(() => {
    return wallets?.reduce((acc, w) => {
      acc[w.chain] = w.address;
      return acc;
    }, {} as Record<string, string>) || {};
  }, [wallets]);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectChain = (chainId: string) => {
    setSelectedChain(chainId);
  };

  const handleBack = () => {
    setSelectedChain(null);
    if (onBack) onBack();
  };

  return (
    <div className="p-0 max-w-2xl mx-auto">
      {!selectedChain ? (
        <>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Select a blockchain to deposit USDC
          </p>
          <div className="grid grid-cols-3 gap-6 justify-items-center">
            {[...chains].sort((a, b) => a.name.localeCompare(b.name)).map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleSelectChain(chain.id)}
                className="flex flex-col items-center justify-center p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!walletMap[chain.id] || isLoading}
                title={isLoading ? 'loading ...' : ''}
              >
                <span className="mb-1 inline-flex items-center justify-center rounded-full bg-muted" style={{ width: 40, height: 40 }}>
                  <Image src={chain.logo} alt={chain.name} width={40} height={40} style={{ objectFit: 'cover' }} className="rounded-full" />
                </span>
                <span className="text-xs font-mono mt-1 text-foreground">{chain.name}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {showBack && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 mb-4 text-xs text-muted-foreground hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all chains
            </button>
          )}
          <div className="flex flex-col items-center gap-4">
            <span className="inline-flex items-center justify-center rounded-full bg-muted" style={{ width: 56, height: 56 }}>
              <Image src={chains.find((c) => c.id === selectedChain)?.logo || ''} alt={chains.find((c) => c.id === selectedChain)?.name || ''} width={56} height={56} style={{ objectFit: 'cover' }} className="rounded-full" />
            </span>
            <div className="flex flex-col items-center mt-2">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-mono font-semibold text-primary shadow-sm">
                Minimum deposit: 0.1 USDC
              </div>
              {walletMap[selectedChain] && (
                <button
                  className="bg-white p-2 rounded border border-border focus:outline-none"
                  onClick={() => setQrZoom(true)}
                  title="Click to enlarge QR"
                >
                  <QRCodeSVG value={walletMap[selectedChain]} size={120} />
                </button>
              )}
              {qrZoom && walletMap[selectedChain] && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setQrZoom(false)}>
                  <div className="bg-white p-6 rounded-lg border border-border shadow-lg flex flex-col items-center" onClick={e => e.stopPropagation()}>
                    <QRCodeSVG value={walletMap[selectedChain]} size={240} />
                    <button className="mt-4 px-4 py-2 rounded bg-primary text-primary-foreground font-mono text-xs" onClick={() => setQrZoom(false)}>Close</button>
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground font-mono mt-1">QR Code</div>
            </div>
            <div className="font-mono text-xs font-semibold mb-2">
              {chains.find((c) => c.id === selectedChain)?.name}
            </div>
            <div className="font-mono text-xs break-all bg-muted rounded p-2 w-full text-center">
              {walletMap[selectedChain] || '—'}
            </div>
            {walletMap[selectedChain] && (
              <button
                onClick={() => copyAddress(walletMap[selectedChain])}
                className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded font-mono text-xs hover:opacity-90 transition-opacity w-fit"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Address'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
