'use client';

import { Bell, User } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';
import { mockUser } from '@/lib/mock-data';

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-40">
      <div className="px-4 md:px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold font-mono">{title}</h1>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
            <Bell className="w-4 md:w-5 h-4 md:h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
          </button>

          <ThemeToggle />

          <button className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
            <img
              src={mockUser.avatar || "/placeholder.svg"}
              alt={mockUser.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="text-left">
              <div className="text-sm font-semibold font-mono">{mockUser.name}</div>
              <div className="text-xs text-muted-foreground">{mockUser.email}</div>
            </div>
          </button>

          <button className="flex md:hidden items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors">
            <img
              src={mockUser.avatar || "/placeholder.svg"}
              alt={mockUser.name}
              className="w-8 h-8 rounded-full"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
