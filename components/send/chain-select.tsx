"use client";

import * as React from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { chains } from "@/lib/mock-data";

export interface ChainSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ChainSelect({ value, onChange, className = "" }: ChainSelectProps) {
  // Only allow arc, avax, base, ethereum
  const allowedChainIds = ["ARC-TESTNET", "AVAX-FUJI", "BASE-SEPOLIA", "ETH-SEPOLIA"];
  const filteredChains = chains.filter((c) => allowedChainIds.includes(c.id));
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger
        className={`flex items-center w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10 ${className}`}
      >
        {(() => {
          const selected = filteredChains.find((c) => c.id === value);
          return selected ? (
            <span className="flex items-center gap-2">
              <img src={selected.logo} alt={selected.name} className="w-5 h-5 object-contain mr-2" />
              {selected.name}
            </span>
          ) : (
            <span>Select chain</span>
          );
        })()}
        <ChevronDown className="ml-auto w-4 h-4 opacity-60" />
      </Select.Trigger>
      <Select.Content className="z-50 bg-background border border-border rounded-lg shadow-lg mt-1">
        <Select.Viewport className="p-2">
          {filteredChains.map((chain) => (
            <Select.Item
              key={chain.id}
              value={chain.id}
              className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-muted focus:bg-muted text-sm font-mono"
            >
              <img src={chain.logo} alt={chain.name} className="w-5 h-5 object-contain mr-2" />
              <Select.ItemText>{chain.name}</Select.ItemText>
              <Select.ItemIndicator className="ml-auto">
                <Check className="w-4 h-4 text-primary" />
              </Select.ItemIndicator>
            </Select.Item>
          ))}
        </Select.Viewport>
      </Select.Content>
    </Select.Root>
  );
}
