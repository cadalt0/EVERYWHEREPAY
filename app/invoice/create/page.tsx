'use client';

import React from "react"
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { useState } from 'react';
import { Eye, X } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  price: number;
  amount: number;
}

export default function CreateInvoicePage() {
  const [invoiceNo] = useState('000007');
  const [issuedDate] = useState('1/30/26');
  
  const [formData, setFormData] = useState({
    fromName: 'Your Company',
    fromEmail: 'hello@example.com',
    fromCity: 'San Francisco',
    fromCountry: 'United States',
    fromPincode: '94103',
    toName: 'Client Name',
    toEmail: 'client@example.com',
    toCity: 'New York',
    toCountry: 'United States',
    toPincode: '10001',
    dueDate: '2/13/26',
    subject: 'Website Design Services',
    chain: 'ethereum',
    chainAddress: '0x742d35Cc6634C0532925a3b844Bc5e8c5e5e8c5e',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Website Design', qty: 1, price: 2500, amount: 2500 },
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
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Create Invoice" />

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 max-w-6xl">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-mono font-bold text-muted-foreground">INVOICE DETAILS</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-mono text-muted-foreground mb-1 block">Invoice No</label>
                      <input type="text" value={invoiceNo} disabled className="w-full px-3 py-2 border border-border rounded bg-muted/30 font-mono text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-muted-foreground mb-1 block">Issued</label>
                      <input type="text" value={issuedDate} disabled className="w-full px-3 py-2 border border-border rounded bg-muted/30 font-mono text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-muted-foreground mb-1 block">Due Date</label>
                      <input type="text" name="dueDate" value={formData.dueDate} onChange={handleFormChange} className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>

                {/* From/To Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-mono font-bold text-muted-foreground">FROM & TO</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* From */}
                    <div className="space-y-3">
                      <label className="text-xs font-mono font-semibold">FROM</label>
                      <input type="text" name="fromName" value={formData.fromName} onChange={handleFormChange} placeholder="Company Name" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <input type="email" name="fromEmail" value={formData.fromEmail} onChange={handleFormChange} placeholder="Email" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <input type="text" name="fromCity" value={formData.fromCity} onChange={handleFormChange} placeholder="City" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <input type="text" name="fromCountry" value={formData.fromCountry} onChange={handleFormChange} placeholder="Country" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <input type="text" name="fromPincode" value={formData.fromPincode} onChange={handleFormChange} placeholder="Pincode" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>

                    {/* To */}
                    <div className="space-y-3">
                      <label className="text-xs font-mono font-semibold">TO</label>
                      <input type="text" name="toName" value={formData.toName} onChange={handleFormChange} placeholder="Client Name" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <input type="email" name="toEmail" value={formData.toEmail} onChange={handleFormChange} placeholder="Email" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <input type="text" name="toCity" value={formData.toCity} onChange={handleFormChange} placeholder="City" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <input type="text" name="toCountry" value={formData.toCountry} onChange={handleFormChange} placeholder="Country" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <input type="text" name="toPincode" value={formData.toPincode} onChange={handleFormChange} placeholder="Pincode" className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-2 block">SUBJECT</label>
                  <input type="text" name="subject" value={formData.subject} onChange={handleFormChange} placeholder="What is this invoice for?" className="w-full px-4 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
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
                    <div>
                      <label className="text-xs font-mono text-muted-foreground mb-2 block">CHAIN</label>
                      <select name="chain" value={formData.chain} onChange={handleFormChange} className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="ethereum">Ethereum</option>
                        <option value="polygon">Polygon</option>
                        <option value="arbitrum">Arbitrum</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-mono text-muted-foreground mb-2 block">WALLET ADDRESS</label>
                      <input type="text" name="chainAddress" value={formData.chainAddress} onChange={handleFormChange} className="w-full px-3 py-2 border border-border rounded font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setShowPreview(true)} className="flex-1 py-3 bg-primary text-primary-foreground rounded font-mono font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview Invoice
                  </button>
                  <button className="flex-1 py-3 border border-border rounded font-mono hover:bg-muted transition-colors">
                    Save Draft
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
                        <p className="text-xs text-muted-foreground font-mono mb-3 font-bold">PAYMENT INFO</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground font-mono mb-1">NETWORK</p>
                            <p className="font-mono capitalize">{formData.chain}</p>
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
  );
}
