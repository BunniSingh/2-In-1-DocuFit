import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  RotateCw,
  RotateCcw,
  Sparkles,
  Check,
  X,
  Maximize2,
  ZoomIn,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Point, Language } from '../types';
import { warpPerspective, autoDetectCardQuad } from '../utils/perspective';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  cardSide: 'front' | 'back';
  language: Language;
  onCropComplete: (croppedDataUrl: string, points: Point[]) => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  cardSide,
  language,
  onCropComplete,
}) => {
  const isHi = language === 'hi';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [points, setPoints] = useState<Point[]>([]);
  const [activePointIndex, setActivePointIndex] = useState<number>(-1);
  const [selectedCorner, setSelectedCorner] = useState<number>(0);
  const [nudgeStep, setNudgeStep] = useState<number>(2);
  const [loupeVisible, setLoupeVisible] = useState<boolean>(false);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load and initialize image
  const initializeCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.innerWidth < 640;
    const maxW = Math.min(window.innerWidth - (isMobile ? 24 : 48), 800);
    const maxH = Math.min(window.innerHeight * (isMobile ? 0.44 : 0.56), 560);

    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    canvas.width = w;
    canvas.height = h;

    // Run auto-detection
    const detected = autoDetectCardQuad(img, w, h);
    setPoints(detected);
    setSelectedCorner(0);
  }, []);

  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      initializeCanvas(img);
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc, initializeCanvas]);

  // Redraw canvas whenever points change
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || points.length !== 4) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw quadrilateral boundary
    ctx.strokeStyle = '#2563eb'; // blue-600
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < 4; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Fill quad translucent
    ctx.fillStyle = 'rgba(37, 99, 235, 0.16)';
    ctx.fill();

    // Draw corner handles
    const pointRadius = 15;
    const cornerLabels = ['TL 1', 'TR 2', 'BR 3', 'BL 4'];

    points.forEach((pt, idx) => {
      const isDragging = activePointIndex === idx;
      const isSelected = selectedCorner === idx;

      // Outer focus ring if active or selected
      if (isDragging || isSelected) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pointRadius + 7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.4)';
        ctx.fill();
      }

      // Handle circle
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pointRadius, 0, Math.PI * 2);
      ctx.fillStyle = isDragging ? '#3b82f6' : isSelected ? '#1d4ed8' : '#2563eb';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Number inside
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), pt.x, pt.y);

      // Label above/below handle
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = isSelected ? '#1d4ed8' : '#334155';
      const offsetY = idx < 2 ? -22 : 26;
      ctx.fillText(cornerLabels[idx], pt.x, pt.y + offsetY);
    });
  }, [points, activePointIndex, selectedCorner]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Pointer interactions
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    // On touch devices, give a generous 48px hit radius for easy finger pickup
    const isTouch = 'touches' in e;
    let minDist = isTouch ? 48 : 36;
    let nearestIdx = -1;

    points.forEach((pt, idx) => {
      const d = Math.hypot(pt.x - coords.x, pt.y - coords.y);
      if (d < minDist) {
        minDist = d;
        nearestIdx = idx;
      }
    });

    if (nearestIdx !== -1) {
      setActivePointIndex(nearestIdx);
      setSelectedCorner(nearestIdx);
      setLoupeVisible(true);
      setLoupePos(coords);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (activePointIndex === -1) return;
    const coords = getCanvasCoords(e);
    if (!coords || !canvasRef.current) return;

    // Prevent page scrolling while dragging on touch screens
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    const x = Math.max(0, Math.min(canvasRef.current.width, coords.x));
    const y = Math.max(0, Math.min(canvasRef.current.height, coords.y));

    setPoints((prev) => {
      const next = [...prev];
      next[activePointIndex] = { x, y };
      return next;
    });

    setLoupePos({ x, y });
  };

  const handlePointerUp = () => {
    setActivePointIndex(-1);
    setLoupeVisible(false);
  };

  // Nudge selected corner by dx, dy
  const handleNudge = (dx: number, dy: number) => {
    if (selectedCorner < 0 || selectedCorner >= points.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setPoints((prev) => {
      const next = [...prev];
      const cur = next[selectedCorner];
      const x = Math.max(0, Math.min(canvas.width, cur.x + dx));
      const y = Math.max(0, Math.min(canvas.height, cur.y + dy));
      next[selectedCorner] = { x, y };
      return next;
    });
  };

  // Auto detect again
  const handleAutoDetect = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const detected = autoDetectCardQuad(img, canvas.width, canvas.height);
    setPoints(detected);
  };

  // Reset to full bounding box
  const handleResetBox = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = 12;
    setPoints([
      { x: pad, y: pad },
      { x: canvas.width - pad, y: pad },
      { x: canvas.width - pad, y: canvas.height - pad },
      { x: pad, y: canvas.height - pad },
    ]);
  };

  // Rotate source image 90 deg clockwise or counter-clockwise
  const handleRotate = (clockwise: boolean) => {
    const img = imgRef.current;
    if (!img) return;

    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = img.height;
    rotCanvas.height = img.width;
    const rotCtx = rotCanvas.getContext('2d');
    if (!rotCtx) return;

    rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
    rotCtx.rotate((clockwise ? 90 : -90) * (Math.PI / 180));
    rotCtx.drawImage(img, -img.width / 2, -img.height / 2);

    const rotatedDataUrl = rotCanvas.toDataURL('image/jpeg', 0.98);
    const newImg = new Image();
    newImg.crossOrigin = 'anonymous';
    newImg.onload = () => {
      imgRef.current = newImg;
      initializeCanvas(newImg);
    };
    newImg.src = rotatedDataUrl;
  };

  // Perform perspective warp and save
  const handleSaveCrop = async () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || points.length !== 4) return;

    setIsProcessing(true);

    try {
      const scaleX = img.width / canvas.width;
      const scaleY = img.height / canvas.height;

      const origPoints: Point[] = points.map((p) => ({
        x: p.x * scaleX,
        y: p.y * scaleY,
      }));

      // ISO CR80 standard dimensions (86 x 54 mm = 1016 x 638 px @ 300DPI)
      const targetW = 1016;
      const targetH = 638;

      const croppedUrl = await warpPerspective(img, origPoints, targetW, targetH);
      onCropComplete(croppedUrl, origPoints);
      onClose();
    } catch (err) {
      console.error('Perspective warp failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="crop-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-2xl w-full h-[100dvh] sm:h-auto sm:max-h-[96vh] max-w-4xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-200 dark:border-blue-800 flex-shrink-0">
              {cardSide === 'front' ? '1' : '2'}
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {cardSide === 'front'
                  ? isHi
                    ? 'सामने का भाग (Front) - 4-कॉर्नर स्मार्ट क्रॉप'
                    : 'Front Side - 4-Corner Perspective Crop'
                  : isHi
                    ? 'पीछे का भाग (Back) - 4-कॉर्नर स्मार्ट क्रॉप'
                    : 'Back Side - 4-Corner Perspective Crop'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block">
                {isHi
                  ? 'कोनों को खींचें या नीचे दिए बटनों से 0.1mm सटीक सेट करें।'
                  : 'Drag corners or use arrow buttons for precision alignment.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 p-2 sm:p-4 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center overflow-auto relative select-none touch-none min-h-0">
          <div className="relative border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-md bg-slate-200 dark:bg-slate-900 touch-none">
            <canvas
              ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              className="cursor-crosshair block max-w-full max-h-[48vh] sm:max-h-[54vh] object-contain touch-none"
            />

            {/* Magnifier Loupe: 2.5x zoom on active corner */}
            {loupeVisible && activePointIndex !== -1 && imgRef.current && canvasRef.current && (
              <div
                className="absolute pointer-events-none rounded-full border-2 border-white shadow-2xl overflow-hidden z-30 bg-slate-900"
                style={{
                  width: '100px',
                  height: '100px',
                  left: `${Math.max(8, Math.min(canvasRef.current.width - 108, loupePos.x - 50))}px`,
                  top: `${Math.max(8, loupePos.y - 120)}px`,
                }}
              >
                <div className="relative w-full h-full">
                  <img
                    src={imgRef.current.src}
                    alt="zoom"
                    className="absolute max-w-none"
                    style={{
                      width: `${canvasRef.current.width * 2.5}px`,
                      height: `${canvasRef.current.height * 2.5}px`,
                      left: `${50 - loupePos.x * 2.5}px`,
                      top: `${50 - loupePos.y * 2.5}px`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-[1px] bg-blue-500 shadow-xs opacity-90" />
                    <div className="absolute h-full w-[1px] bg-blue-500 shadow-xs opacity-90" />
                    <div className="absolute w-3 h-3 rounded-full border border-blue-400 bg-blue-500/20" />
                  </div>
                  <div className="absolute bottom-1 right-2 text-[9px] font-bold text-white bg-slate-900/80 px-1 rounded">
                    2.5x
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400">
            <ZoomIn className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>
              {isHi
                ? 'टिप: कोनों को उंगली से खींचें या नीचे 1-4 कोने चुनकर तीरों (Arrows) से सेट करें।'
                : 'Tip: Drag pins or tap corners 1-4 below to nudge with arrows.'}
            </span>
          </div>
        </div>

        {/* Mobile-Friendly Precision Corner Selector & Nudge Bar */}
        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          {/* Corner Selector Buttons */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mr-0.5 hidden xs:inline">
              {isHi ? 'कोना:' : 'Corner:'}
            </span>
            {[
              { idx: 0, label: isHi ? '1: ऊपर-बाएँ' : '1: TL' },
              { idx: 1, label: isHi ? '2: ऊपर-दाएँ' : '2: TR' },
              { idx: 2, label: isHi ? '3: नीचे-दाएँ' : '3: BR' },
              { idx: 3, label: isHi ? '4: नीचे-बाएँ' : '4: BL' },
            ].map((c) => (
              <button
                key={c.idx}
                type="button"
                onClick={() => setSelectedCorner(c.idx)}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  selectedCorner === c.idx
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Precision 4-Way Nudge Arrows */}
          <div className="flex items-center gap-1">
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleNudge(-nudgeStep, 0)}
                className="p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer active:scale-95"
                title={isHi ? 'बाएँ खिसकाएँ' : 'Nudge Left'}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleNudge(0, -nudgeStep)}
                className="p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer active:scale-95"
                title={isHi ? 'ऊपर खिसकाएँ' : 'Nudge Up'}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleNudge(0, nudgeStep)}
                className="p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer active:scale-95"
                title={isHi ? 'नीचे खिसकाएँ' : 'Nudge Down'}
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleNudge(nudgeStep, 0)}
                className="p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer active:scale-95"
                title={isHi ? 'दाएँ खिसकाएँ' : 'Nudge Right'}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Step size toggle */}
            <button
              type="button"
              onClick={() => setNudgeStep((s) => (s === 2 ? 6 : 2))}
              className="px-2 py-1 text-[11px] font-bold rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer min-h-[36px]"
              title={isHi ? 'मूव स्पीड बदलें' : 'Toggle step speed'}
            >
              {nudgeStep === 2 ? '1px' : '5px'}
            </button>
          </div>
        </div>

        {/* Toolbar & Final Actions */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          {/* Quick Tools */}
          <div className="flex items-center flex-wrap gap-1.5">
            <button
              type="button"
              onClick={handleAutoDetect}
              className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 min-h-[38px]"
              title={isHi ? 'ऑटो कार्ड बाउंड्री पहचानें' : 'Auto detect card boundary'}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isHi ? 'ऑटो-डिटेक्ट' : 'Auto Detect'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleRotate(false)}
              className="px-2 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer active:scale-95 min-h-[38px]"
              title={isHi ? '90° बाएँ घुमाएँ' : 'Rotate -90°'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>-90°</span>
            </button>

            <button
              type="button"
              onClick={() => handleRotate(true)}
              className="px-2 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer active:scale-95 min-h-[38px]"
              title={isHi ? '90° दाएँ घुमाएँ' : 'Rotate +90°'}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>+90°</span>
            </button>

            <button
              type="button"
              onClick={handleResetBox}
              className="px-2 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer active:scale-95 min-h-[38px]"
              title={isHi ? 'पूरा बॉक्स रिसेट करें' : 'Full box reset'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{isHi ? 'पूरा बॉक्स' : 'Full'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer min-h-[40px]"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={isProcessing}
              className="px-4 sm:px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 min-h-[40px]"
            >
              <Check className="w-4 h-4" />
              <span>
                {isProcessing
                  ? isHi
                    ? 'क्रॉप हो रहा है...'
                    : 'Cropping...'
                  : isHi
                    ? '✓ क्रॉप & सेव करें'
                    : 'Crop & Save'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
