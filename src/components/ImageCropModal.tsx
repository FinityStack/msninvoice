import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crop as CropIcon,
  RefreshCw,
  Eye,
  Sliders,
} from 'lucide-react';

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => void;
  aspectRatioPreset?: number | null; // e.g. 1 for 1:1, 4/3, 16/9, or null for Free
}

type AspectRatioOption = {
  label: string;
  value: number | null;
  description: string;
};

const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: 'Free', value: null, description: 'Custom' },
  { label: '1:1', value: 1, description: 'Square' },
  { label: '4:3', value: 4 / 3, description: 'Standard' },
  { label: '16:9', value: 16 / 9, description: 'Wide' },
  { label: '2:1', value: 2, description: 'Banner' },
  { label: '3:1', value: 3, description: 'Header' },
];

interface CropRect {
  x: number; // 0 to 1
  y: number; // 0 to 1
  width: number; // 0 to 1
  height: number; // 0 to 1
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  aspectRatioPreset = null,
}) => {
  const [selectedRatio, setSelectedRatio] = useState<number | null>(aspectRatioPreset);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [crop, setCrop] = useState<CropRect>({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [activeHandle, setActiveHandle] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startCrop: CropRect;
    handle: string;
  } | null>(null);

  // Initialize or reset crop box when modal opens or imageSrc changes
  useEffect(() => {
    if (isOpen && imageSrc) {
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setZoom(1);
      setSelectedRatio(aspectRatioPreset);
      setCrop({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
    }
  }, [isOpen, imageSrc, aspectRatioPreset]);

  // Adjust crop to match aspect ratio
  const applyAspectRatio = useCallback((ratio: number | null, currentCrop: CropRect): CropRect => {
    if (ratio === null) return currentCrop;

    // Get current container aspect ratio if available
    const img = imgRef.current;
    if (!img) return currentCrop;

    const imgWidth = img.naturalWidth || 1;
    const imgHeight = img.naturalHeight || 1;
    const isTransposed = rotation === 90 || rotation === 270;
    const effectiveW = isTransposed ? imgHeight : imgWidth;
    const effectiveH = isTransposed ? imgWidth : imgHeight;
    const imageAspect = effectiveW / effectiveH;

    // In normalized coords (0..1), ratio of box in pixels is:
    // (crop.width * effectiveW) / (crop.height * effectiveH) = ratio
    // => crop.width / crop.height = ratio / imageAspect
    const normalizedRatio = ratio / imageAspect;

    let newW = currentCrop.width;
    let newH = newW / normalizedRatio;

    if (newH > 0.96) {
      newH = 0.96;
      newW = newH * normalizedRatio;
    }
    if (newW > 0.96) {
      newW = 0.96;
      newH = newW / normalizedRatio;
    }

    const newX = Math.max(0, Math.min(1 - newW, currentCrop.x));
    const newY = Math.max(0, Math.min(1 - newH, currentCrop.y));

    return {
      x: newX,
      y: newY,
      width: Math.min(newW, 1 - newX),
      height: Math.min(newH, 1 - newY),
    };
  }, [rotation]);

  const handleRatioSelect = (ratio: number | null) => {
    setSelectedRatio(ratio);
    setCrop((prev) => applyAspectRatio(ratio, prev));
  };

  // Pointer drag handling for moving crop box or adjusting handles
  const handlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Set pointer capture for smooth dragging outside element
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setActiveHandle(handle);

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startCrop: { ...crop },
      handle,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaX = (e.clientX - dragStartRef.current.clientX) / rect.width;
    const deltaY = (e.clientY - dragStartRef.current.clientY) / rect.height;
    const { startCrop, handle } = dragStartRef.current;

    let newCrop = { ...startCrop };
    const minSize = 0.08;

    if (handle === 'move') {
      newCrop.x = Math.max(0, Math.min(1 - startCrop.width, startCrop.x + deltaX));
      newCrop.y = Math.max(0, Math.min(1 - startCrop.height, startCrop.y + deltaY));
    } else {
      // Handle corner and edge resizing
      if (handle.includes('w')) {
        const potentialW = startCrop.width - deltaX;
        if (potentialW >= minSize) {
          const newX = Math.max(0, startCrop.x + deltaX);
          newCrop.width = startCrop.x + startCrop.width - newX;
          newCrop.x = newX;
        }
      }
      if (handle.includes('e')) {
        const potentialW = startCrop.width + deltaX;
        newCrop.width = Math.max(minSize, Math.min(1 - startCrop.x, potentialW));
      }
      if (handle.includes('n')) {
        const potentialH = startCrop.height - deltaY;
        if (potentialH >= minSize) {
          const newY = Math.max(0, startCrop.y + deltaY);
          newCrop.height = startCrop.y + startCrop.height - newY;
          newCrop.y = newY;
        }
      }
      if (handle.includes('s')) {
        const potentialH = startCrop.height + deltaY;
        newCrop.height = Math.max(minSize, Math.min(1 - startCrop.y, potentialH));
      }

      // If aspect ratio is enforced
      if (selectedRatio !== null && handle !== 'move') {
        newCrop = applyAspectRatio(selectedRatio, newCrop);
      }
    }

    setCrop(newCrop);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      dragStartRef.current = null;
      setActiveHandle(null);
    }
  };

  // Generate cropped preview on canvas
  const generateCroppedImage = useCallback((): string | null => {
    const img = imgRef.current;
    if (!img) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const natW = img.naturalWidth || 800;
    const natH = img.naturalHeight || 600;

    // Handle rotation dimensions
    const isTransposed = rotation === 90 || rotation === 270;
    const effectiveW = isTransposed ? natH : natW;
    const effectiveH = isTransposed ? natW : natH;

    // Source coordinates on the transformed image
    const cropPixelX = Math.max(0, crop.x * effectiveW);
    const cropPixelY = Math.max(0, crop.y * effectiveH);
    const cropPixelW = Math.min(effectiveW - cropPixelX, crop.width * effectiveW);
    const cropPixelH = Math.min(effectiveH - cropPixelY, crop.height * effectiveH);

    if (cropPixelW <= 0 || cropPixelH <= 0) return null;

    // Output canvas size (high quality)
    canvas.width = Math.round(cropPixelW);
    canvas.height = Math.round(cropPixelH);

    ctx.save();

    // Move to center of output canvas and transform
    ctx.translate(-cropPixelX, -cropPixelY);

    // Apply rotation & flip around the center of the effective bounding box
    if (rotation !== 0 || flipH || flipV) {
      ctx.translate(effectiveW / 2, effectiveH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -natW / 2, -natH / 2, natW, natH);
    } else {
      ctx.drawImage(img, 0, 0, natW, natH);
    }

    ctx.restore();

    return canvas.toDataURL('image/png');
  }, [crop, rotation, flipH, flipV]);

  // Update mini live preview when crop changes
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const data = generateCroppedImage();
      if (data) setPreviewDataUrl(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, crop, rotation, flipH, flipV, generateCroppedImage]);

  const handleApply = () => {
    const cropped = generateCroppedImage();
    if (cropped) {
      onSave(cropped);
      onClose();
    }
  };

  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setSelectedRatio(aspectRatioPreset);
    setCrop({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
  };

  const handleRotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCounterClockwise = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 no-print select-none animate-fadeIn"
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      <div className="relative flex max-h-[96vh] w-full max-w-4xl flex-col rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <CropIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Crop & Adjust Company Logo</h3>
              <p className="text-[11px] text-slate-400">
                Drag handles to frame your logo, adjust aspect ratio, or rotate
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Workspace + Controls */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {/* Main Cropping Viewport */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-center">
            {/* Cropper Container */}
            <div className="relative flex-1 w-full flex items-center justify-center min-h-[260px] sm:min-h-[340px] max-h-[50vh] bg-slate-950/80 rounded-xl border border-slate-800 p-4 overflow-hidden">
              <div
                ref={containerRef}
                className="relative inline-block max-w-full max-h-[46vh] touch-none shadow-md"
                style={{
                  transform: `scale(${zoom})`,
                  transition: activeHandle ? 'none' : 'transform 0.15s ease',
                }}
              >
                {/* Background image to be cropped */}
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop Source"
                  crossOrigin="anonymous"
                  className="block max-h-[44vh] max-w-full object-contain pointer-events-none select-none rounded"
                  style={{
                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${
                      flipV ? -1 : 1
                    })`,
                    transition: activeHandle ? 'none' : 'transform 0.2s ease',
                  }}
                  onLoad={() => {
                    if (selectedRatio !== null) {
                      setCrop((prev) => applyAspectRatio(selectedRatio, prev));
                    }
                  }}
                />

                {/* Dark Shroud Overlay outside crop box */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `
                      linear-gradient(to right, rgba(0,0,0,0.6) ${crop.x * 100}%, transparent ${crop.x * 100}%),
                      linear-gradient(to left, rgba(0,0,0,0.6) ${(1 - (crop.x + crop.width)) * 100}%, transparent ${(1 - (crop.x + crop.width)) * 100}%),
                      linear-gradient(to bottom, rgba(0,0,0,0.6) ${crop.y * 100}%, transparent ${crop.y * 100}%),
                      linear-gradient(to top, rgba(0,0,0,0.6) ${(1 - (crop.y + crop.height)) * 100}%, transparent ${(1 - (crop.y + crop.height)) * 100}%)
                    `,
                  }}
                />

                {/* Interactive Crop Box */}
                <div
                  className={`absolute border-2 border-sky-400 bg-sky-400/10 cursor-move ${
                    activeHandle ? 'shadow-lg' : ''
                  }`}
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.width * 100}%`,
                    height: `${crop.height * 100}%`,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                >
                  {/* Rule of thirds grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-b border-white/60"></div>
                    <div className="border-r border-b border-white/60"></div>
                    <div className="border-b border-white/60"></div>
                    <div className="border-r border-b border-white/60"></div>
                    <div className="border-r border-b border-white/60"></div>
                    <div className="border-b border-white/60"></div>
                    <div className="border-r border-white/60"></div>
                    <div className="border-r border-white/60"></div>
                    <div></div>
                  </div>

                  {/* Corner Resize Handles */}
                  {/* NW */}
                  <div
                    className="absolute -top-2 -left-2 h-4 w-4 rounded-full bg-white border-2 border-sky-600 shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                  />
                  {/* NE */}
                  <div
                    className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-white border-2 border-sky-600 shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                    onPointerDown={(e) => handlePointerDown(e, 'ne')}
                  />
                  {/* SW */}
                  <div
                    className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-white border-2 border-sky-600 shadow-md cursor-nesw-resize hover:scale-125 transition-transform"
                    onPointerDown={(e) => handlePointerDown(e, 'sw')}
                  />
                  {/* SE */}
                  <div
                    className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-white border-2 border-sky-600 shadow-md cursor-nwse-resize hover:scale-125 transition-transform"
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                  />

                  {/* Edge Resize Handles */}
                  {/* N */}
                  <div
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-2.5 w-6 rounded-full bg-white border border-sky-600 shadow-xs cursor-ns-resize"
                    onPointerDown={(e) => handlePointerDown(e, 'n')}
                  />
                  {/* S */}
                  <div
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-2.5 w-6 rounded-full bg-white border border-sky-600 shadow-xs cursor-ns-resize"
                    onPointerDown={(e) => handlePointerDown(e, 's')}
                  />
                  {/* W */}
                  <div
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-6 rounded-full bg-white border border-sky-600 shadow-xs cursor-ew-resize"
                    onPointerDown={(e) => handlePointerDown(e, 'w')}
                  />
                  {/* E */}
                  <div
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-6 rounded-full bg-white border border-sky-600 shadow-xs cursor-ew-resize"
                    onPointerDown={(e) => handlePointerDown(e, 'e')}
                  />
                </div>
              </div>
            </div>

            {/* Live Invoice Preview Box */}
            <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Eye className="h-3.5 w-3.5 text-sky-400" />
                Live Invoice Header Preview
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white text-slate-900 border border-slate-200 min-h-[140px] shadow-inner text-center">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Cropped Preview"
                    className="max-h-20 max-w-full object-contain mb-1 drop-shadow-xs"
                  />
                ) : (
                  <div className="text-xs text-slate-400 italic">Adjusting crop...</div>
                )}
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mt-1">
                  Preview in Header
                </div>
                <div className="text-[9px] text-slate-400">Crisp output for PDF export</div>
              </div>

              {/* Quick Preset Ratios */}
              <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60 space-y-2">
                <span className="block text-[11px] font-semibold text-slate-300">
                  Aspect Ratio Presets
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {ASPECT_RATIOS.map((item) => {
                    const isSelected = selectedRatio === item.value;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleRatioSelect(item.value)}
                        className={`px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-sky-500 text-white shadow-xs'
                            : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {item.label}
                        <span className="block text-[9px] font-normal opacity-75">
                          {item.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Transform & Adjustment Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-800/60 border border-slate-800 px-3 py-2.5">
            {/* Rotation & Flip Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-[11px] font-medium text-slate-400 mr-1 hidden sm:inline">
                Orientation:
              </span>
              <button
                type="button"
                onClick={handleRotateCounterClockwise}
                className="flex items-center gap-1 rounded bg-slate-700/80 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                title="Rotate 90° counter-clockwise"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Rotate -90°</span>
              </button>
              <button
                type="button"
                onClick={handleRotateClockwise}
                className="flex items-center gap-1 rounded bg-slate-700/80 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                title="Rotate 90° clockwise"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Rotate +90°</span>
              </button>
              <button
                type="button"
                onClick={() => setFlipH((prev) => !prev)}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  flipH
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-700/80 text-slate-200 hover:bg-slate-700 hover:text-white'
                }`}
                title="Flip horizontally"
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Flip H</span>
              </button>
              <button
                type="button"
                onClick={() => setFlipV((prev) => !prev)}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  flipV
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-700/80 text-slate-200 hover:bg-slate-700 hover:text-white'
                }`}
                title="Flip vertically"
              >
                <FlipVertical className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Flip V</span>
              </button>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Zoom:</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
                className="rounded p-1 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <input
                type="range"
                min="0.6"
                max="2.2"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-20 sm:w-28 accent-sky-400 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.1).toFixed(2))))}
                className="rounded p-1 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="ml-1 flex items-center gap-1 rounded bg-slate-700/60 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                title="Reset all transformations"
              >
                <RefreshCw className="h-3 w-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                // Keep original image as logo without crop
                onSave(imageSrc);
                onClose();
              }}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors hidden sm:block"
            >
              Use Uncropped
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 px-5 py-2 text-xs font-bold text-white transition-all shadow-md active:scale-95"
            >
              <Check className="h-4 w-4" />
              Apply & Save Logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
