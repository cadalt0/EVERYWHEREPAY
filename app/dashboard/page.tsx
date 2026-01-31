'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { BalanceCard } from '@/components/dashboard/balance-card';
import { SendModal } from '@/components/dashboard/modals/send-modal';
import { DepositModal } from '@/components/dashboard/modals/deposit-modal';
import { RequestModal } from '@/components/dashboard/modals/request-modal';
import { TransactionTable } from '@/components/dashboard/transaction-table';
import { Send, Plus, Share2, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import DashboardAuthChecker from './page-client-auth';
import GoogleUserLogger from './page-client-google-user';
import { toast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const [openModals, setOpenModals] = useState({
    send: false,
    deposit: false,
    request: false,
  });

  const toggleModal = (modal: keyof typeof openModals) => {
    setOpenModals((prev) => ({ ...prev, [modal]: !prev[modal] }));
  };

  return (
    <div className="flex h-screen bg-background">
      <DashboardAuthChecker />
      <GoogleUserLogger />
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Dashboard">
          <button
            onClick={() => {
              localStorage.removeItem('user');
              toast({
                title: 'Logged out',
                description: 'You have been logged out.',
                variant: 'default',
              });
              setTimeout(() => {
                window.location.href = '/auth/login';
              }, 800);
            }}
            className="ml-auto px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-mono font-bold hover:bg-destructive/80 transition-colors"
          >
            Logout
          </button>
        </Topbar>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 space-y-8">
            {/* Balance Section */}
            <BalanceCard />

            {/* Quick Actions */}
            <div>
              <h2 className="text-sm md:text-lg font-bold font-mono mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="group">
                  <button
                    onClick={() => toggleModal('send')}
                    className="w-full flex items-center justify-between px-6 py-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all font-mono font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <Send className="w-5 h-5 text-primary" />
                      Send
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <Link
                    href="/send"
                    className="text-xs text-muted-foreground hover:text-primary mt-1 inline-block font-mono"
                  >
                    Open page →
                  </Link>
                </div>
                <div className="group">
                  <button
                    onClick={() => toggleModal('deposit')}
                    className="w-full flex items-center justify-between px-6 py-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all font-mono font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="w-5 h-5 text-primary" />
                      Deposit
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <Link
                    href="/deposit"
                    className="text-xs text-muted-foreground hover:text-primary mt-1 inline-block font-mono"
                  >
                    Open page →
                  </Link>
                </div>
                <div className="group">
                  <button
                    onClick={() => toggleModal('request')}
                    className="w-full flex items-center justify-between px-6 py-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all font-mono font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <Share2 className="w-5 h-5 text-primary" />
                      Request
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <Link
                    href="/request"
                    className="text-xs text-muted-foreground hover:text-primary mt-1 inline-block font-mono"
                  >
                    Open page →
                  </Link>
                </div>
                <div className="group">
                  <Link
                    href="/invoice/create"
                    className="w-full flex items-center justify-between px-6 py-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all font-mono font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      Invoice
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-lg font-bold font-mono mb-4">Recent Activity</h2>
              <TransactionTable />
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <SendModal
        isOpen={openModals.send}
        onClose={() => toggleModal('send')}
      />
      <DepositModal
        isOpen={openModals.deposit}
        onClose={() => toggleModal('deposit')}
      />
      <RequestModal
        isOpen={openModals.request}
        onClose={() => toggleModal('request')}
      />
    </div>
  );
}
