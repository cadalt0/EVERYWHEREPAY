'use client';

import { Send, TrendingUp, FileText, Zap, Globe, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Send,
    title: 'Send USDC',
    description: 'Transfer funds across any blockchain with a single click.',
  },
  {
    icon: TrendingUp,
    title: 'Multi-send',
    description: 'Batch payments to multiple recipients in one transaction.',
  },
  {
    icon: FileText,
    title: 'Invoices',
    description: 'Create and manage professional invoices with ease.',
  },
  {
    icon: Zap,
    title: 'Fast',
    description: 'Settle payments in seconds, not hours.',
  },
  {
    icon: Globe,
    title: 'Global',
    description: 'Support for all major blockchains.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Real-time insights into your payment flows.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-32 border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <div className="mb-4 inline-block">
            <span className="inline-block w-2 h-2 bg-accent mr-3"></span>
            <span className="text-sm font-mono text-muted-foreground">
              CAPABILITIES
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-mono mb-4">
            Everything you need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A complete toolkit for cross-chain stablecoin payments.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="border border-border p-8 rounded-lg hover:border-primary hover:shadow-lg transition-all duration-300 group"
            >
              <feature.icon className="w-8 h-8 text-primary mb-4 group-hover:text-accent transition-colors" />
              <h3 className="font-bold font-mono mb-2 text-lg">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
