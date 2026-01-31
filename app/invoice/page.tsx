'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { mockInvoices } from '@/lib/mock-data';
import Link from 'next/link';
import { Plus, Download } from 'lucide-react';

export default function InvoicePage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950';
      default:
        return '';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Invoices" />

        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            {/* Header with Action */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Manage and track your invoices
                </p>
              </div>
              <Link
                href="/invoice/create"
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Create Invoice
              </Link>
            </div>

            {/* Invoices Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                        Invoice ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                        From / To
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                        Chain
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                        Due Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold font-mono text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-mono font-semibold text-sm">
                            {invoice.id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-semibold">To: {invoice.client}</p>
                            <p className="text-xs text-muted-foreground">From: You</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono font-semibold text-sm">
                            ${invoice.amount.toLocaleString()} USDC
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono capitalize text-muted-foreground">
                            Ethereum
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground font-mono">
                            {invoice.dueDate}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold font-mono capitalize ${getStatusColor(
                              invoice.status
                            )}`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-primary hover:text-primary/80 font-mono text-sm font-semibold flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            Download
                          </button>
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
