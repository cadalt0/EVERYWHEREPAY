'use client';

import { mockTransactions } from '@/lib/mock-data';
import { Send, ArrowDownLeft, Share2, Clock, X } from 'lucide-react';
import { useState } from 'react';

export function TransactionTable() {
  const [selectedTx, setSelectedTx] = useState<(typeof mockTransactions)[0] | null>(null);
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <Send className="w-4 h-4" />;
      case 'receive':
        return <ArrowDownLeft className="w-4 h-4" />;
      case 'multisend':
        return <Share2 className="w-4 h-4" />;
      case 'request':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (tx: (typeof mockTransactions)[0]) => {
    switch (tx.type) {
      case 'send':
        return `Send to ${tx.recipient}`;
      case 'receive':
        return `Receive from ${tx.sender}`;
      case 'multisend':
        return `Send to ${tx.recipients} recipients`;
      case 'request':
        return `Request from ${tx.requester}`;
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950';
      case 'processing':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950';
      default:
        return '';
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                Type
              </th>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                Details
              </th>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                Amount
              </th>
              <th className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                Chain
              </th>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                Status
              </th>
              <th className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {mockTransactions.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <td className="px-3 md:px-6 py-3 md:py-4">
                  <div className="flex items-center gap-2 text-primary">
                    {getTypeIcon(tx.type)}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4">
                  <div className="text-xs md:text-sm font-mono">{getTypeLabel(tx)}</div>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4">
                  <div className="text-xs md:text-sm font-semibold font-mono">
                    ${(tx.amount || tx.totalAmount).toLocaleString()}
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4">
                  <div className="text-sm text-muted-foreground font-mono">
                    {tx.chain}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4">
                  <span
                    className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs font-semibold font-mono capitalize ${getStatusColor(
                      tx.status
                    )}`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4">
                  <div className="text-xs md:text-sm text-muted-foreground font-mono">
                    {tx.date}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-mono">Transaction Details</h2>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {selectedTx.type === 'send' && <Send className="w-5 h-5 text-primary" />}
                {selectedTx.type === 'receive' && <ArrowDownLeft className="w-5 h-5 text-green-600" />}
                {selectedTx.type === 'multisend' && <Share2 className="w-5 h-5 text-primary" />}
                {selectedTx.type === 'request' && <Clock className="w-5 h-5 text-yellow-600" />}
                <div>
                  <p className="text-sm font-mono font-semibold">
                    {selectedTx.type === 'send' && `Send to ${selectedTx.recipient}`}
                    {selectedTx.type === 'receive' && `Receive from ${selectedTx.sender}`}
                    {selectedTx.type === 'multisend' && `Send to ${selectedTx.recipients} recipients`}
                    {selectedTx.type === 'request' && `Request from ${selectedTx.requester}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">Amount</p>
                  <p className="font-mono font-semibold">${(selectedTx.amount || selectedTx.totalAmount)?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">Chain</p>
                  <p className="font-mono font-semibold capitalize">{selectedTx.chain}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-mono mb-1">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold font-mono capitalize ${
                    selectedTx.status === 'completed'
                      ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950'
                      : selectedTx.status === 'pending'
                        ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950'
                        : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
                  }`}
                >
                  {selectedTx.status}
                </span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-mono mb-1">Date</p>
                <p className="font-mono text-sm">{selectedTx.date}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-mono mb-1">Transaction ID</p>
                <p className="font-mono text-xs break-all text-foreground/70">{selectedTx.id}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full mt-6 py-2 border border-border rounded-lg font-mono hover:bg-muted transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
