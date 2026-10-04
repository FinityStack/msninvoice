import React, { useState } from 'react';
import {
  InvoiceData,
  BankAccount,
  InvoiceItem,
  TemplateId,
} from '../types/invoice';
import {
  Building2,
  FileText,
  User,
  CreditCard,
  ListOrdered,
  Calculator,
  PenLine,
  Plus,
  Trash2,
  Upload,
  Crop,
  Palette,
  Sparkles,
  RotateCcw,
  Sliders,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { PRESET_TEMPLATES, DEFAULT_LOGO_SVG } from '../data/defaultInvoice';

interface SidebarEditorProps {
  invoice: InvoiceData;
  onChange: (updated: Partial<InvoiceData>) => void;
  onOpenSignatureModal: () => void;
  onOpenCropModal: (imageSrc?: string) => void;
  onResetToSample: () => void;
}

type TabKey = 'items' | 'company' | 'client' | 'banks' | 'invoice' | 'totals' | 'signature';

export const SidebarEditor: React.FC<SidebarEditorProps> = ({
  invoice,
  onChange,
  onOpenSignatureModal,
  onOpenCropModal,
  onResetToSample,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('items');

  const {
    company,
    client,
    bankAccounts,
    items,
    tableHeaders,
    currency,
    signature,
    taxPercent,
    discount,
    advancePaid,
  } = invoice;

  // Company details handlers
  const updateCompany = (fields: Partial<typeof company>) => {
    onChange({ company: { ...company, ...fields } });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      // Open interactive crop modal so the user can crop and adjust immediately
      onOpenCropModal(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Client handlers
  const updateClient = (fields: Partial<typeof client>) => {
    onChange({ client: { ...client, ...fields } });
  };

  // Bank accounts handlers
  const addBankAccount = () => {
    const newBank: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: 'New Bank',
      accountNumber: '',
      ifscCode: '',
      accountName: company.name || '',
      accountType: 'Current',
      branch: '',
      pinCode: '',
    };
    onChange({ bankAccounts: [...bankAccounts, newBank] });
  };

  const removeBankAccount = (index: number) => {
    const updated = bankAccounts.filter((_, i) => i !== index);
    onChange({ bankAccounts: updated });
  };

  const updateBank = (index: number, fields: Partial<BankAccount>) => {
    const updated = [...bankAccounts];
    updated[index] = { ...updated[index], ...fields };
    onChange({ bankAccounts: updated });
  };

  // Line items handlers
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      sno: items.length + 1,
      title: '',
      description: 'Trip / service details',
      qty: 1,
      price: 0,
      total: 0,
    };
    const updatedItems = [...items, newItem];
    recalculateTotals(updatedItems, taxPercent, discount, advancePaid);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const updatedItems = items
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, sno: idx + 1 }));
    recalculateTotals(updatedItems, taxPercent, discount, advancePaid);
  };

  const updateItem = (index: number, fields: Partial<InvoiceItem>) => {
    const updated = [...items];
    const target = { ...updated[index], ...fields };

    // Auto calculate row total if numeric qty and price
    if (fields.price !== undefined || fields.qty !== undefined) {
      const numQty = typeof target.qty === 'number' ? target.qty : parseFloat(String(target.qty));
      if (!isNaN(numQty) && numQty > 0) {
        target.total = numQty * (target.price || 0);
      }
    }

    updated[index] = target;
    recalculateTotals(updated, taxPercent, discount, advancePaid);
  };

  const recalculateTotals = (
    currentItems: InvoiceItem[],
    taxPct: number,
    disc: number,
    advance: number
  ) => {
    const sub = currentItems.reduce((acc, it) => acc + (it.total || 0), 0);
    const taxAmt = (sub * taxPct) / 100;
    const tot = Math.max(0, sub + taxAmt - disc);
    const bal = Math.max(0, tot - advance);

    onChange({
      items: currentItems,
      subtotal: sub,
      taxPercent: taxPct,
      taxAmount: taxAmt,
      discount: disc,
      advancePaid: advance,
      total: tot,
      balanceDue: bal,
    });
  };

  const handleTaxChange = (val: number) => {
    recalculateTotals(items, val, discount, advancePaid);
  };

  const handleDiscountChange = (val: number) => {
    recalculateTotals(items, taxPercent, val, advancePaid);
  };

  const handleAdvanceChange = (val: number) => {
    recalculateTotals(items, taxPercent, discount, val);
  };

  return (
    <aside className="editor-sidebar flex h-full w-full flex-col border-r border-slate-200 bg-white">
      {/* Navigation Tabs with clean pill styling */}
      <div className="flex border-b border-slate-200 bg-slate-50/80 overflow-x-auto p-1.5 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition-all ${
            activeTab === 'items'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListOrdered className="h-3.5 w-3.5 text-sky-600" />
          Items ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('company')}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition-all ${
            activeTab === 'company'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Company
        </button>
        <button
          onClick={() => setActiveTab('client')}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition-all ${
            activeTab === 'client'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          Client
        </button>
        <button
          onClick={() => setActiveTab('banks')}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition-all ${
            activeTab === 'banks'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          Banks ({bankAccounts.length})
        </button>
        <button
          onClick={() => setActiveTab('totals')}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition-all ${
            activeTab === 'totals'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="h-3.5 w-3.5" />
          Tax & Totals
        </button>
        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition-all ${
            activeTab === 'invoice'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Layout
        </button>
        <button
          onClick={() => setActiveTab('signature')}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition-all ${
            activeTab === 'signature'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PenLine className="h-3.5 w-3.5" />
          Signature
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB: ITEMS & TABLE COLUMNS */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Line Items & Charges
                </h4>
                <p className="text-[11px] text-slate-500">
                  Edit trip details, kms, prices, or add new rows
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>

            {/* List of Items */}
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs space-y-2 relative group hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Row #{item.sno || idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">
                      Program / Title Header (Optional)
                    </label>
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateItem(idx, { title: e.target.value })}
                      placeholder="e.g. Program: 3/10/26 to 4/10/26"
                      className="mt-0.5 w-full rounded border border-slate-300 px-2.5 py-1 text-xs focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">
                      Trip / Item Details (Multi-line)
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      rows={3}
                      placeholder="Program details, route, vehicle specifications..."
                      className="mt-0.5 w-full rounded border border-slate-300 px-2.5 py-1 text-xs focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600">
                        {tableHeaders.qty}
                      </label>
                      <input
                        type="text"
                        value={String(item.qty)}
                        onChange={(e) => updateItem(idx, { qty: e.target.value })}
                        placeholder="-"
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs font-tabular text-center focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600">
                        {tableHeaders.price}
                      </label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(idx, { price: parseFloat(e.target.value) || 0 })
                        }
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs font-tabular text-right focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600">
                        {tableHeaders.total}
                      </label>
                      <input
                        type="number"
                        value={item.total}
                        onChange={(e) =>
                          updateItem(idx, { total: parseFloat(e.target.value) || 0 })
                        }
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs font-tabular font-bold text-right focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Editable Column Headers */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <span className="block text-[11px] font-bold text-slate-700 mb-2">
                Custom Column Headers
              </span>
              <div className="grid grid-cols-5 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400">Col 1</label>
                  <input
                    type="text"
                    value={tableHeaders.sno}
                    onChange={(e) =>
                      onChange({ tableHeaders: { ...tableHeaders, sno: e.target.value } })
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400">Col 2 (Description)</label>
                  <input
                    type="text"
                    value={tableHeaders.description}
                    onChange={(e) =>
                      onChange({
                        tableHeaders: { ...tableHeaders, description: e.target.value },
                      })
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Col 3 (Qty/Kms)</label>
                  <input
                    type="text"
                    value={tableHeaders.qty}
                    onChange={(e) =>
                      onChange({ tableHeaders: { ...tableHeaders, qty: e.target.value } })
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Col 4 (Price)</label>
                  <input
                    type="text"
                    value={tableHeaders.price}
                    onChange={(e) =>
                      onChange({ tableHeaders: { ...tableHeaders, price: e.target.value } })
                    }
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: COMPANY */}
        {activeTab === 'company' && (
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Your Business Profile
            </h4>

            {/* Logo Controls */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="block text-xs font-semibold text-slate-700">Company Logo</span>
                {company.logoUrl && (
                  <span className="text-[10px] text-sky-600 font-medium">Editable & Croppable</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {company.logoUrl ? (
                  <div
                    onClick={() => onOpenCropModal(company.logoUrl)}
                    className="relative group/logo flex h-14 w-24 sm:w-28 items-center justify-center rounded border border-slate-200 bg-white p-1 cursor-pointer overflow-hidden shadow-2xs hover:border-sky-400 transition-all"
                    title="Click to crop or adjust logo"
                  >
                    <img
                      src={company.logoUrl}
                      alt="Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center gap-1 text-[10px] font-semibold text-white transition-opacity">
                      <Crop className="h-3 w-3" />
                      Crop
                    </div>
                  </div>
                ) : (
                  <div className="flex h-14 w-24 sm:w-28 items-center justify-center rounded border border-dashed border-slate-300 bg-white text-[10px] text-slate-400">
                    No Logo
                  </div>
                )}
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded bg-white border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs">
                      <Upload className="h-3 w-3" />
                      Upload Logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {company.logoUrl && (
                      <button
                        type="button"
                        onClick={() => onOpenCropModal(company.logoUrl)}
                        className="inline-flex items-center gap-1 rounded bg-sky-50 border border-sky-300/80 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 hover:border-sky-400 transition-colors shadow-2xs"
                        title="Crop, rotate, or reframe current logo"
                      >
                        <Crop className="h-3 w-3" />
                        Crop Logo
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => updateCompany({ logoUrl: DEFAULT_LOGO_SVG })}
                      className="text-sky-600 hover:underline"
                    >
                      Bus Icon
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => updateCompany({ logoUrl: '' })}
                      className="text-slate-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Company Name</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => updateCompany({ name: e.target.value })}
                placeholder="e.g. MSN TOURS"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Tagline / Sub-heading
              </label>
              <input
                type="text"
                value={company.tagline || ''}
                onChange={(e) => updateCompany({ tagline: e.target.value })}
                placeholder="e.g. AND TRAVELS"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Phone Number</label>
              <input
                type="text"
                value={company.phone}
                onChange={(e) => updateCompany({ phone: e.target.value })}
                placeholder="e.g. +91 909 505 7007"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                value={company.email}
                onChange={(e) => updateCompany({ email: e.target.value })}
                placeholder="e.g. msntravels7007@gmail.com"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Office Address</label>
              <textarea
                value={company.address}
                onChange={(e) => updateCompany({ address: e.target.value })}
                rows={3}
                placeholder="786, 5th St, Tatabad, Gandhipuram, Coimbatore, Tamil Nadu 641012"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                GSTIN / Tax Registration Number (Optional)
              </label>
              <input
                type="text"
                value={company.gstin || ''}
                onChange={(e) => updateCompany({ gstin: e.target.value })}
                placeholder="e.g. 33AAAAA0000A1Z5"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB: CLIENT */}
        {activeTab === 'client' && (
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Client / Billing Information
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-700">Section Label</label>
              <input
                type="text"
                value={client.label}
                onChange={(e) => updateClient({ label: e.target.value })}
                placeholder="Bill to:, Billed To:, Customer:"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Client / Company Name
              </label>
              <input
                type="text"
                value={client.name}
                onChange={(e) => updateClient({ name: e.target.value })}
                placeholder="e.g. Eye Foundation"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Client Address</label>
              <textarea
                value={client.address}
                onChange={(e) => updateClient({ address: e.target.value })}
                rows={3}
                placeholder="Building No./Flat No.: 583A, Periyasamy West Road, RS Puram, Coimbatore, Tamil Nadu, 641002"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">Phone</label>
                <input
                  type="text"
                  value={client.phone || ''}
                  onChange={(e) => updateClient({ phone: e.target.value })}
                  placeholder="Client Phone"
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">GST / Tax ID</label>
                <input
                  type="text"
                  value={client.taxId || ''}
                  onChange={(e) => updateClient({ taxId: e.target.value })}
                  placeholder="GSTIN/VAT"
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: BANK ACCOUNTS */}
        {activeTab === 'banks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Payment & Bank Accounts
                </h4>
                <p className="text-[11px] text-slate-500">
                  Add multiple bank options or UPI IDs for payments
                </p>
              </div>
              <button
                type="button"
                onClick={addBankAccount}
                className="flex items-center gap-1 rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Plus className="h-3 w-3" />
                Add Bank
              </button>
            </div>

            <div className="space-y-3">
              {bankAccounts.map((bank, idx) => (
                <div
                  key={bank.id || idx}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs space-y-2 relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-xs font-bold text-slate-800">Bank #{idx + 1}</span>
                    {bankAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBankAccount(idx)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="Remove Bank"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bank.bankName}
                        onChange={(e) => updateBank(idx, { bankName: e.target.value })}
                        placeholder="HDFC Bank"
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={bank.accountNumber}
                        onChange={(e) => updateBank(idx, { accountNumber: e.target.value })}
                        placeholder="50200092297696"
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs font-tabular font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600">
                        IFSC CODE / SWIFT
                      </label>
                      <input
                        type="text"
                        value={bank.ifscCode}
                        onChange={(e) => updateBank(idx, { ifscCode: e.target.value })}
                        placeholder="HDFC0007537"
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={bank.accountName}
                        onChange={(e) => updateBank(idx, { accountName: e.target.value })}
                        placeholder="MSN TOURS & TRAVELS"
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600">
                        Account Type
                      </label>
                      <input
                        type="text"
                        value={bank.accountType}
                        onChange={(e) => updateBank(idx, { accountType: e.target.value })}
                        placeholder="Current"
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600">Branch</label>
                      <input
                        type="text"
                        value={bank.branch}
                        onChange={(e) => updateBank(idx, { branch: e.target.value })}
                        placeholder="CROSS CUT Road"
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600">
                        City - Pin
                      </label>
                      <input
                        type="text"
                        value={bank.pinCode || ''}
                        onChange={(e) => updateBank(idx, { pinCode: e.target.value })}
                        placeholder="Coimbatore - 641009"
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600">
                      UPI ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={bank.upiId || ''}
                      onChange={(e) => updateBank(idx, { upiId: e.target.value })}
                      placeholder="msntravels@okhdfcbank"
                      className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: TOTALS, TAX, DUTY HOURS & NOTES */}
        {activeTab === 'totals' && (
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Totals, Taxes & Duty Hours
            </h4>

            {/* Duty Hours (Prominent feature from sample!) */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
              <label className="block text-xs font-bold text-slate-800">
                Duty Hours / Schedule
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Appears prominently under the line items table
              </p>
              <input
                type="text"
                value={invoice.dutyHours || ''}
                onChange={(e) => onChange({ dutyHours: e.target.value })}
                placeholder="Duty Hours : - 06:00 am to 6:00 pm."
                className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">Tax / GST %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxPercent}
                  onChange={(e) => handleTaxChange(parseFloat(e.target.value) || 0)}
                  placeholder="0, 5, 12, 18"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-tabular focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Discount Amount</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-tabular focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Advance Paid (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={advancePaid}
                onChange={(e) => handleAdvanceChange(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-tabular focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Thank You Headline
              </label>
              <input
                type="text"
                value={invoice.thankYouNote}
                onChange={(e) => onChange({ thankYouNote: e.target.value })}
                placeholder="THANK YOU!"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Custom Terms / Notes
              </label>
              <textarea
                value={invoice.customNotes || ''}
                onChange={(e) => onChange({ customNotes: e.target.value })}
                rows={3}
                placeholder="Toll and parking charges will be extra as actuals..."
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB: INVOICE SETTINGS */}
        {activeTab === 'invoice' && (
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Document Attributes & Template
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-700">Document Title</label>
              <input
                type="text"
                value={invoice.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="INVOICE, TAX INVOICE, BILL OF SUPPLY"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">Invoice Number</label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) => onChange({ invoiceNumber: e.target.value })}
                  placeholder="20260927005"
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-tabular font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Invoice Date</label>
                <input
                  type="date"
                  value={invoice.date}
                  onChange={(e) => onChange({ date: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-800 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Template Selector */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                Template Layout
              </label>
              <div className="space-y-1.5">
                {PRESET_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => onChange({ templateId: tmpl.id as TemplateId })}
                    className={`flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all ${
                      invoice.templateId === tmpl.id
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-white"
                      style={{ backgroundColor: tmpl.previewColor }}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{tmpl.name}</div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        {tmpl.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Currency Customization */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                Currency & Notation
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500">Symbol</label>
                  <input
                    type="text"
                    value={currency.symbol}
                    onChange={(e) =>
                      onChange({ currency: { ...currency, symbol: e.target.value } })
                    }
                    placeholder="₹, $, €"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Code</label>
                  <input
                    type="text"
                    value={currency.code}
                    onChange={(e) =>
                      onChange({ currency: { ...currency, code: e.target.value } })
                    }
                    placeholder="INR, USD"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-center uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Suffix (e.g. /-)</label>
                  <input
                    type="text"
                    value={currency.suffixText}
                    onChange={(e) =>
                      onChange({ currency: { ...currency, suffixText: e.target.value } })
                    }
                    placeholder="/-"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SIGNATURE */}
        {activeTab === 'signature' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Signature & Signatory Title
            </h4>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-center">
              <span className="block text-xs font-medium text-slate-500 mb-2">
                Current Applied Signature
              </span>

              <div className="mx-auto flex h-20 w-48 items-center justify-center rounded border border-slate-200 bg-white p-2">
                {signature.type === 'draw' && signature.dataUrl ? (
                  <img
                    src={signature.dataUrl}
                    alt="Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : signature.type === 'image' && signature.dataUrl ? (
                  <img
                    src={signature.dataUrl}
                    alt="Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : signature.type === 'text' && signature.typedName ? (
                  <span className="font-signature text-2xl text-slate-900">
                    {signature.typedName}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">No Signature Set</span>
                )}
              </div>

              <button
                type="button"
                onClick={onOpenSignatureModal}
                className="mt-3 inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <PenLine className="h-3.5 w-3.5" />
                Change / Redraw Signature
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Signatory Label
              </label>
              <input
                type="text"
                value={signature.title}
                onChange={(e) =>
                  onChange({ signature: { ...signature, title: e.target.value } })
                }
                placeholder="Signature, Authorized Signatory"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Quick Footer */}
      <div className="border-t border-slate-200 bg-slate-50 p-3">
        <button
          type="button"
          onClick={onResetToSample}
          className="flex w-full items-center justify-center gap-1.5 rounded border border-slate-200 bg-white py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
        >
          <RotateCcw className="h-3 w-3" />
          Reset to MSN Tours Sample
        </button>
      </div>
    </aside>
  );
};
