'use client';

import Link from 'next/link';
import { ThemeToggle } from '../theme-toggle';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary border-b border-border">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-2xl font-mono tracking-tighter">
            EVERYWHEREPAY
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-6 inline-block">
              <span className="inline-block w-2 h-2 bg-primary mr-3"></span>
              <span className="text-sm font-mono text-muted-foreground">
                CROSS-CHAIN PAYMENTS
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold font-mono leading-tight mb-6 tracking-tight">
              Send USDC{' '}
              <span className="text-accent">anywhere</span>, instantly.
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Send, receive, and manage stablecoin payments across blockchains with zero friction. No intermediaries. No waiting.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/login"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold font-mono hover:opacity-90 transition-opacity flex items-center gap-2 w-fit"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="px-8 py-3 border border-border rounded-lg font-bold font-mono hover:bg-muted transition-colors">
                View Docs
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border">
              <div>
                <div className="font-mono text-2xl font-bold mb-1">
                  $500M+
                </div>
                <div className="text-sm text-muted-foreground">Volume</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold mb-1">
                  12,000+
                </div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold mb-1">
                  5s
                </div>
                <div className="text-sm text-muted-foreground">Avg Speed</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-full aspect-square max-w-md">
              {/* Geometric shapes representing payment flows */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-border rounded-lg"></div>
                <div className="absolute w-48 h-48 border-2 border-primary rounded-lg"></div>
                <div className="absolute w-32 h-32 border-2 border-accent rounded-lg animate-pulse"></div>
              </div>
              <div className="absolute top-8 right-8 w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center border border-primary">
                <span className="text-2xl font-bold font-mono">$</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
