import React, { useState, useEffect } from 'react';
import { X, Save, FolderOpen, Copy, Trash2, Download, Upload, Check } from 'lucide-react';
import { InvoiceData } from '../types/invoice';
import { DEFAULT_INVOICE, SAMPLE_PRESETS } from '../data/defaultInvoice';

interface SavedInvoiceItem {
  id: string;
  name: string;
  date: string;
  total: number;
  currencySymbol: string;
  data: InvoiceData;
  updatedAt: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInvoice: InvoiceData;
  onLoadInvoice: (data: InvoiceData) => void;
}

const STORAGE_KEY = 'generatemsninvoice_saved_invoices_v1';
const LEGACY_STORAGE_KEY = 'swiftinvoice_saved_invoices_v1';

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  currentInvoice,
  onLoadInvoice,
}) => {
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoiceItem[]>([]);
  const [newSaveName, setNewSaveName] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Load from localstorage on open
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        setSavedInvoices(JSON.parse(stored));
      } else {
        // Seed initial MSN Tours sample in storage if empty
        const initial = [
          {
            id: 'sample-msn',
            name: 'MSN Tours Sample Invoice',
            date: DEFAULT_INVOICE.date,
            total: DEFAULT_INVOICE.total,
            currencySymbol: DEFAULT_INVOICE.currency.symbol,
            data: DEFAULT_INVOICE,
            updatedAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        setSavedInvoices(initial);
      }
    } catch (e) {
      console.error('Failed to parse saved invoices:', e);
    }
    setNewSaveName(`${currentInvoice.company.name || 'Invoice'} - ${currentInvoice.invoiceNumber}`);
  }, [isOpen, currentInvoice]);

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    if (!newSaveName.trim()) return;

    const newItem: SavedInvoiceItem = {
      id: `saved-${Date.now()}`,
      name: newSaveName.trim(),
      date: currentInvoice.date,
      total: currentInvoice.total,
      currencySymbol: currentInvoice.currency.symbol,
      data: currentInvoice,
      updatedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...savedInvoices.filter((inv) => inv.name !== newItem.name)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedInvoices(updated);
    setSaveSuccessMsg('Saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  const handleDelete = (id: string) => {
    const updated = savedInvoices.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedInvoices(updated);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(currentInvoice, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${currentInvoice.invoiceNumber || 'Draft'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.company && parsed.items) {
          onLoadInvoice(parsed);
          onClose();
        } else {
          alert('Invalid invoice JSON structure.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs no-print overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">Invoice Drafts & Backups</h3>
            <p className="text-xs text-slate-500">
              Save multiple invoices locally, restore drafts, or backup to JSON
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Save Current Invoice Section */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <label className="block text-xs font-semibold text-slate-700">Save Current State</label>
          <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newSaveName}
              onChange={(e) => setNewSaveName(e.target.value)}
              placeholder="Draft Name / Client Reference"
              className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
            />
            <button
              onClick={handleSaveCurrent}
              className="flex items-center justify-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </button>
          </div>
          {saveSuccessMsg && (
            <p className="mt-1 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
              <Check className="h-3 w-3" /> {saveSuccessMsg}
            </p>
          )}
        </div>

        {/* Saved List */}
        <div className="mt-4">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Saved Invoices ({savedInvoices.length})
          </span>
          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {savedInvoices.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No saved invoices found. Save your current draft above!
              </div>
            ) : (
              savedInvoices.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 sm:p-3 hover:border-slate-300 transition-colors gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{item.name}</h5>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
                      <span>{item.date}</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-700">
                        {item.currencySymbol} {item.total?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onLoadInvoice(item.data);
                        onClose();
                      }}
                      className="rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Preset Starters & JSON Import / Export */}
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Starters:</span>
              <button
                type="button"
                onClick={() => {
                  onLoadInvoice(SAMPLE_PRESETS.msnTours);
                  onClose();
                }}
                className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                MSN Tours
              </button>
              <button
                type="button"
                onClick={() => {
                  onLoadInvoice(SAMPLE_PRESETS.corporateConsulting);
                  onClose();
                }}
                className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Consulting
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
              >
                <Download className="h-3 w-3" />
                Export JSON
              </button>
              <span>·</span>
              <label className="flex cursor-pointer items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900">
                <Upload className="h-3 w-3" />
                Import JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
