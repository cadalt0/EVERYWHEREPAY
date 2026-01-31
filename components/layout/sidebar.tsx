'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Wallet, Settings, LogOut, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { SettingsModal } from '@/components/dashboard/modals/settings-modal';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/deposit', label: 'Deposit', icon: Plus },
  { href: '/send', label: 'Send', icon: Send },
  { href: '/request', label: 'Request', icon: Share2 },
  { href: '/invoice', label: 'Invoices', icon: FileText },
  { href: '/payout', label: 'Payouts', icon: Wallet },
];
import { Plus, Send, Share2 } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="hidden md:hidden fixed top-20 left-4 z-40">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`border-r border-border bg-card flex flex-col h-screen sticky top-0 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } hidden md:flex`}
      >
        {/* Logo */}
        <div className="px-6 py-8 border-b border-border flex items-center justify-between">
          <Link
            href="/dashboard"
            className={`font-bold font-mono tracking-tighter transition-all ${
              isCollapsed ? 'text-sm' : 'text-xl'
            }`}
          >
            {!isCollapsed && 'EVERYWHEREPAY'}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-muted rounded transition-colors hidden lg:block"
            style={{ marginLeft: isCollapsed ? 0 : 'auto' }}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : ''}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono transition-all justify-center md:justify-start ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-4 py-6 border-t border-border space-y-2">
          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors font-mono text-sm justify-center md:justify-start"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/';
            }}
            title="Logout"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors font-mono text-sm justify-center md:justify-start"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isCollapsed && (
        <aside className="w-64 border-r border-border bg-card flex flex-col h-screen fixed top-0 left-0 z-30 md:hidden">
          <div className="px-6 py-8 border-b border-border flex items-center justify-between">
            <Link href="/dashboard" className="font-bold text-xl font-mono tracking-tighter">
              EVERYWHEREPAY
            </Link>
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsCollapsed(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-6 border-t border-border space-y-2">
            <button
              onClick={() => {
                setShowSettings(true);
                setIsCollapsed(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors font-mono text-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('user');
                window.location.href = '/';
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors font-mono text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      )}

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
