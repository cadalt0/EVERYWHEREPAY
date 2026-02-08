'use client';

import { HeroSection } from '@/components/landing/hero';
import { FeaturesSection } from '@/components/landing/features';
import { TestimonialsSection } from '@/components/landing/testimonials';
import { CTASection } from '@/components/landing/cta';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-bold font-mono text-lg mb-4">EVERYWHEREPAY</div>
              <p className="text-sm text-muted-foreground">
                Cross-chain USDC payments made simple.
              </p>
            </div>
            <div>
              <div className="font-semibold font-mono text-sm mb-4">Product</div>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="cursor-not-allowed text-muted-foreground/50 hover:text-muted-foreground/70 relative group transition-colors">
                    Features
                    <span className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-muted text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
                  </span>
                </li>
                <li>
                  <span className="cursor-not-allowed text-muted-foreground/50 hover:text-muted-foreground/70 relative group transition-colors">
                    Pricing
                    <span className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-muted text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
                  </span>
                </li>
                <li>
                  <span className="cursor-not-allowed text-muted-foreground/50 hover:text-muted-foreground/70 relative group transition-colors">
                    API Docs
                    <span className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-muted text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold font-mono text-sm mb-4">Company</div>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="cursor-not-allowed text-muted-foreground/50 hover:text-muted-foreground/70 relative group transition-colors">
                    Blog
                    <span className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-muted text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
                  </span>
                </li>
                <li>
                  <span className="cursor-not-allowed text-muted-foreground/50 hover:text-muted-foreground/70 relative group transition-colors">
                    About
                    <span className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-muted text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
                  </span>
                </li>
                <li>
                  <span className="cursor-not-allowed text-muted-foreground/50 hover:text-muted-foreground/70 relative group transition-colors">
                    Contact
                    <span className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-muted text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold font-mono text-sm mb-4">Legal</div>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="cursor-not-allowed text-muted-foreground/50 hover:text-muted-foreground/70 relative group transition-colors">
                    Privacy
                    <span className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-muted text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
                  </span>
                </li>
                <li>
                  <span className="cursor-not-allowed text-muted-foreground/50 hover:text-muted-foreground/70 relative group transition-colors">
                    Terms
                    <span className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-muted text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
                  </span>
                </li>
                <li>
                  <span className="cursor-not-allowed text-muted-foreground/50 hover:text-muted-foreground/70 relative group transition-colors">
                    Security
                    <span className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-muted text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
            <div>© 2026 EVERYWHEREPAY. All rights reserved.</div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <span className="cursor-not-allowed text-muted-foreground/50 hover:text-muted-foreground/70 relative group transition-colors">
                Twitter
                <span className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-muted text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
              </span>
              <a href="#" className="hover:text-foreground transition-colors">
                GitHub
              </a>
              <span className="cursor-not-allowed text-muted-foreground/50 hover:text-muted-foreground/70 relative group transition-colors">
                Discord
                <span className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-muted text-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Coming Soon</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
