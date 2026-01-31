
"use client";

import { QRCodeSVG } from 'qrcode.react';

import { X, Copy, Check, ArrowLeft, ArrowUpRight, Bell } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { chains } from '@/lib/mock-data';
import Image from 'next/image';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets?: Array<{ chain: string; address: string }>;
  selectedChain: string | null;
  setSelectedChain: (chain: string | null) => void;
}
// ...existing code...

export default function DepositModal({ isOpen, onClose, wallets, selectedChain, setSelectedChain }: DepositModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrZoom, setQrZoom] = useState(false);
  const [depositInfo, setDepositInfo] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  // Map wallets array to a lookup object for fast access
  const walletMap = wallets?.reduce((acc, w) => {
    acc[w.chain] = w.address;
    return acc;
  }, {} as Record<string, string>) || {};
  // Poll USDC balance when QR is open
  const [notificationChain, setNotificationChain] = useState<string | null>(null);
  useEffect(() => {
    if (selectedChain && walletMap[selectedChain]) {
      setNotificationChain(selectedChain);
      setIsBuffering(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('usdc-buffering', { detail: true }));
      }
      const poll = async () => {
        try {
          const res = await fetch(`/api/check-usdc?chainId=${selectedChain}&address=${walletMap[selectedChain]}`);
          const data = await res.json();
          if (data.result && data.result !== 'NA') {
            setDepositInfo(data.result);
          } else {
            setDepositInfo(null);
          }
        } catch {}
      };
      poll();
      pollingRef.current = setInterval(poll, 5000);
      return () => {
        setIsBuffering(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('usdc-buffering', { detail: false }));
        }
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    } else {
      setDepositInfo(null);
      setIsBuffering(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('usdc-buffering', { detail: false }));
      }
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [selectedChain, walletMap]);

  // Find address for selected chain
  const getAddress = (chainId: string) => {
    if (!wallets) return '';
    const found = wallets.find((w) => w.chain.toLowerCase() === chainId.toLowerCase() || w.chain === chainId);
    return found ? found.address : '';
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  // When a chain is selected
  const handleSelectChain = (chainId: string) => {
    setSelectedChain(chainId);
    setNotificationChain(chainId);
  };

  // When modal closes or back
  const handleBack = () => {
    setSelectedChain(null);
    setNotificationChain(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg">
          <div className="flex items-center justify-center mb-6 gap-2">
            {/* Only keep notification icon in topbar, remove duplicate buffering and Deposit USDC text here */}
          </div>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowLeft onClick={onClose} className="w-5 h-5 cursor-pointer" />
            <span className="font-semibold text-lg">Deposit</span>
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
        {/* Content */}
        <div className="px-6 py-6">
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
                    className="flex flex-col items-center justify-center p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center focus:outline-none"
                    disabled={!walletMap[chain.id]}
                  >
                    <span className="mb-1 inline-flex items-center justify-center rounded-full bg-muted" style={{ width: 40, height: 40 }}>
                      <Image src={chain.logo} alt={chain.name} width={40} height={40} style={{ objectFit: 'cover' }} className="rounded-full" />
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                className="flex items-center gap-2 mb-4 text-xs text-muted-foreground hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all chains
              </button>
              <div className="flex flex-col items-center gap-4">
                <span className="inline-flex items-center justify-center rounded-full bg-muted" style={{ width: 56, height: 56 }}>
                  <Image src={chains.find((c) => c.id === selectedChain)?.logo || ''} alt={chains.find((c) => c.id === selectedChain)?.name || ''} width={56} height={56} style={{ objectFit: 'cover' }} className="rounded-full" />
                </span>
                <div className="flex flex-col items-center mt-2">
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
                        {/* Deposit info display */}
                        {depositInfo && (
                          <div className="mt-4 p-2 rounded bg-green-100 text-green-800 font-mono text-xs text-center">
                            Deposit found: {depositInfo}
                          </div>
                        )}
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
        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-2 border border-border rounded-lg font-mono hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
