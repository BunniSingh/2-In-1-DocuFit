import React, { useRef, useState } from 'react';
import {
  Upload,
  Camera,
  Crop,
  Sliders,
  RotateCw,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Copy,
  Download,
  Plus,
  Move,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { CardPairItem, CardPairMargin, CardState, Language } from '../types';

interface UploadSectionProps {
  pairs: CardPairItem[];
  language: Language;
  onAddPair: () => void;
  onRemovePair: (pairId: string) => void;
  onUpdatePairLabel: (pairId: string, label: string) => void;
  onUpdatePairMargin: (pairId: string, margin: Partial<CardPairMargin>) => void;
  onFileSelect: (pairId: string, side: 'front' | 'back', file: File) => void;
  onOpenCrop: (pairId: string, side: 'front' | 'back') => void;
  onOpenAdjust: (pairId: string, side: 'front' | 'back') => void;
  onOpenCamera: (pairId: string, side: 'front' | 'back') => void;
  onQuickRotate: (pairId: string, side: 'front' | 'back') => void;
  onClearCardSide: (pairId: string, side: 'front' | 'back') => void;
  onClearPair: (pairId: string) => void;
  onInstantAutoCrop?: (pairId: string, side: 'front' | 'back') => void;
  onCopyFromSide?: (pairId: string, fromSide: 'front' | 'back', toSide: 'front' | 'back') => void;
  onDownloadSingle?: (pairId: string, side: 'front' | 'back') => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  pairs,
  language,
  onAddPair,
  onRemovePair,
  onUpdatePairLabel,
  onUpdatePairMargin,
  onFileSelect,
  onOpenCrop,
  onOpenAdjust,
  onOpenCamera,
  onQuickRotate,
  onClearCardSide,
  onClearPair,
  onInstantAutoCrop,
  onCopyFromSide,
  onDownloadSingle,
}) => {
  const isHi = language === 'hi';
  const [expandedMarginPairId, setExpandedMarginPairId] = useState<string | null>(null);
  const [dragActiveKey, setDragActiveKey] = useState<string | null>(null);
  const [showAddTooltip, setShowAddTooltip] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const maxPairsReached = pairs.length >= 4;

  const handleNudge = (
    pairId: string,
    field: keyof CardPairMargin,
    delta: number,
    currentVal: number,
    maxVal: number = 260
  ) => {
    const newVal = Math.max(0, Math.min(maxVal, currentVal + delta));
    onUpdatePairMargin(pairId, { [field]: newVal });
  };

  // Helper for single side upload box
  const renderCardSlot = (
    pair: CardPairItem,
    side: 'front' | 'back',
    sideLabel: string
  ) => {
    const key = `${pair.id}-${side}`;
    const cardState: CardState = side === 'front' ? pair.front : pair.back;
    const isCropped = Boolean(cardState.croppedImage);
    const isEnhanced = Boolean(cardState.enhancedImage);
    const hasOriginal = Boolean(cardState.originalImage);
    const displaySrc = cardState.enhancedImage || cardState.croppedImage || cardState.originalImage;
    const isReady = Boolean(cardState.enhancedImage || cardState.croppedImage);

    const otherSide: 'front' | 'back' = side === 'front' ? 'back' : 'front';
    const otherSideState: CardState = side === 'front' ? pair.back : pair.front;
    const canCopyOther = Boolean(otherSideState.originalImage && !hasOriginal);

    return (
      <div
        key={key}
        className={`relative flex flex-col rounded-xl border-2 transition-all p-3.5 bg-slate-50/60 dark:bg-slate-900/50 ${
          dragActiveKey === key
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-400/30'
            : isReady
              ? 'border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-300'
              : hasOriginal
                ? 'border-amber-200 dark:border-amber-800/60 hover:border-amber-300'
                : 'border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActiveKey(key);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActiveKey(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActiveKey(null);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(pair.id, side, e.dataTransfer.files[0]);
          }
        }}
      >
        {/* Slot Top Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide ${
                side === 'front'
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                  : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
              }`}
            >
              {sideLabel}
            </span>
            {isReady && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                {isHi ? 'तैयार' : 'Ready'}
              </span>
            )}
          </div>

          {/* Quick actions when image is present */}
          {hasOriginal && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onQuickRotate(pair.id, side)}
                title={isHi ? '90° घुमाएं (Rotate 90°)' : 'Rotate 90°'}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              {onDownloadSingle && isReady && (
                <button
                  type="button"
                  onClick={() => onDownloadSingle(pair.id, side)}
                  title={isHi ? 'HD कार्ड डाउनलोड करें' : 'Download HD Card'}
                  className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onClearCardSide(pair.id, side)}
                title={isHi ? 'हटाएं (Remove)' : 'Remove'}
                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={(el) => {
            fileInputRefs.current[key] = el;
          }}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onFileSelect(pair.id, side, e.target.files[0]);
              e.target.value = '';
            }
          }}
        />

        {/* Image Preview or Drop Zone */}
        {hasOriginal && displaySrc ? (
          <div className="relative group rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center min-h-[140px] max-h-[160px] border border-slate-200 dark:border-slate-700">
            <img
              src={displaySrc}
              alt={`${pair.label} ${side}`}
              className="w-full h-full object-contain max-h-[160px] select-none"
            />

            {/* Badges on preview */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isEnhanced && (
                <span className="px-1.5 py-0.5 rounded bg-blue-600/90 text-white text-[9px] font-bold shadow-xs">
                  {cardState.adjustments.mode.toUpperCase()}
                </span>
              )}
              {isCropped && !isEnhanced && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[9px] font-bold shadow-xs">
                  CROPPED
                </span>
              )}
            </div>

            {/* Hover actions overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => onOpenCrop(pair.id, side)}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>{isHi ? 'क्रॉप' : 'Crop'}</span>
              </button>

              {isCropped && (
                <button
                  type="button"
                  onClick={() => onOpenAdjust(pair.id, side)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isHi ? 'साफ करें' : 'Enhance'}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRefs.current[key]?.click()}
            className="flex flex-col items-center justify-center min-h-[135px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-3 text-center cursor-pointer hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5">
              <Upload className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isHi ? `${sideLabel} फ़ोटो चुनें` : `Upload ${sideLabel}`}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {isHi ? 'क्लिक करें या यहाँ खींचें' : 'Click or drop file'}
            </p>

            <div className="flex items-center gap-1.5 mt-2.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onOpenCamera(pair.id, side)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
              >
                <Camera className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{isHi ? 'कैमरा' : 'Camera'}</span>
              </button>

              {canCopyOther && onCopyFromSide && (
                <button
                  type="button"
                  onClick={() => onCopyFromSide(pair.id, otherSide, side)}
                  title={isHi ? 'सामने वाली फ़ोटो से कॉपी करें' : 'Copy from other side'}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[11px] font-medium border border-purple-200 dark:border-purple-800 cursor-pointer transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{isHi ? 'वही फ़ोटो' : 'Same photo'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action buttons below slot if image is loaded */}
        {hasOriginal && (
          <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpenCrop(pair.id, side)}
                className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200 dark:border-blue-800/80 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Crop className="w-3 h-3" />
                <span>{isHi ? '4-कोने क्रॉप' : '4-Corner Crop'}</span>
              </button>

              {onInstantAutoCrop && (
                <button
                  type="button"
                  onClick={() => onInstantAutoCrop(pair.id, side)}
                  title={isHi ? '1-क्लिक ऑटो-क्रॉप' : '1-Click Auto Crop'}
                  className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-800/80 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span className="hidden sm:inline">{isHi ? 'ऑटो' : 'Auto'}</span>
                </button>
              )}
            </div>

            {isCropped && (
              <button
                type="button"
                onClick={() => onOpenAdjust(pair.id, side)}
                className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800/80 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sliders className="w-3 h-3" />
                <span>{isHi ? 'ज़ेरॉक्स/साफ' : 'Xerox/Clear'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-5">
      {/* SECTION HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {isHi ? 'कार्ड पेयर अपलोड (अधिकतम 4 पेयर)' : 'ID Card Pairs Upload (Max 4 Pairs)'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isHi
              ? 'एक A4 पेज पर अधिकतम 4 पेयर (Front + Back) जोड़ें और प्रत्येक का अलग मार्जिन खुद सेट करें'
              : 'Add up to 4 pairs (Front + Back) on single A4 sheet with separate custom margins'}
          </p>
        </div>

        {/* Counter Badge & Dynamic Add Pair Button */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              {isHi
                ? `${pairs.length} / 4 पेयर (${pairs.length * 2} कार्ड)`
                : `${pairs.length} / 4 Pairs (${pairs.length * 2} cards)`}
            </span>
          </div>

          {/* DYNAMIC PLUS BUTTON WITH HOVER CAPTION */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={onAddPair}
              disabled={maxPairsReached}
              onMouseEnter={() => setShowAddTooltip(true)}
              onMouseLeave={() => setShowAddTooltip(false)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                maxPairsReached
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-blue-500/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isHi ? 'नया पेयर जोड़ें' : 'Add Pair'}</span>
            </button>

            {/* Hover Caption / Tooltip */}
            {showAddTooltip && (
              <div className="absolute right-0 top-full mt-2 w-64 z-40 p-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-normal shadow-xl border border-slate-700 animate-in fade-in zoom-in-95 pointer-events-none">
                <div className="font-semibold text-blue-300 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {maxPairsReached
                      ? isHi
                        ? 'अधिकतम सीमा पूर्ण'
                        : 'Maximum Pairs Reached'
                      : isHi
                        ? 'नया कार्ड पेयर जोड़ें'
                        : 'Add New Card Pair'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                  {maxPairsReached
                    ? isHi
                      ? 'एक A4 पेज पर अधिकतम 4 पेयर (8 कार्ड) की सीमा पूरी हो चुकी है।'
                      : 'Maximum 4 card pairs (8 ID cards) reached for a single A4 page.'
                    : isHi
                      ? '➕ अगला कार्ड पेयर (Front और Back) जोड़ें — एक A4 शीट पर अधिकतम 4 पेयर लगा सकते हैं।'
                      : '➕ Add another card pair (Front & Back) — up to 4 pairs on a single A4 sheet.'}
                </p>
                <div className="text-[10px] text-slate-400 mt-1">
                  {isHi ? 'वर्तमान: ' : 'Current: '}
                  {pairs.length}/4
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PAIRS LIST */}
      <div className="space-y-4">
        {pairs.map((pair, index) => {
          const isMarginOpen = expandedMarginPairId === pair.id;
          const frontReady = Boolean(pair.front.enhancedImage || pair.front.croppedImage);
          const backReady = Boolean(pair.back.enhancedImage || pair.back.croppedImage);
          const pairComplete = frontReady && backReady;

          return (
            <div
              key={pair.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors space-y-4"
            >
              {/* Pair Bar Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    P{index + 1}
                  </span>

                  {/* Editable Pair Title */}
                  <input
                    type="text"
                    value={pair.label}
                    onChange={(e) => onUpdatePairLabel(pair.id, e.target.value)}
                    placeholder={isHi ? `पेयर ${index + 1} (जैसे आधार कार्ड)` : `Pair ${index + 1} (e.g. Aadhaar)`}
                    className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 px-2 py-1 rounded-lg border border-transparent focus:border-blue-400 dark:focus:border-blue-500 outline-hidden transition-colors flex-1 max-w-xs truncate"
                  />

                  {pairComplete && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      {isHi ? 'पेयर पूर्ण' : 'Pair Ready'}
                    </span>
                  )}
                </div>

                {/* Right controls: Margin toggle & Pair remove */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {/* Margin Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setExpandedMarginPairId(isMarginOpen ? null : pair.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isMarginOpen
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>
                      {isHi ? 'मार्जिन (स्थिति mm)' : 'Margins (mm)'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {pair.margin.topMm}T / {pair.margin.leftMm}L
                    </span>
                    {isMarginOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Clear Pair images */}
                  {(pair.front.originalImage || pair.back.originalImage) && (
                    <button
                      type="button"
                      onClick={() => onClearPair(pair.id)}
                      title={isHi ? 'दोनों फ़ोटो साफ़ करें' : 'Clear both photos'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Remove Pair button (if > 1 pair) */}
                  {pairs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemovePair(pair.id)}
                      title={isHi ? 'यह पेयर हटाएं' : 'Remove this pair'}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* EXPANDABLE SEPARATE MARGIN CONTROLS FOR THIS PAIR */}
              {isMarginOpen && (
                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl p-3 sm:p-4 space-y-3 animate-in fade-in zoom-in-95 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-750 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <Move className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isHi ? `${pair.label} - अलग मार्जिन सेट करें` : `${pair.label} - Separate Margins`}</span>
                    </div>

                    {/* Independent Back toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                      <input
                        type="checkbox"
                        checked={pair.margin.independentBack}
                        onChange={(e) =>
                          onUpdatePairMargin(pair.id, {
                            independentBack: e.target.checked,
                            backTopMm: pair.margin.backTopMm || pair.margin.topMm,
                            backLeftMm: pair.margin.backLeftMm || pair.margin.leftMm + 94,
                          })
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{isHi ? 'बैक कार्ड का अलग मार्जिन सेट करें' : 'Custom Back Card Coordinates'}</span>
                    </label>
                  </div>

                  {/* Margin Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Top Margin (mm) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                        <span>{isHi ? 'ऊपरी मार्जिन (Top mm)' : 'Top Margin (mm)'}</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {pair.margin.topMm} mm
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleNudge(pair.id, 'topMm', -1, pair.margin.topMm)}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={240}
                          value={pair.margin.topMm}
                          onChange={(e) =>
                            onUpdatePairMargin(pair.id, { topMm: Number(e.target.value) || 0 })
                          }
                          className="flex-1 text-center font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleNudge(pair.id, 'topMm', 1, pair.margin.topMm)}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Left Margin (mm) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                        <span>{isHi ? 'बायां मार्जिन (Left mm)' : 'Front Left (mm)'}</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {pair.margin.leftMm} mm
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleNudge(pair.id, 'leftMm', -1, pair.margin.leftMm)}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={pair.margin.leftMm}
                          onChange={(e) =>
                            onUpdatePairMargin(pair.id, { leftMm: Number(e.target.value) || 0 })
                          }
                          className="flex-1 text-center font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleNudge(pair.id, 'leftMm', 1, pair.margin.leftMm)}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Gap between Front and Back */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                        <span>{isHi ? 'दोनों के बीच गैप (Gap mm)' : 'Gap Between (mm)'}</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {pair.margin.gapMm} mm
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleNudge(pair.id, 'gapMm', -1, pair.margin.gapMm)}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={40}
                          value={pair.margin.gapMm}
                          onChange={(e) =>
                            onUpdatePairMargin(pair.id, { gapMm: Number(e.target.value) || 0 })
                          }
                          className="flex-1 text-center font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleNudge(pair.id, 'gapMm', 1, pair.margin.gapMm)}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Independent Back Card Inputs (if enabled) */}
                  {pair.margin.independentBack && (
                    <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl space-y-2">
                      <div className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1">
                        <span>{isHi ? 'बैक साइड के स्वतंत्र निर्देशांक (Back Coordinates):' : 'Back Side Custom Coordinates:'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-600 dark:text-slate-400">
                            {isHi ? 'बैक Top (mm):' : 'Back Top (mm):'}
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={240}
                            value={pair.margin.backTopMm}
                            onChange={(e) =>
                              onUpdatePairMargin(pair.id, { backTopMm: Number(e.target.value) || 0 })
                            }
                            className="w-full mt-1 text-center font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 dark:text-slate-400">
                            {isHi ? 'बैक Left (mm):' : 'Back Left (mm):'}
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={120}
                            value={pair.margin.backLeftMm}
                            onChange={(e) =>
                              onUpdatePairMargin(pair.id, { backLeftMm: Number(e.target.value) || 0 })
                            }
                            className="w-full mt-1 text-center font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded py-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Row Presets for this pair */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="text-slate-500">{isHi ? 'त्वरित पंक्ति:' : 'Row presets:'}</span>
                    <button
                      type="button"
                      onClick={() => onUpdatePairMargin(pair.id, { topMm: 14, leftMm: 15, gapMm: 8 })}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                    >
                      Row 1 (14mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdatePairMargin(pair.id, { topMm: 78, leftMm: 15, gapMm: 8 })}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                    >
                      Row 2 (78mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdatePairMargin(pair.id, { topMm: 142, leftMm: 15, gapMm: 8 })}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                    >
                      Row 3 (142mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdatePairMargin(pair.id, { topMm: 206, leftMm: 15, gapMm: 8 })}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                    >
                      Row 4 (206mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdatePairMargin(pair.id, { leftMm: 62 })}
                      title={isHi ? 'कार्ड को पेज के बीच में रखें' : 'Align card horizontally in page center'}
                      className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-semibold cursor-pointer"
                    >
                      {isHi ? 'केंद्र (62mm)' : 'Center (62mm)'}
                    </button>
                  </div>
                </div>
              )}

              {/* PAIR CARDS: FRONT & BACK SIDE-BY-SIDE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {renderCardSlot(pair, 'front', isHi ? 'अग्र भाग (Front)' : 'Front Side')}
                {renderCardSlot(pair, 'back', isHi ? 'पृष्ठ भाग (Back)' : 'Back Side')}
              </div>
            </div>
          );
        })}

        {/* BOTTOM ADD PAIR SLOT WITH HOVER CAPTION (IF < 4 PAIRS) */}
        {!maxPairsReached ? (
          <div className="relative group">
            <button
              type="button"
              onClick={onAddPair}
              className="w-full border-2 border-dashed border-slate-300 dark:border-slate-750 hover:border-blue-500 dark:hover:border-blue-400 bg-white/60 dark:bg-slate-900/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 rounded-2xl p-6 sm:p-7 flex flex-col items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {isHi
                    ? `+ नया पेयर ${pairs.length + 1} जोड़ें (Front + Back)`
                    : `+ Add Card Pair ${pairs.length + 1} (Front + Back)`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isHi
                    ? `अधिकतम 4 पेयर प्रति पेज (वर्तमान: ${pairs.length}/4 पेयर)`
                    : `Maximum 4 pairs per A4 page (Current: ${pairs.length}/4 pairs)`}
                </p>
              </div>
            </button>

            {/* Hover Caption Tooltip at bottom button */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 whitespace-nowrap pointer-events-none z-30">
              <span>
                {isHi
                  ? `➕ पेयर ${pairs.length + 1} जोड़ें — एक A4 शीट पर अधिकतम 4 पेयर`
                  : `➕ Add Pair ${pairs.length + 1} — Up to 4 pairs per A4 page`}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {isHi
                ? '✓ पूरे 4 पेयर (8 कार्ड) A4 शीट पर व्यवस्थित हैं! अब नीचे लाइव शीट देखें या A4 PDF डाउनलोड करें।'
                : '✓ Full 4 pairs (8 cards) loaded onto this A4 sheet! Check live sheet preview or download A4 PDF.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
