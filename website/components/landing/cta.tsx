'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 md:py-32 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold font-mono mb-6 leading-tight">
          Ready to streamline your payments?
        </h2>

        <p className="text-lg opacity-90 mb-8">
          Join thousands of users sending USDC instantly across blockchains.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-primary-foreground text-primary rounded-lg font-bold font-mono hover:opacity-90 transition-opacity flex items-center gap-2 justify-center"
          >
            Start Now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button disabled className="px-8 py-3 border-2 border-primary-foreground/30 rounded-lg font-bold font-mono opacity-50 cursor-not-allowed hover:border-primary-foreground/50 transition-colors relative group">
            Schedule Demo
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-muted text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
          </button>
        </div>

        <p className="text-sm opacity-75 mt-8">
          No credit card required. Deploy in seconds.
        </p>
      </div>
    </section>
  );
}
