import React, { useState } from 'react';
import {
  Download,
  Printer,
  Edit3,
  Eye,
  History,
  PenLine,
  Image as ImageIcon,
  Menu,
  X,
  Sliders,
  Crop,
} from 'lucide-react';

interface NavbarProps {
  isLiveEdit: boolean;
  onToggleLiveEdit: () => void;
  onOpenHistory: () => void;
  onOpenSignature: () => void;
  onOpenCropLogo?: () => void;
  onExportPdf: () => void;
  onExportPng: () => void;
  onPrint: () => void;
  isExporting: boolean;
  mobileView: 'form' | 'preview';
  onSetMobileView: (view: 'form' | 'preview') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isLiveEdit,
  onToggleLiveEdit,
  onOpenHistory,
  onOpenSignature,
  onOpenCropLogo,
  onExportPdf,
  onExportPng,
  onPrint,
  isExporting,
  mobileView,
  onSetMobileView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-6 backdrop-blur-md no-print">
      {/* Brand Title & Desktop Mode Switch */}
      <div className="flex items-center gap-3 sm:gap-6">
        <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 select-none flex items-center gap-1.5">
          <span>MSN<span className="text-sky-600">Invoice</span></span>
        </span>

        {/* Mobile View Toggle: Form vs Preview */}
        <div className="flex md:hidden items-center rounded-lg bg-slate-100 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => onSetMobileView('form')}
            className={`flex items-center gap-1 rounded-md px-2 py-1 font-semibold transition-all ${
              mobileView === 'form'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="h-3 w-3 text-sky-600" />
            <span>Form</span>
          </button>
          <button
            type="button"
            onClick={() => onSetMobileView('preview')}
            className={`flex items-center gap-1 rounded-md px-2 py-1 font-semibold transition-all ${
              mobileView === 'preview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="h-3 w-3 text-emerald-600" />
            <span>Invoice</span>
          </button>
        </div>

        {/* Desktop Edit Mode Toggle Switcher */}
        <div className="hidden md:flex items-center rounded-lg bg-slate-100 p-0.5">
          <button
            onClick={() => onToggleLiveEdit()}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
              isLiveEdit
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5 text-sky-600" />
            Live In-Place Edit
          </button>
          <button
            onClick={() => onToggleLiveEdit()}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
              !isLiveEdit
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Print Preview
          </button>
        </div>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="hidden lg:flex items-center gap-2">
        <button
          onClick={onOpenSignature}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
        >
          <PenLine className="h-3.5 w-3.5" />
          Signature
        </button>

        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
        >
          <History className="h-3.5 w-3.5" />
          Drafts & Presets
        </button>

        <button
          onClick={onExportPng}
          disabled={isExporting}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
          title="Export invoice as PNG image for messaging"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Export PNG
        </button>
      </nav>

      {/* Primary Actions (Print & Export PDF) + Mobile Menu Trigger */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onPrint}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shadow-xs"
          title="Direct print to physical printer or browser PDF"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print</span>
        </button>

        <button
          onClick={onExportPdf}
          disabled={isExporting}
          className="flex items-center gap-1 sm:gap-1.5 rounded-lg bg-slate-900 px-3 sm:px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{isExporting ? 'Exporting...' : 'PDF'}</span>
        </button>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex items-center justify-center rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          title="Open more tools"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-14 left-0 right-0 z-50 border-b border-slate-200 bg-white p-3 shadow-lg flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
              Quick Navigation
            </span>
            <button
              onClick={() => {
                onToggleLiveEdit();
                setMobileMenuOpen(false);
              }}
              className="text-sky-600 font-medium"
            >
              {isLiveEdit ? 'Switch to Print Preview' : 'Enable Live Edit'}
            </button>
          </div>

          {onOpenCropLogo && (
            <button
              onClick={() => {
                onOpenCropLogo();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md p-2 text-left text-slate-800 hover:bg-slate-50"
            >
              <Crop className="h-4 w-4 text-slate-500" />
              <span className="font-medium">Crop Company Logo</span>
            </button>
          )}

          <button
            onClick={() => {
              onOpenSignature();
              setMobileMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md p-2 text-left text-slate-800 hover:bg-slate-50"
          >
            <PenLine className="h-4 w-4 text-slate-500" />
            <span className="font-medium">Draw or Upload Signature</span>
          </button>

          <button
            onClick={() => {
              onOpenHistory();
              setMobileMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md p-2 text-left text-slate-800 hover:bg-slate-50"
          >
            <History className="h-4 w-4 text-slate-500" />
            <span className="font-medium">Saved Drafts & Sample Templates</span>
          </button>

          <button
            onClick={() => {
              onExportPng();
              setMobileMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md p-2 text-left text-slate-800 hover:bg-slate-50"
          >
            <ImageIcon className="h-4 w-4 text-slate-500" />
            <span className="font-medium">Export as Image (PNG)</span>
          </button>

          <button
            onClick={() => {
              onPrint();
              setMobileMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md p-2 text-left text-slate-800 hover:bg-slate-50 sm:hidden"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span className="font-medium">Print / Browser PDF</span>
          </button>
        </div>
      )}
    </header>
  );
};
