import React, { useRef } from 'react';
import {
  InvoiceData,
  BankAccount,
  InvoiceItem,
} from '../types/invoice';
import {
  Phone,
  Mail,
  MapPin,
  Upload,
  Plus,
  Trash2,
  PenTool,
  Building,
  Image as ImageIcon,
  Crop,
} from 'lucide-react';
import { formatCurrencyNumber } from '../utils/numberToWords';
import { DEFAULT_LOGO_SVG } from '../data/defaultInvoice';

interface InvoiceDocumentProps {
  invoice: InvoiceData;
  isLiveEdit: boolean;
  onUpdate: (updated: Partial<InvoiceData>) => void;
  onOpenSignatureModal: () => void;
  onOpenCropModal?: (imageSrc?: string) => void;
}

// Inline Editable component that maintains print perfection
interface EditableProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  isLiveEdit: boolean;
  multiline?: boolean;
}

const EditableText: React.FC<EditableProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  isLiveEdit,
  multiline = false,
}) => {
  if (!isLiveEdit) {
    if (multiline) {
      return (
        <div className={`whitespace-pre-line ${className}`}>
          {value || <span className="text-slate-300 italic">{placeholder}</span>}
        </div>
      );
    }
    return (
      <span className={className}>
        {value || <span className="text-slate-300 italic">{placeholder}</span>}
      </span>
    );
  }

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={Math.max(1, value.split('\n').length)}
        className={`w-full resize-none rounded border border-dashed border-sky-300 bg-sky-50/40 px-1.5 py-0.5 text-inherit transition-all hover:bg-sky-50/70 focus:border-sky-500 focus:bg-white focus:outline-none ${className}`}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`inline-block rounded border border-dashed border-sky-300 bg-sky-50/40 px-1.5 py-0.5 text-inherit transition-all hover:bg-sky-50/70 focus:border-sky-500 focus:bg-white focus:outline-none ${className}`}
    />
  );
};

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  invoice,
  isLiveEdit,
  onUpdate,
  onOpenSignatureModal,
  onOpenCropModal,
}) => {
  const {
    templateId,
    title,
    invoiceNumber,
    date,
    company,
    client,
    currency,
    bankAccounts,
    tableHeaders,
    items,
    dutyHours,
    total,
    thankYouNote,
    signature,
    subtotal,
    taxPercent,
    taxAmount,
    discount,
    advancePaid,
    balanceDue,
    customNotes,
  } = invoice;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format currency with custom prefix/suffix
  const formatAmount = (amt: number): string => {
    const formattedNum = formatCurrencyNumber(amt);
    if (currency.suffixText) {
      return `${formattedNum}${currency.suffixText}`;
    }
    return `${currency.symbol} ${formattedNum}`;
  };

  const updateCompany = (fields: Partial<typeof company>) => {
    onUpdate({ company: { ...company, ...fields } });
  };

  const updateClient = (fields: Partial<typeof client>) => {
    onUpdate({ client: { ...client, ...fields } });
  };

  const updateTableHeaders = (fields: Partial<typeof tableHeaders>) => {
    onUpdate({ tableHeaders: { ...tableHeaders, ...fields } });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (onOpenCropModal) {
        onOpenCropModal(dataUrl);
      } else {
        updateCompany({ logoUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateItem = (index: number, fields: Partial<InvoiceItem>) => {
    const updated = [...items];
    const target = { ...updated[index], ...fields };

    if (fields.price !== undefined || fields.qty !== undefined) {
      const numQty = typeof target.qty === 'number' ? target.qty : parseFloat(String(target.qty));
      if (!isNaN(numQty) && numQty > 0) {
        target.total = numQty * target.price;
      }
    }

    updated[index] = target;
    const newSubtotal = updated.reduce((sum, item) => sum + (item.total || 0), 0);
    const newTaxAmount = (newSubtotal * taxPercent) / 100;
    const newTotal = newSubtotal + newTaxAmount - discount;
    const newBalance = Math.max(0, newTotal - advancePaid);

    onUpdate({
      items: updated,
      subtotal: newSubtotal,
      taxAmount: newTaxAmount,
      total: newTotal,
      balanceDue: newBalance,
    });
  };

  const addItemDirectly = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      sno: items.length + 1,
      title: '',
      description: 'New service or travel itinerary detail',
      qty: 1,
      price: 0,
      total: 0,
    };
    const updatedItems = [...items, newItem];
    const newSubtotal = updatedItems.reduce((sum, it) => sum + (it.total || 0), 0);
    const newTaxAmount = (newSubtotal * taxPercent) / 100;
    const newTotal = newSubtotal + newTaxAmount - discount;
    const newBalance = Math.max(0, newTotal - advancePaid);

    onUpdate({
      items: updatedItems,
      subtotal: newSubtotal,
      taxAmount: newTaxAmount,
      total: newTotal,
      balanceDue: newBalance,
    });
  };

  const removeItemDirectly = (index: number) => {
    if (items.length <= 1) return;
    const updatedItems = items
      .filter((_, i) => i !== index)
      .map((it, idx) => ({ ...it, sno: idx + 1 }));
    const newSubtotal = updatedItems.reduce((sum, it) => sum + (it.total || 0), 0);
    const newTaxAmount = (newSubtotal * taxPercent) / 100;
    const newTotal = newSubtotal + newTaxAmount - discount;
    const newBalance = Math.max(0, newTotal - advancePaid);

    onUpdate({
      items: updatedItems,
      subtotal: newSubtotal,
      taxAmount: newTaxAmount,
      total: newTotal,
      balanceDue: newBalance,
    });
  };

  const updateBank = (index: number, fields: Partial<BankAccount>) => {
    const updatedBanks = [...bankAccounts];
    updatedBanks[index] = { ...updatedBanks[index], ...fields };
    onUpdate({ bankAccounts: updatedBanks });
  };

  const addBankDirectly = () => {
    const newBank: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: 'Bank Name',
      accountNumber: '',
      ifscCode: '',
      accountName: company.name || '',
      accountType: 'Current',
      branch: '',
    };
    onUpdate({ bankAccounts: [...bankAccounts, newBank] });
  };

  // Render Travel & Transport (Classic) Template - exact replica of user sample
  if (templateId === 'travel-classic') {
    return (
      <div
        id="invoice-document"
        className="relative mx-auto bg-white text-slate-900 shadow-xl transition-all"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm 20mm 18mm 20mm',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          boxSizing: 'border-box',
        }}
      >
        {/* Top Header Row */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-black">
              <EditableText
                value={title}
                onChange={(val) => onUpdate({ title: val })}
                isLiveEdit={isLiveEdit}
                placeholder="INVOICE"
              />
            </h1>
            <div className="mt-2 text-sm font-medium text-slate-800">
              <span className="font-semibold">Date:</span>{' '}
              <EditableText
                value={date}
                onChange={(val) => onUpdate({ date: val })}
                isLiveEdit={isLiveEdit}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>

          {/* Right Logo & Company Branding */}
          <div className="flex flex-col items-center text-center group/logo relative">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {company.logoUrl ? (
              <div className="relative group/logo-box">
                <div
                  onClick={() => isLiveEdit && (onOpenCropModal ? onOpenCropModal(company.logoUrl) : fileInputRef.current?.click())}
                  className={`cursor-pointer ${isLiveEdit ? 'hover:opacity-90' : ''}`}
                  title={isLiveEdit ? 'Click to crop / adjust logo' : undefined}
                >
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="h-16 w-auto max-w-[170px] object-contain"
                  />
                </div>
                {isLiveEdit && (
                  <div className="no-print absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/90 text-white rounded-md px-2 py-0.5 shadow-lg text-[10px] font-medium opacity-0 group-hover/logo-box:opacity-100 transition-opacity z-20 whitespace-nowrap">
                    {onOpenCropModal && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCropModal(company.logoUrl);
                          }}
                          className="flex items-center gap-0.5 hover:text-sky-300 font-semibold"
                        >
                          <Crop className="h-2.5 w-2.5" />
                          Crop
                        </button>
                        <span className="text-slate-500">·</span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="hover:text-sky-300"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            ) : isLiveEdit ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mb-1 flex items-center gap-1 rounded border border-dashed border-sky-300 bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700 hover:bg-sky-100"
              >
                <Upload className="h-3 w-3" />
                Upload Logo
              </button>
            ) : null}

            <div className="mt-1 text-base font-extrabold uppercase tracking-wide text-black">
              <EditableText
                value={company.name}
                onChange={(val) => updateCompany({ name: val })}
                isLiveEdit={isLiveEdit}
                placeholder="COMPANY NAME"
              />
            </div>
            {company.tagline && (
              <div className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
                <EditableText
                  value={company.tagline}
                  onChange={(val) => updateCompany({ tagline: val })}
                  isLiveEdit={isLiveEdit}
                  placeholder="AND TRAVELS"
                />
              </div>
            )}
          </div>
        </div>

        {/* Invoice Number, Bill To & Payment Bank Details */}
        <div className="mt-8 grid grid-cols-12 gap-6">
          {/* Left Column: Invoice No and Bill To */}
          <div className="col-span-5 space-y-5">
            <div>
              <div className="text-sm font-medium text-slate-600">No. Invoice :</div>
              <div className="mt-1 text-base font-bold text-black font-tabular">
                <EditableText
                  value={invoiceNumber}
                  onChange={(val) => onUpdate({ invoiceNumber: val })}
                  isLiveEdit={isLiveEdit}
                  placeholder="Invoice No"
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="text-sm font-bold text-black">
                <EditableText
                  value={client.label}
                  onChange={(val) => updateClient({ label: val })}
                  isLiveEdit={isLiveEdit}
                  placeholder="Bill to:"
                />
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-900 leading-relaxed">
                <EditableText
                  value={client.name}
                  onChange={(val) => updateClient({ name: val })}
                  isLiveEdit={isLiveEdit}
                  placeholder="Client / Organization Name"
                />
              </div>
              <div className="mt-0.5 text-xs text-slate-700 leading-relaxed">
                <EditableText
                  value={client.address}
                  onChange={(val) => updateClient({ address: val })}
                  isLiveEdit={isLiveEdit}
                  multiline
                  placeholder="Client Address, Building No, Road, City, Pin code"
                />
              </div>
              {client.taxId && (
                <div className="mt-1 text-xs text-slate-600 font-medium">
                  GST/Tax ID: {client.taxId}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Payment Method with Bank Details side by side */}
          <div className="col-span-7">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-black">Payment Method:</div>
              {isLiveEdit && (
                <button
                  type="button"
                  onClick={addBankDirectly}
                  className="no-print flex items-center gap-1 rounded border border-dashed border-sky-300 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 hover:bg-sky-100"
                >
                  <Plus className="h-3 w-3" /> Add Bank
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-[11px] leading-relaxed text-slate-800">
              {bankAccounts.map((bank, idx) => (
                <div key={bank.id || idx} className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    <EditableText
                      value={bank.bankName}
                      onChange={(val) => updateBank(idx, { bankName: val })}
                      isLiveEdit={isLiveEdit}
                      placeholder="Bank Name"
                    />
                  </div>
                  {bank.accountNumber && (
                    <div>
                      <span className="font-semibold">Ac/no : </span>
                      <span className="font-tabular font-medium">
                        <EditableText
                          value={bank.accountNumber}
                          onChange={(val) => updateBank(idx, { accountNumber: val })}
                          isLiveEdit={isLiveEdit}
                          placeholder="Account Number"
                        />
                      </span>
                    </div>
                  )}
                  {bank.ifscCode && (
                    <div>
                      <span className="font-semibold">IFSC CODE : </span>
                      <EditableText
                        value={bank.ifscCode}
                        onChange={(val) => updateBank(idx, { ifscCode: val })}
                        isLiveEdit={isLiveEdit}
                        placeholder="IFSC Code"
                      />
                    </div>
                  )}
                  {bank.accountName && (
                    <div>
                      <span className="font-semibold">NAME : </span>
                      <EditableText
                        value={bank.accountName}
                        onChange={(val) => updateBank(idx, { accountName: val })}
                        isLiveEdit={isLiveEdit}
                        placeholder="Account Holder Name"
                      />
                    </div>
                  )}
                  {bank.accountType && (
                    <div>
                      <span className="font-semibold">Account Type : </span>
                      <EditableText
                        value={bank.accountType}
                        onChange={(val) => updateBank(idx, { accountType: val })}
                        isLiveEdit={isLiveEdit}
                        placeholder="Current"
                      />
                    </div>
                  )}
                  {bank.branch && (
                    <div>
                      <span className="font-semibold">Branch : </span>
                      <EditableText
                        value={bank.branch}
                        onChange={(val) => updateBank(idx, { branch: val })}
                        isLiveEdit={isLiveEdit}
                        placeholder="Branch Name"
                      />
                    </div>
                  )}
                  {bank.pinCode && (
                    <div>
                      <span className="font-semibold">Pin code - </span>
                      <EditableText
                        value={bank.pinCode}
                        onChange={(val) => updateBank(idx, { pinCode: val })}
                        isLiveEdit={isLiveEdit}
                        placeholder="City - Pin"
                      />
                    </div>
                  )}
                  {bank.upiId && (
                    <div className="pt-0.5 text-sky-700 font-medium">
                      UPI ID: {bank.upiId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table of Items / Trip Details */}
        <div className="mt-8 border border-slate-300 relative group/table">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-300 text-center font-bold text-xs text-black">
            <div className="col-span-1 py-3 px-2 border-r border-slate-300">
              <EditableText
                value={tableHeaders.sno}
                onChange={(val) => updateTableHeaders({ sno: val })}
                isLiveEdit={isLiveEdit}
                placeholder="S.no"
              />
            </div>
            <div className="col-span-5 py-3 px-3 border-r border-slate-300 text-center">
              <EditableText
                value={tableHeaders.description}
                onChange={(val) => updateTableHeaders({ description: val })}
                isLiveEdit={isLiveEdit}
                placeholder="Trip Details"
              />
            </div>
            <div className="col-span-2 py-3 px-2 border-r border-slate-300">
              <EditableText
                value={tableHeaders.qty}
                onChange={(val) => updateTableHeaders({ qty: val })}
                isLiveEdit={isLiveEdit}
                placeholder="Trip Kms"
              />
            </div>
            <div className="col-span-2 py-3 px-2 border-r border-slate-300">
              <EditableText
                value={tableHeaders.price}
                onChange={(val) => updateTableHeaders({ price: val })}
                isLiveEdit={isLiveEdit}
                placeholder="Price"
              />
            </div>
            <div className="col-span-2 py-3 px-2">
              <EditableText
                value={tableHeaders.total}
                onChange={(val) => updateTableHeaders({ total: val })}
                isLiveEdit={isLiveEdit}
                placeholder="Total"
              />
            </div>
          </div>

          {/* Table Rows */}
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="grid grid-cols-12 border-b border-slate-200 text-xs text-slate-900 min-h-[140px] relative group/row"
            >
              {/* Row delete button for live edit */}
              {isLiveEdit && items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItemDirectly(idx)}
                  className="no-print absolute -left-8 top-3 z-10 hidden group-hover/row:flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                  title="Remove this row"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}

              <div className="col-span-1 p-3 text-center border-r border-slate-300 font-medium">
                {item.sno || idx + 1}
              </div>
              <div className="col-span-5 p-3 border-r border-slate-300 space-y-2">
                {item.title !== undefined && (
                  <div className="font-bold text-slate-900 whitespace-pre-line">
                    <EditableText
                      value={item.title}
                      onChange={(val) => updateItem(idx, { title: val })}
                      isLiveEdit={isLiveEdit}
                      multiline
                      placeholder="Program Details (Optional Title)"
                    />
                  </div>
                )}
                <div className="whitespace-pre-line text-slate-700 leading-relaxed">
                  <EditableText
                    value={item.description}
                    onChange={(val) => updateItem(idx, { description: val })}
                    isLiveEdit={isLiveEdit}
                    multiline
                    placeholder="Route details, vehicle type, notes..."
                  />
                </div>
              </div>
              <div className="col-span-2 p-3 text-center border-r border-slate-300 font-tabular self-center font-medium">
                <EditableText
                  value={String(item.qty)}
                  onChange={(val) => updateItem(idx, { qty: val })}
                  isLiveEdit={isLiveEdit}
                  placeholder="-"
                />
              </div>
              <div className="col-span-2 p-3 text-center border-r border-slate-300 font-tabular self-center font-medium">
                {isLiveEdit ? (
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(idx, { price: parseFloat(e.target.value) || 0 })}
                    className="w-24 rounded border border-dashed border-sky-300 bg-sky-50 px-1 py-0.5 text-center text-xs font-semibold focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                ) : (
                  formatCurrencyNumber(item.price)
                )}
              </div>
              <div className="col-span-2 p-3 text-center font-tabular self-center font-bold">
                {isLiveEdit ? (
                  <input
                    type="number"
                    value={item.total}
                    onChange={(e) => updateItem(idx, { total: parseFloat(e.target.value) || 0 })}
                    className="w-24 rounded border border-dashed border-sky-300 bg-sky-50 px-1 py-0.5 text-center text-xs font-bold focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                ) : (
                  formatCurrencyNumber(item.total)
                )}
              </div>
            </div>
          ))}

          {/* Quick Add Row button directly under table during live edit */}
          {isLiveEdit && (
            <div className="no-print p-2 bg-slate-50 border-t border-dashed border-slate-200 text-center">
              <button
                type="button"
                onClick={addItemDirectly}
                className="inline-flex items-center gap-1 rounded bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5 text-sky-600" />
                Add Item / Service Row
              </button>
            </div>
          )}
        </div>

        {/* Duty Hours & Total Bar */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm font-bold text-black">
            <EditableText
              value={dutyHours || 'Duty Hours : - 06:00 am to 6:00 pm.'}
              onChange={(val) => onUpdate({ dutyHours: val })}
              isLiveEdit={isLiveEdit}
              placeholder="Duty Hours : - 06:00 am to 6:00 pm."
            />
          </div>

          {/* Highlighted Total Box */}
          <div className="border border-slate-800 bg-slate-100/90 px-6 py-2 text-right">
            <span className="text-base font-extrabold text-black">
              Total: {formatAmount(total)}
            </span>
          </div>
        </div>

        {/* Footer Area: Thank You, Contacts & Signature */}
        <div className="mt-14 flex items-end justify-between pt-4 border-t border-slate-100">
          {/* Left Footer Contacts */}
          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-wide text-black">
              <EditableText
                value={thankYouNote}
                onChange={(val) => onUpdate({ thankYouNote: val })}
                isLiveEdit={isLiveEdit}
                placeholder="THANK YOU!"
              />
            </h2>

            <div className="space-y-1.5 text-xs text-slate-800">
              {company.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                  <EditableText
                    value={company.phone}
                    onChange={(val) => updateCompany({ phone: val })}
                    isLiveEdit={isLiveEdit}
                    placeholder="+91 909 505 7007"
                  />
                </div>
              )}

              {company.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                  <EditableText
                    value={company.email}
                    onChange={(val) => updateCompany({ email: val })}
                    isLiveEdit={isLiveEdit}
                    placeholder="msntravels7007@gmail.com"
                  />
                </div>
              )}

              {company.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <div className="whitespace-pre-line leading-relaxed">
                    <EditableText
                      value={company.address}
                      onChange={(val) => updateCompany({ address: val })}
                      isLiveEdit={isLiveEdit}
                      multiline
                      placeholder="Company Full Address"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Signature Area */}
          <div className="flex flex-col items-center justify-end text-center min-w-[170px]">
            <div className="text-sm font-semibold text-slate-800 mb-1">
              <EditableText
                value={signature.title}
                onChange={(val) =>
                  onUpdate({ signature: { ...signature, title: val } })
                }
                isLiveEdit={isLiveEdit}
                placeholder="Signature"
              />
            </div>

            <div
              onClick={onOpenSignatureModal}
              className={`relative flex h-16 w-44 items-center justify-center cursor-pointer transition-all ${
                isLiveEdit ? 'rounded border border-dashed border-sky-300 hover:bg-sky-50' : ''
              }`}
              title="Click to sign or configure signature"
            >
              {signature.type === 'draw' && signature.dataUrl ? (
                <img
                  src={signature.dataUrl}
                  alt="Signature"
                  className="max-h-16 max-w-full object-contain"
                />
              ) : signature.type === 'image' && signature.dataUrl ? (
                <img
                  src={signature.dataUrl}
                  alt="Signature"
                  className="max-h-16 max-w-full object-contain"
                />
              ) : signature.type === 'text' && signature.typedName ? (
                <span className="font-signature text-3xl text-slate-900">
                  {signature.typedName}
                </span>
              ) : (
                <div className="w-full border-b border-slate-400 mt-8 text-center text-[10px] text-sky-600 font-semibold">
                  + Click to add signature
                </div>
              )}
            </div>
            <div className="w-40 border-b border-slate-800 mt-1" />
          </div>
        </div>
      </div>
    );
  }

  // Modern Corporate / Minimalist / Executive Templates
  return (
    <div
      id="invoice-document"
      className="relative mx-auto bg-white text-slate-900 shadow-xl transition-all"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm 20mm 18mm 20mm',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        boxSizing: 'border-box',
      }}
    >
      {/* Top Banner / Header */}
      <div
        className="flex items-start justify-between border-b pb-6"
        style={{ borderColor: invoice.primaryColor || '#0f172a' }}
      >
        <div>
          {company.logoUrl ? (
            <div className="relative group/logo-box inline-block mb-2">
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-14 w-auto max-w-[180px] object-contain cursor-pointer"
                onClick={() => isLiveEdit && (onOpenCropModal ? onOpenCropModal(company.logoUrl) : fileInputRef.current?.click())}
                title={isLiveEdit ? 'Click to crop / adjust logo' : undefined}
              />
              {isLiveEdit && (
                <div className="no-print absolute top-1 right-1 flex items-center gap-1.5 bg-slate-900/90 text-white rounded-md px-2 py-0.5 shadow-lg text-[10px] font-medium opacity-0 group-hover/logo-box:opacity-100 transition-opacity z-20">
                  {onOpenCropModal && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCropModal(company.logoUrl);
                        }}
                        className="flex items-center gap-0.5 hover:text-sky-300 font-semibold"
                      >
                        <Crop className="h-2.5 w-2.5" />
                        Crop
                      </button>
                      <span className="text-slate-500">·</span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="hover:text-sky-300"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          ) : isLiveEdit ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mb-2 flex items-center gap-1 rounded border border-dashed border-sky-300 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
            >
              <Upload className="h-3 w-3" />
              Upload Logo
            </button>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            <EditableText
              value={company.name}
              onChange={(val) => updateCompany({ name: val })}
              isLiveEdit={isLiveEdit}
              placeholder="COMPANY NAME"
            />
          </h1>
          {company.tagline && (
            <p className="text-xs text-slate-500">
              <EditableText
                value={company.tagline}
                onChange={(val) => updateCompany({ tagline: val })}
                isLiveEdit={isLiveEdit}
                placeholder="Company Tagline"
              />
            </p>
          )}
          <div className="mt-2 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
            <EditableText
              value={company.address}
              onChange={(val) => updateCompany({ address: val })}
              isLiveEdit={isLiveEdit}
              multiline
              placeholder="Address"
            />
          </div>
          {company.gstin && (
            <div className="text-xs text-slate-500 mt-1">
              GST/Tax: <span className="font-semibold">{company.gstin}</span>
            </div>
          )}
        </div>

        <div className="text-right">
          <div
            className="inline-block px-4 py-1.5 rounded text-lg font-extrabold tracking-wider text-white"
            style={{ backgroundColor: invoice.primaryColor || '#0f172a' }}
          >
            <EditableText
              value={title}
              onChange={(val) => onUpdate({ title: val })}
              isLiveEdit={isLiveEdit}
              placeholder="INVOICE"
            />
          </div>
          <div className="mt-3 space-y-1 text-xs">
            <div>
              <span className="text-slate-500">Invoice #: </span>
              <span className="font-bold text-slate-900 font-tabular">
                <EditableText
                  value={invoiceNumber}
                  onChange={(val) => onUpdate({ invoiceNumber: val })}
                  isLiveEdit={isLiveEdit}
                  placeholder="INV-001"
                />
              </span>
            </div>
            <div>
              <span className="text-slate-500">Date: </span>
              <span className="font-semibold text-slate-800">
                <EditableText
                  value={date}
                  onChange={(val) => onUpdate({ date: val })}
                  isLiveEdit={isLiveEdit}
                  placeholder="Date"
                />
              </span>
            </div>
            {invoice.dueDate !== undefined && (
              <div>
                <span className="text-slate-500">Due Date: </span>
                <span className="font-semibold text-slate-800">
                  <EditableText
                    value={invoice.dueDate}
                    onChange={(val) => onUpdate({ dueDate: val })}
                    isLiveEdit={isLiveEdit}
                    placeholder="Due Date"
                  />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bill To & Bank Details in Modern Layout */}
      <div className="mt-6 grid grid-cols-12 gap-6 pb-6 border-b border-slate-200">
        <div className="col-span-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <EditableText
              value={client.label}
              onChange={(val) => updateClient({ label: val })}
              isLiveEdit={isLiveEdit}
              placeholder="Billed To:"
            />
          </span>
          <div className="mt-1 text-sm font-bold text-slate-900">
            <EditableText
              value={client.name}
              onChange={(val) => updateClient({ name: val })}
              isLiveEdit={isLiveEdit}
              placeholder="Client Name"
            />
          </div>
          <div className="mt-1 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
            <EditableText
              value={client.address}
              onChange={(val) => updateClient({ address: val })}
              isLiveEdit={isLiveEdit}
              multiline
              placeholder="Client Address"
            />
          </div>
          {client.email && (
            <div className="text-xs text-slate-500 mt-1">Email: {client.email}</div>
          )}
          {client.taxId && (
            <div className="text-xs text-slate-500">Tax ID: {client.taxId}</div>
          )}
        </div>

        <div className="col-span-6 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Remittance Details
            </span>
            {isLiveEdit && (
              <button
                type="button"
                onClick={addBankDirectly}
                className="no-print text-[10px] text-sky-700 font-semibold hover:underline"
              >
                + Add Bank
              </button>
            )}
          </div>
          {bankAccounts.slice(0, 2).map((bank, idx) => (
            <div key={bank.id || idx} className="mt-2 text-xs space-y-0.5 text-slate-700">
              <div className="font-bold text-slate-900">{bank.bankName}</div>
              {bank.accountNumber && (
                <div>
                  Ac/no : <span className="font-tabular font-medium">{bank.accountNumber}</span>
                </div>
              )}
              {bank.ifscCode && <div>IFSC / SWIFT: {bank.ifscCode}</div>}
              {bank.accountName && <div>A/c Name: {bank.accountName}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Modern Table */}
      <div className="mt-6">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              className="text-white uppercase tracking-wider font-semibold text-[11px]"
              style={{ backgroundColor: invoice.primaryColor || '#0f172a' }}
            >
              <th className="py-2.5 px-3 w-12 text-center rounded-l">
                <EditableText
                  value={tableHeaders.sno}
                  onChange={(val) => updateTableHeaders({ sno: val })}
                  isLiveEdit={isLiveEdit}
                  placeholder="#"
                />
              </th>
              <th className="py-2.5 px-3">
                <EditableText
                  value={tableHeaders.description}
                  onChange={(val) => updateTableHeaders({ description: val })}
                  isLiveEdit={isLiveEdit}
                  placeholder="Item Description"
                />
              </th>
              <th className="py-2.5 px-3 w-20 text-center">
                <EditableText
                  value={tableHeaders.qty}
                  onChange={(val) => updateTableHeaders({ qty: val })}
                  isLiveEdit={isLiveEdit}
                  placeholder="Qty"
                />
              </th>
              <th className="py-2.5 px-3 w-28 text-right">
                <EditableText
                  value={tableHeaders.price}
                  onChange={(val) => updateTableHeaders({ price: val })}
                  isLiveEdit={isLiveEdit}
                  placeholder="Rate"
                />
              </th>
              <th className="py-2.5 px-3 w-28 text-right rounded-r">
                <EditableText
                  value={tableHeaders.total}
                  onChange={(val) => updateTableHeaders({ total: val })}
                  isLiveEdit={isLiveEdit}
                  placeholder="Amount"
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50/50 group/modernrow">
                <td className="py-3 px-3 text-center font-medium text-slate-500">
                  {item.sno || idx + 1}
                </td>
                <td className="py-3 px-3">
                  {item.title && (
                    <div className="font-semibold text-slate-900 mb-0.5">
                      <EditableText
                        value={item.title}
                        onChange={(val) => updateItem(idx, { title: val })}
                        isLiveEdit={isLiveEdit}
                        placeholder="Title"
                      />
                    </div>
                  )}
                  <div className="text-slate-600 whitespace-pre-line leading-relaxed">
                    <EditableText
                      value={item.description}
                      onChange={(val) => updateItem(idx, { description: val })}
                      isLiveEdit={isLiveEdit}
                      multiline
                      placeholder="Description"
                    />
                  </div>
                </td>
                <td className="py-3 px-3 text-center font-tabular font-medium">
                  <EditableText
                    value={String(item.qty)}
                    onChange={(val) => updateItem(idx, { qty: val })}
                    isLiveEdit={isLiveEdit}
                    placeholder="1"
                  />
                </td>
                <td className="py-3 px-3 text-right font-tabular">
                  {isLiveEdit ? (
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(idx, { price: parseFloat(e.target.value) || 0 })}
                      className="w-20 rounded border border-dashed border-sky-300 bg-sky-50 px-1 py-0.5 text-right text-xs"
                    />
                  ) : (
                    formatCurrencyNumber(item.price)
                  )}
                </td>
                <td className="py-3 px-3 text-right font-tabular font-bold text-slate-900">
                  {isLiveEdit ? (
                    <input
                      type="number"
                      value={item.total}
                      onChange={(e) => updateItem(idx, { total: parseFloat(e.target.value) || 0 })}
                      className="w-20 rounded border border-dashed border-sky-300 bg-sky-50 px-1 py-0.5 text-right text-xs font-bold"
                    />
                  ) : (
                    formatCurrencyNumber(item.total)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLiveEdit && (
          <div className="no-print mt-2 text-center">
            <button
              type="button"
              onClick={addItemDirectly}
              className="inline-flex items-center gap-1 rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              <Plus className="h-3 w-3" />
              Add Row
            </button>
          </div>
        )}
      </div>

      {/* Calculations & Summary Section */}
      <div className="mt-8 grid grid-cols-12 gap-6 pt-4 border-t border-slate-200">
        <div className="col-span-7 space-y-3">
          {dutyHours && (
            <div className="rounded bg-slate-50 p-2.5 text-xs text-slate-700 font-medium">
              <EditableText
                value={dutyHours}
                onChange={(val) => onUpdate({ dutyHours: val })}
                isLiveEdit={isLiveEdit}
                placeholder="Duty Hours & Schedule"
              />
            </div>
          )}
          {customNotes && (
            <div className="text-xs text-slate-500 whitespace-pre-line">
              <span className="font-semibold text-slate-700">Terms & Conditions: </span>
              <EditableText
                value={customNotes}
                onChange={(val) => onUpdate({ customNotes: val })}
                isLiveEdit={isLiveEdit}
                multiline
                placeholder="Terms and conditions..."
              />
            </div>
          )}
        </div>

        <div className="col-span-5 space-y-2 text-xs">
          <div className="flex justify-between py-1 text-slate-600">
            <span>Subtotal</span>
            <span className="font-tabular font-medium">{formatCurrencyNumber(subtotal)}</span>
          </div>

          {taxPercent > 0 && (
            <div className="flex justify-between py-1 text-slate-600">
              <span>Tax ({taxPercent}%)</span>
              <span className="font-tabular font-medium">+{formatCurrencyNumber(taxAmount)}</span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex justify-between py-1 text-emerald-600">
              <span>Discount</span>
              <span className="font-tabular font-medium">-{formatCurrencyNumber(discount)}</span>
            </div>
          )}

          <div
            className="flex justify-between border-t border-b py-2 text-sm font-extrabold text-slate-900"
            style={{ borderColor: invoice.primaryColor || '#0f172a' }}
          >
            <span>Total</span>
            <span className="font-tabular">{formatAmount(total)}</span>
          </div>

          {advancePaid > 0 && (
            <>
              <div className="flex justify-between py-1 text-slate-500">
                <span>Advance Paid</span>
                <span className="font-tabular">-{formatCurrencyNumber(advancePaid)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm font-bold text-slate-900 bg-slate-100 p-1.5 rounded">
                <span>Balance Due</span>
                <span className="font-tabular">{formatAmount(balanceDue)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modern Footer & Signature */}
      <div className="mt-14 flex items-end justify-between pt-6 border-t border-slate-200">
        <div>
          <div className="text-sm font-bold text-slate-800">{thankYouNote}</div>
          <div className="mt-1 text-xs text-slate-500">
            {company.phone} · {company.email}
          </div>
        </div>

        <div className="text-center min-w-[160px]">
          <div
            onClick={onOpenSignatureModal}
            className={`flex h-14 w-40 items-center justify-center cursor-pointer transition-all ${
              isLiveEdit ? 'rounded border border-dashed border-sky-300 hover:bg-sky-50' : ''
            }`}
          >
            {signature.type === 'draw' && signature.dataUrl ? (
              <img src={signature.dataUrl} alt="Signature" className="max-h-14 object-contain" />
            ) : signature.type === 'text' && signature.typedName ? (
              <span className="font-signature text-2xl text-slate-900">{signature.typedName}</span>
            ) : (
              <div className="w-full border-b border-slate-300 mt-6 text-center text-[10px] text-slate-400">
                Authorized Signature
              </div>
            )}
          </div>
          <div className="w-36 border-b border-slate-400 mt-1 mx-auto" />
          <div className="mt-1 text-[11px] font-semibold text-slate-700">{signature.title}</div>
        </div>
      </div>
    </div>
  );
};
