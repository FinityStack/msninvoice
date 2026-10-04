import React from 'react';
import {
  Download,
  Plus,
  Calendar,
  PenTool,
  RotateCcw,
  Sparkles,
  Crop,
} from 'lucide-react';
import { PRESET_TEMPLATES } from '../data/defaultInvoice';
import { TemplateId } from '../types/invoice';

interface QuickToolbarProps {
  onAddItem: () => void;
  onOpenSignature: () => void;
  onOpenCropLogo?: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
  onReset: () => void;
  currentTemplateId: TemplateId;
  onSelectTemplate: (id: TemplateId) => void;
  onSetTodayDate: () => void;
  onClearInvoice: () => void;
  isExporting: boolean;
  currencySymbol: string;
  totalAmount: number;
}

export const QuickToolbar: React.FC<QuickToolbarProps> = ({
  onAddItem,
  onOpenSignature,
  onOpenCropLogo,
  onExportPdf,
  onPrint,
  onReset,
  currentTemplateId,
  onSelectTemplate,
  onSetTodayDate,
  onClearInvoice,
  isExporting,
  currencySymbol,
  totalAmount,
}) => {
  return (
    <div className="no-print sticky top-14 z-30 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 sm:px-4 py-1.5 sm:py-2 text-xs shadow-xs backdrop-blur-md overflow-x-auto scrollbar-none">
      {/* Group 1: Fast Creation Buttons */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-1 rounded-md bg-sky-50 px-2 sm:px-2.5 py-1 sm:py-1.5 font-semibold text-sky-700 hover:bg-sky-100 hover:text-sky-800 transition-colors border border-sky-200/80 shadow-2xs whitespace-nowrap"
          title="Add a new row to invoice"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ Add Row</span>
        </button>

        <button
          type="button"
          onClick={onSetTodayDate}
          className="flex items-center gap-1 rounded-md bg-slate-50 px-2 sm:px-2.5 py-1 sm:py-1.5 font-medium text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200 whitespace-nowrap"
          title="Set date to today"
        >
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>Today</span>
        </button>

        <button
          type="button"
          onClick={onOpenSignature}
          className="flex items-center gap-1 rounded-md bg-slate-50 px-2 sm:px-2.5 py-1 sm:py-1.5 font-medium text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200 whitespace-nowrap"
          title="Sign invoice"
        >
          <PenTool className="h-3.5 w-3.5 text-slate-500" />
          <span>Sign</span>
        </button>

        {onOpenCropLogo && (
          <button
            type="button"
            onClick={onOpenCropLogo}
            className="flex items-center gap-1 rounded-md bg-slate-50 px-2 sm:px-2.5 py-1 sm:py-1.5 font-medium text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200 whitespace-nowrap"
            title="Crop & adjust company logo"
          >
            <Crop className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Crop Logo</span>
            <span className="sm:hidden">Logo</span>
          </button>
        )}

        <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200">
          <select
            value={currentTemplateId}
            onChange={(e) => onSelectTemplate(e.target.value as TemplateId)}
            className="rounded border border-slate-300 bg-white px-1.5 sm:px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
          >
            {PRESET_TEMPLATES.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Group 2: Quick Total Display & Actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1 rounded-md bg-slate-100/90 px-2 sm:px-3 py-1 font-semibold text-slate-900 text-xs whitespace-nowrap">
          <span className="text-slate-500 font-normal hidden sm:inline">Total:</span>
          <span className="font-tabular font-bold">
            {currencySymbol} {totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="hidden md:flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
          title="Reset to MSN Tours original sample"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Sample</span>
        </button>

        <button
          type="button"
          onClick={onClearInvoice}
          className="hidden md:flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-700 transition-colors whitespace-nowrap"
          title="Clear all fields for a fresh invoice"
        >
          <span>Blank</span>
        </button>
      </div>
    </div>
  );
};
