'use client';

import { Bell, User } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';
import { useEffect, useState } from 'react';

import { chains } from '@/lib/mock-data';

interface TopbarProps {
  title: string;
  selectedChain?: string | null;
}

interface User {
  name: string;
  email: string;
  avatar?: string;
}

export function Topbar({ title, selectedChain }: TopbarProps) {
  const [user, setUser] = useState<User | null>(null);
  // Buffering state from window (set by DepositPage)
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handler = (e: CustomEvent) => setIsBuffering(e.detail === true);
      window.addEventListener('usdc-buffering', handler as EventListener);
      return () => window.removeEventListener('usdc-buffering', handler as EventListener);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch {
          setUser(null);
        }
      }
    }
  }, []);

  return (
    <header className="border-b border-border bg-card sticky top-0 z-40">
      <div className="px-4 md:px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold font-mono">{title}</h1>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
            {selectedChain ? (
              <span className="inline-flex items-center justify-center rounded-full bg-muted relative" style={{ width: 40, height: 40 }}>
                {isBuffering && (
                  <span className="absolute inset-0 flex items-center justify-center animate-spin">
                    <svg className="w-12 h-12 text-primary/40" viewBox="0 0 24 24">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                  </span>
                )}
                <img
                  src={chains.find(c => c.id === selectedChain)?.logo || ''}
                  alt={chains.find(c => c.id === selectedChain)?.name || ''}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </span>
            ) : (
              <Bell className="w-4 md:w-5 h-4 md:h-5" />
            )}
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
          </button>

          <ThemeToggle />

          <button className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
            <img
              src={user?.avatar || "/placeholder.svg"}
              alt={user?.name || "User"}
              className="w-8 h-8 rounded-full"
            />
            <div className="text-left">
              <div className="text-sm font-semibold font-mono">{user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground">{user?.email || ''}</div>
            </div>
          </button>

          <button className="flex md:hidden items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors">
            <img
              src={user?.avatar || "/placeholder.svg"}
              alt={user?.name || "User"}
              className="w-8 h-8 rounded-full"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
