'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Wallet, Settings, LogOut, ChevronLeft } from 'lucide-react';
import { useState, useEffect, useLayoutEffect } from 'react';
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
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load saved sidebar state synchronously before first render to prevent flash
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      setIsCollapsed(saved !== null ? JSON.parse(saved) : false);
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  const handleToggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    }
  };

  // Don't render until state is hydrated from localStorage
  if (isCollapsed === null) {
    return null;
  }

  return (
    <>
      {/* Hamburger button for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg flex flex-col gap-1"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <span className="block w-6 h-1 bg-foreground rounded" />
        <span className="block w-6 h-1 bg-foreground rounded" />
        <span className="block w-6 h-1 bg-foreground rounded" />
      </button>

      {/* Sidebar for desktop */}
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
              isCollapsed ? 'text-lg' : 'text-xl'
            }`}
            style={{ letterSpacing: isCollapsed ? 0 : undefined }}
          >
            {isCollapsed ? 'EP' : 'EVERYWHEREPAY'}
          </Link>
          <button
            onClick={handleToggleSidebar}
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
            // Payouts nav item is grayed out and not clickable
            if (item.href === '/payout') {
              return (
                <div
                  key={item.href}
                  title={isCollapsed ? item.label : ''}
                  className={
                    'flex items-center gap-3 px-4 py-3 rounded-lg font-mono transition-all justify-center md:justify-start text-muted-foreground bg-muted/50 cursor-not-allowed opacity-60'
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm font-semibold">{item.label} (Coming Soon)</span>}
                </div>
              );
            }
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
                  {/* Settings button is already present in the bottom actions below */}
        </nav>

        {/* Bottom Actions */}
        <div className="px-4 py-6 border-t border-border space-y-2">
          <div
            title="Settings (Coming Soon)"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground bg-muted/50 cursor-not-allowed opacity-60 font-mono text-sm justify-center md:justify-start"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Settings (Coming Soon)</span>}
          </div>
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

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar overlay"
          />
          <aside className="w-64 border-r border-border bg-card flex flex-col h-screen fixed top-0 left-0 z-50 md:hidden animate-slide-in">
            <div className="px-6 py-8 border-b border-border flex items-center justify-between">
              <Link href="/dashboard" className="font-bold text-xl font-mono tracking-tighter">
                EVERYWHEREPAY
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
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
              <div
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground bg-muted/50 cursor-not-allowed opacity-60 font-mono text-sm"
                title="Settings (Coming Soon)"
              >
                <Settings className="w-4 h-4" />
                <span>Settings (Coming Soon)</span>
              </div>
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
        </>
      )}

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
