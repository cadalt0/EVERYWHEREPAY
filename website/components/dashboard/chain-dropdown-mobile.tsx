import { useState } from 'react';
import { chains } from '@/lib/mock-data';

export function ChainDropdownMobile({ onSelect, selected }: { onSelect: (id: string) => void, selected: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-full">
      <button
        className="w-full flex items-center justify-between px-5 py-3 bg-background border-2 border-accent rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label="Select chain"
        style={{ zIndex: 30 }}
      >
        <span className="flex items-center gap-2">
          {selected ? (
            <>
              <img src={chains.find(c => c.id === selected)?.logo || ''} alt="" className="w-7 h-7 rounded-full border border-border" />
              <span className="font-mono text-base font-semibold text-foreground">{chains.find(c => c.id === selected)?.name}</span>
            </>
          ) : (
            <span className="font-mono text-base font-semibold text-accent">Select chain</span>
          )}
        </span>
        <svg className="w-5 h-5 text-accent" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50" style={{ zIndex: 50 }}>
          <button
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted text-left"
            onClick={() => { onSelect(''); setOpen(false); }}
          >
            <span className="font-mono text-sm text-muted-foreground">Select chain</span>
          </button>
          {chains.map(chain => (
            <button
              key={chain.id}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted text-left"
              onClick={() => { onSelect(chain.id); setOpen(false); }}
            >
              <img src={chain.logo} alt={chain.name} className="w-5 h-5 rounded-full" />
              <span className="font-mono text-sm">{chain.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
