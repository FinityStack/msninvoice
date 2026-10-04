import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check, Upload, PenTool, Type } from 'lucide-react';
import { SignatureConfig } from '../types/invoice';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  signatureConfig: SignatureConfig;
  onSave: (config: SignatureConfig) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  signatureConfig,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'upload' | 'text'>(
    signatureConfig.type === 'image' ? 'upload' : signatureConfig.type === 'text' ? 'text' : 'draw'
  );
  const [typedName, setTypedName] = useState(signatureConfig.typedName || '');
  const [signatoryTitle, setSignatoryTitle] = useState(signatureConfig.title || 'Signature');
  const [uploadedImage, setUploadedImage] = useState<string | undefined>(signatureConfig.dataUrl);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (!isOpen || activeTab !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If existing drawn signature is an SVG or dataUrl, try rendering it
    if (signatureConfig.type === 'draw' && signatureConfig.dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
      };
      img.src = signatureConfig.dataUrl;
    }
  }, [isOpen, activeTab, signatureConfig]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Scale coordinate to canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      const dataUrl = canvas && hasDrawn ? canvas.toDataURL('image/png') : signatureConfig.dataUrl;
      onSave({
        enabled: true,
        type: 'draw',
        dataUrl,
        title: signatoryTitle,
      });
    } else if (activeTab === 'upload') {
      onSave({
        enabled: true,
        type: 'image',
        dataUrl: uploadedImage,
        title: signatoryTitle,
      });
    } else if (activeTab === 'text') {
      onSave({
        enabled: true,
        type: 'text',
        typedName: typedName.trim() || 'Authorized Signature',
        title: signatoryTitle,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs no-print overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">Configure Signature</h3>
            <p className="text-xs text-slate-500">Draw, upload, or type an authorized signature</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="mt-4 flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 sm:py-2 text-xs font-medium transition-all ${
              activeTab === 'draw'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            <span>Draw</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 sm:py-2 text-xs font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 sm:py-2 text-xs font-medium transition-all ${
              activeTab === 'text'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            <span>Type</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'draw' && (
            <div>
              <div className="relative rounded-lg border border-slate-300 bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={170}
                  className="h-36 sm:h-44 w-full touch-none cursor-crosshair rounded-lg"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md border border-slate-200 bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">
                Sign above with your finger, stylus, or mouse
              </p>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-4 sm:p-6 text-center">
              {uploadedImage ? (
                <div className="space-y-3">
                  <div className="flex max-h-32 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50 p-2">
                    <img
                      src={uploadedImage}
                      alt="Signature Preview"
                      className="max-h-28 object-contain"
                    />
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900">
                    <Upload className="h-3.5 w-3.5" />
                    Replace Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <span className="text-xs font-medium text-slate-700">
                    Click to upload signature photo or scan
                  </span>
                  <span className="text-[11px] text-slate-400">PNG, JPG, or SVG file</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="e.g. Partho Rahim"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                <span className="text-xs uppercase tracking-wider text-slate-400">Signature Preview</span>
                <p className="mt-2 font-signature text-2xl sm:text-3xl text-slate-900 truncate">
                  {typedName || 'Your Signature'}
                </p>
              </div>
            </div>
          )}

          {/* Signatory Title */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <label className="block text-xs font-medium text-slate-700">
              Signatory Label / Designation
            </label>
            <input
              type="text"
              value={signatoryTitle}
              onChange={(e) => setSignatoryTitle(e.target.value)}
              placeholder="Signature, Authorized Signatory, Director, etc."
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3.5 py-1.5 sm:py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 sm:py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Check className="h-3.5 w-3.5" />
            Apply Signature
          </button>
        </div>
      </div>
    </div>
  );
};
