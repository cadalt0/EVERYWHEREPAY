"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { getWalletsForUser, getUserEmail } from '@/lib/balance-checker';
import { Eye, X, Info } from 'lucide-react';
import { chains } from '@/lib/mock-data';

// Helper to check if all required fields are filled
// ...existing code...

interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  price: number;
  amount: number;
}

export default function CreateInvoicePage() {
            // ...existing code...
          const [shareLoading, setShareLoading] = useState(false);
          const [shareModal, setShareModal] = useState<{ open: boolean; link: string } | null>(null);
          const [lastSharedLink, setLastSharedLink] = useState<string | null>(null);
        function generateRequestId() {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let id = '';
          for (let i = 0; i < 10; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
          return id;
        }
      // Autofill handler for INVOICE DETAILS button
      const autofillInvoiceDetails = () => {
        setInvoiceNo('INV-001');
        setIssuedDate('2026-02-08');
        setFormData(prev => ({
          ...prev,
          fromName: 'Acme Corp',
          fromEmail: 'acme@example.com',
          fromCity: 'New York',
          fromCountry: 'USA',
          fromPincode: '10001',
          toName: 'Client LLC',
          toEmail: 'client@example.com',
          toCity: 'San Francisco',
          toCountry: 'USA',
          toPincode: '94105',
          dueDate: '2026-02-15',
          subject: 'Consulting Services',
          // chainAddress stays unchanged
        }));
        setItems([{
          id: '1',
          description: 'Consulting Service Fee',
          qty: 1,
          price: 1000,
          amount: 1000
        }]);
      };
    // Helper to check if all required fields are filled
    const allFieldsFilled = () => {
      const requiredFields = [
        invoiceNo,
        issuedDate,
        formData.dueDate,
        formData.fromName,
        formData.fromEmail,
        formData.fromCity,
        formData.fromCountry,
        formData.fromPincode,
        formData.toName,
        formData.toEmail,
        formData.toCity,
        formData.toCountry,
        formData.toPincode,
        formData.subject
      ];
      return requiredFields.every(f => f && f.trim().length > 0);
    };
  const [invoiceNo, setInvoiceNo] = useState('');
  const [issuedDate, setIssuedDate] = useState('');

  const [formData, setFormData] = useState({
    fromName: '',
    fromEmail: '',
    fromCity: '',
    fromCountry: '',
    fromPincode: '',
    toName: '',
    toEmail: '',
    toCity: '',
    toCountry: '',
    toPincode: '',
    dueDate: '',
    subject: '',
    chain: 'ethereum',
    chainAddress: '',
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [walletMap, setWalletMap] = useState<Record<string, string>>({});

  // On mount, fetch user's wallet address for the selected chain and set it
  useEffect(() => {
    async function fetchWallet() {
      setAddressLoading(true);
      const email = await getUserEmail();
      if (!email) { setAddressLoading(false); return; }
      const map = await getWalletsForUser(email);
      setWalletMap(map);
      setAddressLoading(false);
    }
    fetchWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update chainAddress in formData when walletMap or chain changes
  useEffect(() => {
    const chain = formData.chain || 'ethereum';
    let address = walletMap[chain.toUpperCase()] || walletMap[chain] || '';
    if (!address && Object.values(walletMap).length > 0) {
      address = Object.values(walletMap)[0]; // fallback to first address
    }
    setFormData(prev => ({ ...prev, chainAddress: address }));
  }, [walletMap, formData.chain]);

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', qty: 1, price: 0, amount: 0 },
  ]);

  const [showPreview, setShowPreview] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'qty' || field === 'price') {
            updated.amount = updated.qty * updated.price;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const addItem = () => {
    const newId = String(Math.max(...items.map(i => parseInt(i.id)), 0) + 1);
    setItems([...items, { id: newId, description: '', qty: 1, price: 0, amount: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
    {/* Share Modal */}
    {shareModal?.open && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background border border-border rounded-lg max-w-md w-full p-8 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4">Invoice Shared!</h2>
          <div className="mb-4 w-full">
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Payment Link</label>
            <div className="flex items-center gap-2">
              <input type="text" value={shareModal.link} readOnly className="w-full px-2 py-1 border border-border rounded text-xs font-mono" />
              <button onClick={() => {navigator.clipboard.writeText(shareModal.link)}} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">Copy</button>
            </div>
          </div>
          <button
            className="w-full py-2 mt-2 border border-border rounded font-mono hover:bg-muted transition-colors"
            onClick={() => {
              // Generate PDF using jsPDF
              const doc = new jsPDF();
              doc.text('Invoice', 10, 10);
              doc.text(`Invoice No: ${invoiceNo}`, 10, 20);
              doc.text(`Issued: ${issuedDate}`, 10, 30);
              doc.text(`Due: ${formData.dueDate}`, 10, 40);
              doc.text(`From: ${formData.fromName}, ${formData.fromEmail}, ${formData.fromCity}, ${formData.fromCountry}`, 10, 50);
              doc.text(`To: ${formData.toName}, ${formData.toEmail}, ${formData.toCity}, ${formData.toCountry}`, 10, 60);
              doc.text(`Subject: ${formData.subject}`, 10, 70);
              let y = 80;
              items.forEach((item, idx) => {
                doc.text(`Item ${idx + 1}: ${item.description} x${item.qty} @ $${item.price} = $${item.amount}`, 10, y);
                y += 10;
              });
              doc.text(`Total: $${total} USDC`, 10, y);
              y += 10;
              doc.text(`Pay with EVERYWHEREPAY: ${shareModal.link}`, 10, y);
              doc.save(`invoice-${invoiceNo}.pdf`);
            }}
          >Download PDF</button>
          <button className="w-full py-2 mt-2 border border-border rounded font-mono hover:bg-muted transition-colors" onClick={() => setShareModal(null)}>Close</button>
        </div>
      </div>
    )}
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Create Invoice" />

        <main className="flex-1 overflow-auto">
          <div className="p-8 w-full max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8 w-full">
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header Info */}
                <div className="space-y-6 pb-2 border-b border-border mb-8">
                  <h3 className="text-sm font-mono font-bold text-muted-foreground mb-0">INVOICE DETAILS</h3>
                                  <button
                                    type="button"
                                    onClick={autofillInvoiceDetails}
                                    className="text-xs font-mono text-muted-foreground mb-0 bg-transparent border-none p-0 underline cursor-pointer"
                                    style={{ marginLeft: 8 }}
                                    aria-label="Autofill Invoice Details"
                                  >[Auto Fill]</button>
                  <div className="grid grid-cols-3 gap-4 justify-center items-center mx-auto w-fit min-h-[60px] bg-background">
                    <div>
                      <label className="text-xs font-mono text-muted-foreground mb-1 block">Invoice No</label>
                      <input
                        type="text"
                        value={invoiceNo}
                        onChange={e => setInvoiceNo(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder=""
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-muted-foreground mb-1 block">Issued Date</label>
                      <input
                        type="text"
                        value={issuedDate}
                        onChange={e => setIssuedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder=""
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-muted-foreground mb-1 block">Due Date</label>
                      <input
                        type="text"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder=""
                        required
                      />
                    </div>
                  </div>
                </div>
                {/* From/To Section */}
                <div className="space-y-6 pb-2 border-b border-border mb-8">
                  <h3 className="text-base font-mono font-bold text-foreground tracking-wide mb-2">FROM & TO</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* From */}
                    <div className="space-y-3">
                      <label className="text-xs font-mono font-semibold">FROM</label>
                      <input type="text" name="fromName" value={formData.fromName} onChange={handleFormChange} placeholder="Company Name" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                      <input type="email" name="fromEmail" value={formData.fromEmail} onChange={handleFormChange} placeholder="Email" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                      <input type="text" name="fromCity" value={formData.fromCity} onChange={handleFormChange} placeholder="City" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                      <input type="text" name="fromCountry" value={formData.fromCountry} onChange={handleFormChange} placeholder="Country" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                      <input type="text" name="fromPincode" value={formData.fromPincode} onChange={handleFormChange} placeholder="Pincode" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>

                    {/* To */}
                    <div className="space-y-3">
                      <label className="text-xs font-mono font-semibold">TO</label>
                      <input type="text" name="toName" value={formData.toName} onChange={handleFormChange} placeholder="Client Name" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                      <input type="email" name="toEmail" value={formData.toEmail} onChange={handleFormChange} placeholder="Email" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                      <input type="text" name="toCity" value={formData.toCity} onChange={handleFormChange} placeholder="City" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                      <input type="text" name="toCountry" value={formData.toCountry} onChange={handleFormChange} placeholder="Country" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                      <input type="text" name="toPincode" value={formData.toPincode} onChange={handleFormChange} placeholder="Pincode" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-2 block">SUBJECT</label>
                  <input type="text" name="subject" value={formData.subject} onChange={handleFormChange} placeholder="What is this invoice for?" className="w-full px-4 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <h3 className="text-sm font-mono font-bold text-muted-foreground">LINE ITEMS</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-mono text-xs text-muted-foreground font-semibold">DESCRIPTION</th>
                          <th className="text-center py-2 px-3 font-mono text-xs text-muted-foreground font-semibold w-20">QTY</th>
                          <th className="text-right py-2 px-3 font-mono text-xs text-muted-foreground font-semibold w-24">PRICE</th>
                          <th className="text-right py-2 px-3 font-mono text-xs text-muted-foreground font-semibold w-24">AMOUNT</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                            <td className="py-3 px-3"><input type="text" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} placeholder="Service or product" className="w-full px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></td>
                            <td className="py-3 px-3"><input type="number" value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', parseInt(e.target.value))} className="w-full px-2 py-1 border border-border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary" /></td>
                            <td className="py-3 px-3"><input type="number" value={item.price} onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value))} placeholder="0.00" className="w-full px-2 py-1 border border-border rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary" /></td>
                            <td className="py-3 px-3 text-right font-mono">${item.amount.toLocaleString()}</td>
                            <td className="py-3 px-3"><button onClick={() => removeItem(item.id)} className="p-1 hover:bg-destructive/10 rounded transition-colors"><X className="w-4 h-4 text-destructive" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={addItem} className="text-sm font-mono text-primary hover:underline">+ Add Line Item</button>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="space-y-2 w-48">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono">${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                      <span>Total</span>
                      <span className="font-mono">${total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Blockchain Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-mono font-bold text-muted-foreground">PAYMENT INFO</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative group">
                      <label className="text-xs font-mono text-muted-foreground mb-2 block flex items-center gap-1">
                        CHAIN
                        <span className="ml-1">
                          <Info className="w-3 h-3 text-muted-foreground group-hover:text-primary cursor-pointer" />
                        </span>
                      </label>
                      <div className="relative w-full group" tabIndex={0}>
                        {/* Tooltip on hover - above */}
                        <div className="absolute left-0 bottom-full mb-2 z-20 hidden group-hover:block group-focus:block bg-background border border-border rounded shadow-lg p-3 min-w-[220px] text-xs text-foreground font-mono">
                          <div className="font-bold mb-1">Supported Chains:</div>
                          <ul className="list-disc pl-4">
                            {chains.map(chain => (
                              <li key={chain.id}>{chain.name}</li>
                            ))}
                          </ul>
                          <div className="mt-2 text-muted-foreground">Can be paid any of these chains.</div>
                        </div>
                        <div
                          className="w-full px-3 py-2 border border-border rounded font-mono text-sm bg-muted text-muted-foreground cursor-not-allowed"
                        >
                          Payments are auto-routed from supported chains
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-mono text-muted-foreground mb-2 block">WALLET ADDRESS</label>
                      <input
                        type="text"
                        name="chainAddress"
                        value={addressLoading ? 'Loading...' : formData.chainAddress}
                        disabled
                        className={`w-full px-3 py-2 border border-border rounded font-mono text-xs bg-muted text-muted-foreground cursor-not-allowed ${addressLoading ? 'animate-pulse' : ''}`}
                        placeholder={addressLoading ? 'Loading...' : 'Your wallet address'}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded font-mono font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    disabled={!allFieldsFilled()}
                    style={!allFieldsFilled() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    <Eye className="w-4 h-4" />
                    Preview Invoice
                  </button>
                  <button
                    className="flex-1 py-3 border border-border rounded font-mono hover:bg-muted transition-colors flex items-center justify-center gap-2"
                    disabled={!allFieldsFilled() || shareLoading}
                    style={!allFieldsFilled() || shareLoading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    onClick={async () => {
                      if (!allFieldsFilled()) return;
                      setShareLoading(true);
                      const id = generateRequestId();
                      let email = null;
                      if (typeof window !== 'undefined') {
                        const userStr = localStorage.getItem('user');
                        if (userStr) {
                          try {
                            const user = JSON.parse(userStr);
                            email = user.email || null;
                          } catch {}
                        }
                      }
                      if (!email) {
                        setShareLoading(false);
                        alert('User email not found. Please log in again.');
                        return;
                      }
                      const baseUrl = process.env.NEXT_PUBLIC_SETTLE_API_URL?.trim() || '';
                      const invoiceMsg = JSON.stringify({
                        invoiceNo,
                        issuedDate,
                        dueDate: formData.dueDate,
                        fromName: formData.fromName,
                        fromEmail: formData.fromEmail,
                        fromCity: formData.fromCity,
                        fromCountry: formData.fromCountry,
                        fromPincode: formData.fromPincode,
                        toName: formData.toName,
                        toEmail: formData.toEmail,
                        toCity: formData.toCity,
                        toCountry: formData.toCountry,
                        toPincode: formData.toPincode,
                        subject: formData.subject,
                        items,
                      });
                      const url = `${baseUrl}/request/${id}/${email}/${total}/${encodeURIComponent(invoiceMsg)}`;
                      try {
                        const res = await fetch(url, { method: 'POST' });
                        if (res.ok) {
                          const data = await res.json();
                          let requestId = id;
                          if (data && data.success && data.request && data.request.requestid) {
                            requestId = data.request.requestid;
                          }
                          const link = `${window.location.origin}/pay/${requestId}`;
                          setLastSharedLink(link);
                          setShareModal({ open: true, link });
                        } else {
                          const errMsg = await res.text();
                          alert('Failed to share invoice: ' + errMsg);
                        }
                      } catch (err) {
                        alert('Failed to share invoice.');
                      } finally {
                        setShareLoading(false);
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 19.5L21.5 12L2.5 4.5L5.5 12L2.5 19.5Z" />
                    </svg>
                    {shareLoading ? 'Sending...' : 'Share'}
                  </button>
                </div>
              </div>

              {/* Preview Panel */}
              {showPreview && (
                <div className="lg:col-span-3 fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold font-mono">INVOICE</h2>
                      <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
                    </div>

                    {/* Preview Content */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground font-mono mb-1">INVOICE NO</p>
                          <p className="font-bold">{invoiceNo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-mono mb-1">ISSUED</p>
                          <p className="font-bold">{issuedDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-mono mb-1">DUE DATE</p>
                          <p className="font-bold">{formData.dueDate}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-xs text-muted-foreground font-mono mb-3 font-bold">FROM</p>
                          <div className="space-y-1 text-sm">
                            <p className="font-bold">{formData.fromName}</p>
                            <p className="text-muted-foreground">{formData.fromEmail}</p>
                            <p className="text-muted-foreground">{formData.fromCity}</p>
                            <p className="text-muted-foreground">{formData.fromCountry}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-mono mb-3 font-bold">TO</p>
                          <div className="space-y-1 text-sm">
                            <p className="font-bold">{formData.toName}</p>
                            <p className="text-muted-foreground">{formData.toEmail}</p>
                            <p className="text-muted-foreground">{formData.toCity}</p>
                            <p className="text-muted-foreground">{formData.toCountry}</p>
                          </div>
                        </div>
                      </div>

                      <div className="py-6 border-t border-b border-border">
                        <p className="text-sm font-mono font-semibold">{formData.subject}</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-3 font-mono text-xs text-muted-foreground font-semibold">DESCRIPTION</th>
                              <th className="text-center py-2 px-3 font-mono text-xs text-muted-foreground font-semibold">QTY</th>
                              <th className="text-right py-2 px-3 font-mono text-xs text-muted-foreground font-semibold">PRICE</th>
                              <th className="text-right py-2 px-3 font-mono text-xs text-muted-foreground font-semibold">AMOUNT</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr key={item.id} className="border-b border-border">
                                <td className="py-3 px-3">{item.description}</td>
                                <td className="py-3 px-3 text-center">{item.qty}</td>
                                <td className="py-3 px-3 text-right font-mono">${item.price.toLocaleString()}</td>
                                <td className="py-3 px-3 text-right font-mono">${item.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end">
                        <div className="space-y-2 w-48">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-mono">${subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                            <span>Total</span>
                            <span className="font-mono">${total.toLocaleString()} USDC</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border pt-6 space-y-3">
                                              {/* Payment link below wallet address */}
                                              {lastSharedLink && (
                                                <div className="mt-2">
                                                  <span className="text-xs font-mono text-muted-foreground">Pay with EVERYWHEREPAY: </span>
                                                  <a href={lastSharedLink} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{lastSharedLink}</a>
                                                </div>
                                              )}
                          {/* Share Modal */}
                          {shareModal?.open && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                              <div className="bg-background border border-border rounded-lg max-w-md w-full p-8 flex flex-col items-center">
                                <h2 className="text-xl font-bold mb-4">Invoice Shared!</h2>
                                <div className="mb-4 w-full">
                                  <label className="text-xs font-mono text-muted-foreground mb-1 block">Payment Link</label>
                                  <div className="flex items-center gap-2">
                                    <input type="text" value={shareModal.link} readOnly className="w-full px-2 py-1 border border-border rounded text-xs font-mono" />
                                    <button onClick={() => {navigator.clipboard.writeText(shareModal.link)}} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">Copy</button>
                                  </div>
                                </div>
                                <button
                                  className="w-full py-2 mt-2 border border-border rounded font-mono hover:bg-muted transition-colors"
                                  onClick={() => {
                                    // Generate PDF using jsPDF
                                    const doc = new jsPDF();
                                    doc.text('Invoice', 10, 10);
                                    doc.text(`Invoice No: ${invoiceNo}`, 10, 20);
                                    doc.text(`Issued: ${issuedDate}`, 10, 30);
                                    doc.text(`Due: ${formData.dueDate}`, 10, 40);
                                    doc.text(`From: ${formData.fromName}, ${formData.fromEmail}, ${formData.fromCity}, ${formData.fromCountry}`, 10, 50);
                                    doc.text(`To: ${formData.toName}, ${formData.toEmail}, ${formData.toCity}, ${formData.toCountry}`, 10, 60);
                                    doc.text(`Subject: ${formData.subject}`, 10, 70);
                                    let y = 80;
                                    items.forEach((item, idx) => {
                                      doc.text(`Item ${idx + 1}: ${item.description} x${item.qty} @ $${item.price} = $${item.amount}`, 10, y);
                                      y += 10;
                                    });
                                    doc.text(`Total: $${total} USDC`, 10, y);
                                    y += 10;
                                    doc.text(`Pay with EVERYWHEREPAY: ${shareModal.link}`, 10, y);
                                    doc.save(`invoice-${invoiceNo}.pdf`);
                                  }}
                                >Download PDF</button>
                                <button className="w-full py-2 mt-2 border border-border rounded font-mono hover:bg-muted transition-colors" onClick={() => setShareModal(null)}>Close</button>
                              </div>
                            </div>
                          )}
                        <p className="text-xs text-muted-foreground font-mono mb-3 font-bold">PAYMENT INFO</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground font-mono mb-1">NETWORKS SUPPORTED</p>
                            <p className="font-mono capitalize">
                              {chains.map(chain => chain.name).join(', ')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-mono mb-1">WALLET</p>
                            <p className="font-mono text-xs break-all">{formData.chainAddress}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-border text-center">
                        <p className="text-xs text-muted-foreground">Powered by EVERYWHEREPAY</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
