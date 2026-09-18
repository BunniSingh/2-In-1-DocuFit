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
} from 'lucide-react';
import { CardState, Language } from '../types';

interface UploadSectionProps {
  frontCard: CardState;
  backCard: CardState;
  language: Language;
  onFileSelect: (side: 'front' | 'back', file: File) => void;
  onOpenCrop: (side: 'front' | 'back') => void;
  onOpenAdjust: (side: 'front' | 'back') => void;
  onOpenCamera: (side: 'front' | 'back') => void;
  onQuickRotate: (side: 'front' | 'back') => void;
  onClearCard: (side: 'front' | 'back') => void;
  onInstantAutoCrop?: (side: 'front' | 'back') => void;
  onUseSameImageForOtherSide?: (fromSide: 'front' | 'back') => void;
  onDownloadSingle?: (side: 'front' | 'back') => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  frontCard,
  backCard,
  language,
  onFileSelect,
  onOpenCrop,
  onOpenAdjust,
  onOpenCamera,
  onQuickRotate,
  onClearCard,
  onInstantAutoCrop,
  onUseSameImageForOtherSide,
  onDownloadSingle,
}) => {
  const isHi = language === 'hi';
  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);

  const [dragActiveSide, setDragActiveSide] = useState<'front' | 'back' | null>(null);

  const renderCardBox = (
    side: 'front' | 'back',
    state: CardState,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    const isFront = side === 'front';
    const isDragActive = dragActiveSide === side;
    const title = isFront
      ? isHi
        ? '1. सामने का भाग (Front Side)'
        : '1. Front Side'
      : isHi
        ? '2. पीछे का भाग (Back Side)'
        : '2. Back Side';

    const displayImage = state.enhancedImage || state.croppedImage;
    const otherSideHasImage = isFront ? Boolean(backCard.originalImage) : Boolean(frontCard.originalImage);

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActiveSide(null);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileSelect(side, e.dataTransfer.files[0]);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActiveSide(side);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActiveSide(null);
    };

    return (
      <div
        className={`w-full sm:flex-1 sm:min-w-[280px] max-w-md bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md flex flex-col items-center text-center transition-all ${
          isDragActive
            ? 'border-blue-500 ring-4 ring-blue-500/15 bg-blue-50/20 dark:bg-blue-950/20'
            : displayImage
              ? 'border-emerald-200 dark:border-emerald-500/30'
              : 'border-slate-200 dark:border-slate-800'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Title Header */}
        <div className="w-full flex items-center justify-between mb-3.5">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                displayImage
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
              }`}
            >
              {isFront ? '1' : '2'}
            </span>
            {title}
          </h3>

          {displayImage ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isHi ? 'तैयार' : 'Ready'}
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {isHi ? 'फ़ोटो जोड़ें' : 'Add Photo'}
            </span>
          )}
        </div>

        {/* Card Preview Area */}
        <div
          onClick={() => {
            if (!displayImage) inputRef.current?.click();
          }}
          className={`w-full aspect-[1.586/1] bg-slate-50 dark:bg-slate-950/70 rounded-xl border-2 border-dashed transition-all flex items-center justify-center overflow-hidden relative group ${
            displayImage
              ? 'border-slate-200 dark:border-slate-700 cursor-default'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-slate-900/50 cursor-pointer'
          }`}
        >
          {displayImage ? (
            <>
              <img
                src={displayImage}
                alt={`${side} preview`}
                className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
              />
              {/* Overlay Hover Shortcut Bar */}
              <div className="absolute inset-0 bg-slate-900/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 backdrop-blur-xs">
                <span className="text-xs font-semibold text-white">
                  {isHi ? 'क्विक टूल्स' : 'Quick Tools'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => onOpenCrop(side)}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-blue-600 transition-colors shadow-md cursor-pointer"
                    title={isHi ? '4-कॉर्नर पर्सपेक्टिव क्रॉप' : 'Re-crop 4 corners'}
                  >
                    <Crop className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAdjust(side)}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-emerald-600 transition-colors shadow-md cursor-pointer"
                    title={isHi ? 'दस्तावेज़ साफ़ व ज़ेरॉक्स मोड' : 'Enhance & Clean'}
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickRotate(side)}
                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-amber-600 transition-colors shadow-md cursor-pointer"
                    title={isHi ? '90° घुमाएँ' : 'Rotate 90°'}
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  {onDownloadSingle && (
                    <button
                      type="button"
                      onClick={() => onDownloadSingle(side)}
                      className="p-2 rounded-lg bg-white/10 text-white hover:bg-sky-600 transition-colors shadow-md cursor-pointer"
                      title={isHi ? 'HD कार्ड डाउनलोड' : 'Download HD Card'}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-slate-500 dark:text-slate-400 gap-2 select-none">
              <div className="w-12 h-12 rounded-full bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {isHi ? 'फ़ोटो यहाँ खींच कर लाएं या क्लिक करें' : 'Drop photo here or click to browse'}
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  JPG, PNG, WEBP, HEIC
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onFileSelect(side, e.target.files[0]);
            }
          }}
        />

        {/* Action Controls Below Card */}
        <div className="w-full mt-4 space-y-2.5">
          {!displayImage ? (
            <div className="flex items-center gap-2">
              {/* File Select Button */}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isHi ? 'फ़ोटो चुनें' : 'Select Photo'}</span>
              </button>

              {/* Camera Snap Button */}
              <button
                type="button"
                onClick={() => onOpenCamera(side)}
                className="py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                title={isHi ? 'कैमरे से फ़ोटो खींचें' : 'Take photo with camera'}
              >
                <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span className="hidden sm:inline">{isHi ? 'कैमरा' : 'Camera'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* 4 Primary Action Buttons When Card is Ready */}
              <div className="w-full grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenCrop(side)}
                  className="min-h-[44px] py-2 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors active:scale-95"
                  title={isHi ? '4-कॉर्नर एडजस्ट करें' : 'Manual 4-corner crop'}
                >
                  <Crop className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{isHi ? 'क्रॉप' : 'Crop'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAdjust(side)}
                  className="min-h-[44px] py-2 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors active:scale-95"
                  title={isHi ? 'दस्तावेज़ साफ़ व ज़ेरॉक्स मोड' : 'Document clean & enhance'}
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isHi ? 'साफ़ करें' : 'Clean'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onQuickRotate(side)}
                  className="min-h-[44px] py-2 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors active:scale-95"
                  title={isHi ? '90° दाएँ घुमाएँ' : 'Rotate 90 degrees'}
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => onClearCard(side)}
                  className="min-h-[44px] py-2 px-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors active:scale-95"
                  title={isHi ? 'हटाएं' : 'Remove card'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isHi ? 'हटाएं' : 'Delete'}</span>
                </button>
              </div>

              {/* Instant Auto-Crop Shortcut Button */}
              {onInstantAutoCrop && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onInstantAutoCrop(side)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    title={isHi ? 'एक क्लिक में ऑटो-डिटेक्ट व क्रॉप करें' : '1-click edge detection and auto crop'}
                  >
                    <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>{isHi ? '1-क्लिक ऑटो-क्रॉप' : 'Auto-Crop'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium cursor-pointer transition-all"
                    title={isHi ? 'दूसरी फ़ोटो चुनें' : 'Change photo'}
                  >
                    <span>{isHi ? 'बदलें' : 'Change'}</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Quick Helper: Same photo for other side */}
          {state.originalImage && !otherSideHasImage && onUseSameImageForOtherSide && (
            <button
              type="button"
              onClick={() => onUseSameImageForOtherSide(side)}
              className="w-full py-2 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-200 dark:border-amber-800/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title={
                isHi
                  ? 'यदि एक ही फ़ोटो में दोनों साइड हैं तो यह दबाएं'
                  : 'If single photo contains both sides, click to use for other side too'
              }
            >
              <Copy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>
                {isFront
                  ? isHi
                    ? 'पीछे के लिए भी यही फ़ोटो इस्तेमाल करें'
                    : 'Use same photo for Back side too'
                  : isHi
                    ? 'सामने के लिए भी यही फ़ोटो इस्तेमाल करें'
                    : 'Use same photo for Front side too'}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* Upload Boxes Container */}
      <div className="w-full flex flex-wrap justify-center gap-4 sm:gap-6">
        {renderCardBox('front', frontCard, frontInputRef)}
        {renderCardBox('back', backCard, backInputRef)}
      </div>

      {/* Cyber Cafe Quick Tip */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span>
          {isHi
            ? 'टिप: यदि एक ही फोटो में फ्रंट व बैक दोनों हैं, तो "पीछे के लिए भी यही फ़ोटो इस्तेमाल करें" पर क्लिक करें।'
            : 'Tip: If one photo contains both front and back, use "Use same photo for Back".'}
        </span>
      </div>
    </div>
  );
};
