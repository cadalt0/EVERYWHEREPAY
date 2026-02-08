"use client";

import { useState } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";
import { chains } from "@/lib/mock-data";
import { ChainSelect } from "./chain-select";

export interface SendFormProps {
  isMultiDefault?: boolean;
  onCancel?: () => void;
  onSend?: (recipients: Array<{ chain: string; address: string; amount: string }>, note: string) => void;
  showCancel?: boolean;
  showNote?: boolean;
  submitLabel?: string;
  className?: string;
  disableMultiSend?: boolean;
}

export function SendForm({
  isMultiDefault = false,
  onCancel,
  onSend,
  showCancel = true,
  showNote = true,
  submitLabel,
  className = "",
  disableMultiSend = false,
}: SendFormProps) {
  const { toast } = useToast();
  const [isMulti, setIsMulti] = useState(isMultiDefault);
  const [recipients, setRecipients] = useState([
    { chain: "BASE-SEPOLIA", address: "0xb585f8e096e17dFB1f0B20FA0F9eC9Da4b2646A3", amount: "1" },
  ]);
  const [note, setNote] = useState("");

  const addRecipient = () => {
    if (recipients.length < 9) {
      setRecipients([...recipients, { chain: "BASE-SEPOLIA", address: "", amount: "" }]);
    }
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const handleRecipientChange = (index: number, field: string, value: string) => {
    const newRecipients = [...recipients];
    (newRecipients[index] as any)[field] = value;
    setRecipients(newRecipients);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSend) onSend(recipients, note);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isMulti
          ? "w-full h-full p-0 bg-background border-none rounded-none flex flex-col gap-6"
          : `w-full max-w-xl mx-auto bg-card border border-border rounded-2xl p-16 shadow-2xl flex flex-col justify-center ${className}`
      }
      style={isMulti ? { minHeight: '70vh' } : { minHeight: '700px', maxWidth: '600px' }}
    >
      {/* Multi-send toggle */}
      <div className="flex items-center justify-between mb-6 p-2 bg-muted/50 rounded-lg">
        <label className="text-sm font-mono font-semibold">Enable Multi-send</label>
        <button
          type="button"
          onClick={() => {
            if (disableMultiSend) {
              toast({
                title: "Multi-send only available on Send page",
                description: "Redirecting you to the full Send page...",
                variant: "accent"
              });
              setTimeout(() => {
                window.location.href = "/send?multi=1";
              }, 900);
            } else {
              setIsMulti(!isMulti);
              if (!isMulti && typeof window !== 'undefined' && window.location.pathname.includes('/send')) {
                const url = new URL(window.location.href);
                url.searchParams.set('multi', '1');
                window.history.replaceState({}, '', url.toString());
              }
            }
          }}
          className={`relative w-14 h-7 rounded-full border transition-colors duration-200
            ${isMulti ? "bg-accent border-accent" : "bg-muted border-border"}`}
          aria-pressed={isMulti}
          title={disableMultiSend ? "Multi-send is only available on the full Send page" : undefined}
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow transition-transform duration-200
              ${isMulti ? "translate-x-7 bg-accent-foreground" : "translate-x-0 bg-card dark:bg-neutral-900"}`}
          />
        </button>
      </div>

      {/* Recipients */}
      <div
        className={
          isMulti
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full mb-6 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            : "space-y-6 mb-6"
        }
        style={isMulti ? { flex: 1, maxHeight: '70vh', paddingBottom: 8 } : {}}
      >
        {recipients.map((recipient, index) => (
          <div
            key={index}
                className={
                  isMulti
                    ? `bg-card border border-border rounded-lg flex flex-col gap-8 relative ${className === 'sendpage-context' ? 'p-16 min-h-[540px] max-h-[540px] max-w-[900px]' : 'p-8 min-h-[320px] max-h-[320px] max-w-[640px]'}`
                    : `p-6 border border-border rounded-lg space-y-4 relative ${className}`
                }
                style={isMulti
                  ? className === 'sendpage-context'
                    ? { width: '100%', margin: '0 auto' }
                    : { width: '100%', margin: '0 auto' }
                  : {}}
          >
            {isMulti && recipients.length > 1 && (
              <button
                type="button"
                onClick={() => removeRecipient(index)}
                className="absolute top-2 right-2 p-1 hover:bg-muted rounded transition-colors"
                title="Remove recipient"
              >
                <X className="w-4 h-4 text-destructive" />
              </button>
            )}
            <div>
              <label className="text-sm font-mono text-muted-foreground mb-2 block">Chain</label>
              <div className="relative">
                <ChainSelect
                  value={recipient.chain}
                  onChange={(val) => handleRecipientChange(index, "chain", val)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-mono text-muted-foreground mb-2 block">
                {isMulti ? `Recipient ${index + 1} Address` : "Recipient Address"}
              </label>
              <input
                type="text"
                placeholder="0x... or .eth"
                value={recipient.address}
                onChange={e => handleRecipientChange(index, "address", e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-mono text-muted-foreground mb-2 block">Amount (USDC)</label>
              <input
                type="number"
                placeholder="0.00"
                value={recipient.amount}
                onChange={e => handleRecipientChange(index, "amount", e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                required
                min="0"
                step="any"
              />
            </div>
          </div>
        ))}
      </div>
      {/* Add recipient button */}
      {isMulti && recipients.length < 9 && (
        <button
          type="button"
          onClick={addRecipient}
          className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-lg text-primary hover:bg-muted transition-colors font-mono text-sm mb-6"
        >
          <Plus className="w-4 h-4" />
          Add another recipient
        </button>
      )}
      {/* Note field */}
      {showNote && !isMulti && (
        <div className="mb-6">
          <label className="text-sm font-mono text-muted-foreground mb-2 block">Note (optional)</label>
          <textarea
            placeholder="Payment for services, invoice ID, or any notes..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
            rows={4}
          />
        </div>
      )}
      {/* Action buttons */}
      <div className="flex gap-3 pt-6 border-t border-border">
        {showCancel && (
          <button
            type="button"
            className="flex-1 py-3 border border-border rounded-lg font-mono hover:bg-muted transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-mono font-bold hover:opacity-90 transition-opacity"
        >
          {submitLabel || (isMulti ? "Send to All" : "Send USDC")}
        </button>
      </div>
    </form>
  );
}
