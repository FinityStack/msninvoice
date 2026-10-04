import React, { useState, useEffect, useRef } from 'react';
import { InvoiceData } from './types/invoice';
import { DEFAULT_INVOICE, SAMPLE_PRESETS } from './data/defaultInvoice';
import { BLANK_INVOICE } from './types/blankInvoice';
import { InvoiceDocument } from './components/InvoiceDocument';
import { SidebarEditor } from './components/SidebarEditor';
import { Navbar } from './components/Navbar';
import { QuickToolbar } from './components/QuickToolbar';
import { SignaturePadModal } from './components/SignaturePadModal';
import { HistoryModal } from './components/HistoryModal';
import { ImageCropModal } from './components/ImageCropModal';
import { exportInvoiceToPdf, exportInvoiceToPng, triggerPrintInvoice } from './utils/pdfExport';
import { numberToWords } from './utils/numberToWords';
import {
  ZoomIn,
  ZoomOut,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  Sliders,
  Eye,
  Maximize2,
} from 'lucide-react';

const CURRENT_DRAFT_KEY = 'generatemsninvoice_active_draft_v1';
const LEGACY_DRAFT_KEY = 'swiftinvoice_active_draft_v1';

export default function App() {
  const [invoice, setInvoice] = useState<InvoiceData>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_DRAFT_KEY) || localStorage.getItem(LEGACY_DRAFT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading saved draft:', e);
    }
    return DEFAULT_INVOICE;
  });

  const [isLiveEdit, setIsLiveEdit] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');
  const [zoomScale, setZoomScale] = useState<number>(0.92);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit document on screen resize (especially on mobile/tablets)
  useEffect(() => {
    const calculateAutoFit = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      if (isMobile) {
        // A4 width is 794px equivalent (210mm). Fit nicely with padding
        const availableWidth = window.innerWidth - 24;
        const targetScale = Math.min(1, Math.max(0.38, availableWidth / 800));
        setZoomScale(Number(targetScale.toFixed(2)));
      } else if (isTablet) {
        const availableWidth = (window.innerWidth - 380) - 48;
        const targetScale = Math.min(1, Math.max(0.55, availableWidth / 800));
        setZoomScale(Number(targetScale.toFixed(2)));
      } else {
        setZoomScale(0.92);
      }
    };

    calculateAutoFit();
    window.addEventListener('resize', calculateAutoFit);
    return () => window.removeEventListener('resize', calculateAutoFit);
  }, []);

  // Auto-save active draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_DRAFT_KEY, JSON.stringify(invoice));
    } catch (e) {
      console.error('Failed to auto-save invoice:', e);
    }
  }, [invoice]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleUpdateInvoice = (updatedFields: Partial<InvoiceData>) => {
    setInvoice((prev) => {
      const next = { ...prev, ...updatedFields };

      // Keep total in words updated
      if (updatedFields.total !== undefined || updatedFields.currency !== undefined) {
        next.totalInWords = numberToWords(next.total, next.currency.code);
      }

      return next;
    });
  };

  const handleResetToSample = () => {
    if (window.confirm('Reset current invoice back to the MSN Tours sample invoice?')) {
      setInvoice(DEFAULT_INVOICE);
      showToast('Reset to MSN Tours sample invoice');
    }
  };

  const handleClearToBlank = () => {
    if (window.confirm('Clear all fields to create a blank invoice?')) {
      setInvoice(BLANK_INVOICE);
      showToast('Created blank invoice');
    }
  };

  const handleSetTodayDate = () => {
    const today = new Date().toISOString().split('T')[0];
    handleUpdateInvoice({ date: today });
    showToast(`Invoice date updated to ${today}`);
  };

  const handleAddItemRow = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      sno: invoice.items.length + 1,
      title: '',
      description: 'Trip or service details',
      qty: 1,
      price: 0,
      total: 0,
    };
    const updatedItems = [...invoice.items, newItem];
    const subtotal = updatedItems.reduce((sum, it) => sum + (it.total || 0), 0);
    const taxAmount = (subtotal * invoice.taxPercent) / 100;
    const total = Math.max(0, subtotal + taxAmount - invoice.discount);
    const balanceDue = Math.max(0, total - invoice.advancePaid);

    handleUpdateInvoice({
      items: updatedItems,
      subtotal,
      taxAmount,
      total,
      balanceDue,
    });
    showToast('Added new item row');
  };

  const handleOpenCropModal = (imageSrc?: string) => {
    const src = imageSrc || invoice.company.logoUrl;
    if (!src) {
      showToast('Please upload a logo image first');
      return;
    }
    setCropImageSrc(src);
    setIsCropModalOpen(true);
  };

  const handleSaveCroppedLogo = (croppedDataUrl: string) => {
    handleUpdateInvoice({
      company: {
        ...invoice.company,
        logoUrl: croppedDataUrl,
      },
    });
    showToast('Company logo cropped and saved successfully');
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    // Switch to preview mode temporarily to remove outlines
    const wasLiveEdit = isLiveEdit;
    setIsLiveEdit(false);

    // Switch mobile view to invoice preview if currently on form
    const wasMobileView = mobileView;
    setMobileView('preview');

    await new Promise((r) => setTimeout(r, 250));

    const filename = `${invoice.company.name || 'Invoice'}-${invoice.invoiceNumber || 'Draft'}.pdf`;
    const success = await exportInvoiceToPdf('invoice-document', filename);

    setIsLiveEdit(wasLiveEdit);
    setMobileView(wasMobileView);
    setIsExporting(false);

    if (success) {
      showToast(`Exported ${filename} successfully!`);
    } else {
      showToast('Could not export PDF. Try using the "Print" button.');
    }
  };

  const handleExportPng = async () => {
    setIsExporting(true);
    const wasLiveEdit = isLiveEdit;
    setIsLiveEdit(false);
    const wasMobileView = mobileView;
    setMobileView('preview');

    await new Promise((r) => setTimeout(r, 250));

    const filename = `${invoice.company.name || 'Invoice'}-${invoice.invoiceNumber || 'Draft'}.png`;
    const success = await exportInvoiceToPng('invoice-document', filename);

    setIsLiveEdit(wasLiveEdit);
    setMobileView(wasMobileView);
    setIsExporting(false);

    if (success) {
      showToast(`Saved ${filename} as image!`);
    } else {
      showToast('Could not export PNG image.');
    }
  };

  const handlePrint = () => {
    triggerPrintInvoice();
  };

  const handleFitA4 = () => {
    if (window.innerWidth < 768) {
      const availableWidth = window.innerWidth - 24;
      setZoomScale(Number(Math.max(0.38, availableWidth / 800).toFixed(2)));
    } else {
      setZoomScale(0.92);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-100 text-slate-900">
      {/* Top Navbar with responsive mobile toggle & drawer */}
      <Navbar
        isLiveEdit={isLiveEdit}
        onToggleLiveEdit={() => setIsLiveEdit(!isLiveEdit)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenSignature={() => setIsSignatureModalOpen(true)}
        onOpenCropLogo={() => handleOpenCropModal()}
        onExportPdf={handleExportPdf}
        onExportPng={handleExportPng}
        onPrint={handlePrint}
        isExporting={isExporting}
        mobileView={mobileView}
        onSetMobileView={setMobileView}
      />

      {/* Quick Action Toolbar */}
      <QuickToolbar
        onAddItem={handleAddItemRow}
        onOpenSignature={() => setIsSignatureModalOpen(true)}
        onOpenCropLogo={() => handleOpenCropModal()}
        onExportPdf={handleExportPdf}
        onPrint={handlePrint}
        onReset={handleResetToSample}
        currentTemplateId={invoice.templateId}
        onSelectTemplate={(templateId) => handleUpdateInvoice({ templateId })}
        onSetTodayDate={handleSetTodayDate}
        onClearInvoice={handleClearToBlank}
        isExporting={isExporting}
        currencySymbol={invoice.currency.symbol}
        totalAmount={invoice.total}
      />

      {/* Main Workspace: Responsive Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Form Editor:
            - On desktop (md+): regular side panel with slide-out animation
            - On mobile (<md): full screen when mobileView === 'form'
        */}
        <div
          className={`h-full z-20 bg-white transition-all duration-300 ease-in-out ${
            // Mobile handling:
            mobileView === 'form'
              ? 'flex w-full md:w-96 lg:w-[420px]'
              : 'hidden md:flex'
          } ${
            // Desktop collapsed handling:
            !isSidebarOpen && 'md:!hidden'
          } md:shadow-md md:border-r md:border-slate-200`}
        >
          <SidebarEditor
            invoice={invoice}
            onChange={handleUpdateInvoice}
            onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
            onOpenCropModal={handleOpenCropModal}
            onResetToSample={handleResetToSample}
          />
        </div>

        {/* Center / Right Canvas Area:
            - On mobile (<md): visible when mobileView === 'preview'
            - On desktop (md+): always visible alongside sidebar
        */}
        <main
          className={`flex-1 flex-col h-full overflow-hidden bg-slate-200/70 print-container ${
            mobileView === 'preview' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Canvas Sub-Toolbar (Floating controls) */}
          <div className="no-print flex items-center justify-between border-b border-slate-300/70 bg-white/70 px-3 sm:px-4 py-1.5 text-xs backdrop-blur-xs">
            <div className="flex items-center gap-2">
              {/* Desktop toggle sidebar button */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden md:flex items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                title={isSidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
              >
                {isSidebarOpen ? (
                  <>
                    <PanelLeftClose className="h-3.5 w-3.5" />
                    <span>Hide Form</span>
                  </>
                ) : (
                  <>
                    <PanelLeftOpen className="h-3.5 w-3.5" />
                    <span>Open Form</span>
                  </>
                )}
              </button>

              {/* Mobile button to jump back to form */}
              <button
                type="button"
                onClick={() => setMobileView('form')}
                className="md:hidden flex items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-800 shadow-2xs"
              >
                <Sliders className="h-3.5 w-3.5 text-sky-600" />
                <span>Edit Fields</span>
              </button>

              <span className="text-slate-400 hidden sm:inline">|</span>

              <span className="text-slate-600 font-medium hidden lg:inline">
                {isLiveEdit ? (
                  <span className="flex items-center gap-1 text-sky-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                    Click any field to edit directly
                  </span>
                ) : (
                  <span className="text-slate-500">Preview Mode</span>
                )}
              </span>
            </div>

            {/* Zoom / Scale Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(0.35, prev - 0.1))}
                className="rounded p-1 text-slate-600 hover:bg-slate-200 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 sm:w-12 text-center font-tabular text-[10px] sm:text-[11px] font-semibold text-slate-700">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(1.5, prev + 0.1))}
                className="rounded p-1 text-slate-600 hover:bg-slate-200 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleFitA4}
                className="ml-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
                title="Fit Width"
              >
                Fit
              </button>
            </div>
          </div>

          {/* Interactive Document Viewport (Pan & Scroll) */}
          <div
            ref={containerRef}
            className="flex-1 overflow-auto p-2 sm:p-6 md:p-8 flex justify-center items-start print:p-0"
          >
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
                marginBottom: `${Math.max(40, (1 - zoomScale) * 300)}px`,
              }}
              className="print:transform-none print:m-0"
            >
              <InvoiceDocument
                invoice={invoice}
                isLiveEdit={isLiveEdit}
                onUpdate={handleUpdateInvoice}
                onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                onOpenCropModal={handleOpenCropModal}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Company Logo Cropper & Editor Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => setIsCropModalOpen(false)}
        onSave={handleSaveCroppedLogo}
      />

      {/* Signature Configuration Modal */}
      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        signatureConfig={invoice.signature}
        onSave={(newSig) => handleUpdateInvoice({ signature: newSig })}
      />

      {/* Drafts, History & Presets Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        currentInvoice={invoice}
        onLoadInvoice={(loaded) => {
          setInvoice(loaded);
          showToast(`Loaded ${loaded.company.name || 'Invoice'}`);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-5 sm:bottom-5 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl no-print">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
