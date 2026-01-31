'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { chains } from '@/lib/mock-data';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function DepositPage() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = (address: string, chainId: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(chainId);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Deposit USDC" />

        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold font-mono mb-2">Deposit USDC</h1>
              <p className="text-muted-foreground">Send USDC from any exchange or wallet to your EVERYWHEREPAY address</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {chains.map((chain) => (
                <div key={chain.id} className="border border-border rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold font-mono">{chain.name}</h3>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {chain.chainName}
                    </span>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-xs text-muted-foreground font-mono uppercase">Treasury Address</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono break-all flex-1 text-foreground">
                        {chain.address}
                      </code>
                      <button
                        onClick={() => copyToClipboard(chain.address, chain.id)}
                        className="p-2 hover:bg-muted rounded transition-colors flex-shrink-0"
                      >
                        {copiedAddress === chain.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-accent/10 rounded-lg">
                    <p className="text-xs text-muted-foreground font-mono mb-2">QR CODE</p>
                    <div className="w-full h-40 bg-white rounded-lg flex items-center justify-center border-2 border-border">
                      <p className="text-xs text-muted-foreground font-mono">[QR Code]</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-semibold">Min Deposit:</span> {chain.minDeposit}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-semibold">Network Fee:</span> {chain.fee}
                    </p>
                  </div>

                  <button className="w-full py-2 border border-border rounded-lg font-mono hover:bg-muted transition-colors text-sm">
                    Copy Address
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 border border-border rounded-lg bg-muted/30">
              <h3 className="font-bold font-mono mb-3">Important Notes:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground font-mono">
                <li>• Only send USDC to the addresses above</li>
                <li>• Deposits typically arrive within 1-5 minutes</li>
                <li>• Minimum deposit amounts vary by chain</li>
                <li>• Do not send other tokens to these addresses</li>
                <li>• Your funds are stored non-custodially on your behalf</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
