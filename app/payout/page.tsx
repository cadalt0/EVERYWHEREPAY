'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { mockPayouts } from '@/lib/mock-data';
import { Plus, Upload, Send } from 'lucide-react';
import { useState } from 'react';

export default function PayoutPage() {
  const [showAddForm, setShowAddForm] = useState(false);

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
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Payouts" />

        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-mono font-bold"
              >
                <Plus className="w-4 h-4" />
                Add Recipient
              </button>
              <button className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-mono font-bold">
                <Upload className="w-4 h-4" />
                Upload CSV
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity ml-auto">
                <Send className="w-4 h-4" />
                Run Payout
              </button>
            </div>

            {/* Add Recipient Form */}
            {showAddForm && (
              <div className="border border-border rounded-lg p-6 bg-card space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground mb-2 block">
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x... or .eth"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground mb-2 block">
                      Chain
                    </label>
                    <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm">
                      <option>Ethereum</option>
                      <option>Polygon</option>
                      <option>Arbitrum</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground mb-2 block">
                      Amount (USDC)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-mono font-semibold hover:opacity-90 transition-opacity">
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 py-2 border border-border rounded-lg font-mono hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payouts Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                        Recipient
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                        Chain
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPayouts.map((payout) => (
                      <tr
                        key={payout.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-mono font-semibold text-sm">
                            {payout.recipient}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground">
                            {payout.chain}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono font-semibold text-sm">
                            ${payout.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold font-mono capitalize ${getStatusColor(
                              payout.status
                            )}`}
                          >
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground font-mono">
                            {payout.date}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
