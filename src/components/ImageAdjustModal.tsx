import React, { useState, useEffect } from 'react';
import { Sliders, Sun, Contrast, Zap, Check, X, Undo } from 'lucide-react';
import { ImageAdjustments, Language } from '../types';
import { applyImageEnhancements } from '../utils/imageProcessing';

interface ImageAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  cardSide: 'front' | 'back';
  language: Language;
  initialAdjustments?: ImageAdjustments;
  currentAdjustments?: ImageAdjustments;
  onSave: (adjustedDataUrl: string, adjustments: ImageAdjustments) => void;
}

export const ImageAdjustModal: React.FC<ImageAdjustModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  cardSide,
  language,
  initialAdjustments,
  currentAdjustments,
  onSave,
}) => {
  const isHi = language === 'hi';
  const effectiveInitial = currentAdjustments || initialAdjustments;

  const [adjustments, setAdjustments] = useState<ImageAdjustments>(
    effectiveInitial || {
      mode: 'original',
      brightness: 0,
      contrast: 0,
      sharpness: false,
    }
  );

  const [previewSrc, setPreviewSrc] = useState<string>(imageSrc);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Sync initial adjustments when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialAdjustments) {
        setAdjustments(initialAdjustments);
      }
      setPreviewSrc(imageSrc);
    }
  }, [isOpen, initialAdjustments, imageSrc]);

  // Live filter preview with debounce
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    setIsUpdating(true);
    const timer = setTimeout(async () => {
      try {
        const processed = await applyImageEnhancements(imageSrc, adjustments);
        setPreviewSrc(processed);
      } catch (err) {
        console.error('Image adjustment error:', err);
      } finally {
        setIsUpdating(false);
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [isOpen, imageSrc, adjustments]);

  const handleModeChange = (mode: ImageAdjustments['mode']) => {
    setAdjustments((prev) => ({ ...prev, mode }));
  };

  const handleReset = () => {
    setAdjustments({
      mode: 'original',
      brightness: 0,
      contrast: 0,
      sharpness: false,
    });
  };

  const handleApply = () => {
    onSave(previewSrc, adjustments);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {cardSide === 'front'
                  ? isHi
                    ? 'सामने का भाग - फ़ोटो व टेक्स्ट साफ़ करें'
                    : 'Front Side - Document & Text Cleanup'
                  : isHi
                    ? 'पीछे का भाग - फ़ोटो व टेक्स्ट साफ़ करें'
                    : 'Back Side - Document & Text Cleanup'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isHi
                  ? 'ग्रे या पीलापन हटाएँ, अक्षरों को गहरा और स्पष्ट बनाएँ'
                  : 'Remove paper shadows and enhance text sharpness'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          {/* Live Preview Card */}
          <div className="flex flex-col items-center">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 max-w-sm w-full shadow-xs aspect-[1.586/1] flex items-center justify-center">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt="Adjusted Preview"
                  className="w-full h-full object-cover"
                />
              ) : null}
              {isUpdating && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
                  <span className="text-xs font-semibold text-white bg-slate-900/90 px-3 py-1 rounded-full border border-slate-700 animate-pulse">
                    {isHi ? 'अपडेट हो रहा है...' : 'Updating...'}
                  </span>
                </div>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              {isHi
                ? 'लाइव प्रिव्यू: बदलाव तुरंत दिखाई देंगे'
                : 'Live Preview: changes reflect in real-time'}
            </span>
          </div>

          {/* Preset Modes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              {isHi ? 'प्रिंट मोड चुनें (Mode)' : 'Select Mode'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Original */}
              <button
                type="button"
                onClick={() => handleModeChange('original')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  adjustments.mode === 'original'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>📷</span>
                <span>{isHi ? 'ओरिजिनल' : 'Original'}</span>
              </button>

              {/* Document Clean */}
              <button
                type="button"
                onClick={() => handleModeChange('document')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  adjustments.mode === 'document'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>✨</span>
                <span>{isHi ? 'साफ़ दस्तावेज़' : 'Doc Clean'}</span>
              </button>

              {/* High Contrast */}
              <button
                type="button"
                onClick={() => handleModeChange('high-contrast')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  adjustments.mode === 'high-contrast'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🔥</span>
                <span>{isHi ? 'गहरा प्रिंट' : 'High Contrast'}</span>
              </button>

              {/* B&W Xerox */}
              <button
                type="button"
                onClick={() => handleModeChange('xerox')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  adjustments.mode === 'xerox'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🖨️</span>
                <span>{isHi ? 'ब्लैक & वाइट' : 'B&W Xerox'}</span>
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
            {/* Brightness */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  {isHi ? 'ब्राइटनेस (उजाला)' : 'Brightness'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono">
                  {adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={adjustments.brightness}
                onChange={(e) =>
                  setAdjustments((prev) => ({ ...prev, brightness: Number(e.target.value) }))
                }
                className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Contrast className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {isHi ? 'कंट्रास्ट' : 'Contrast'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono">
                  {adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={adjustments.contrast}
                onChange={(e) =>
                  setAdjustments((prev) => ({ ...prev, contrast: Number(e.target.value) }))
                }
                className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Sharpen Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-semibold">
                <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isHi ? 'अक्षर शार्प करें (Text Sharpening)' : 'Sharp Text Filter'}
              </span>
              <button
                type="button"
                onClick={() =>
                  setAdjustments((prev) => ({ ...prev, sharpness: !prev.sharpness }))
                }
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  adjustments.sharpness ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    adjustments.sharpness ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Undo className="w-3.5 h-3.5" />
            <span>{isHi ? 'डिफ़ॉल्ट सेट करें' : 'Reset'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isHi ? 'लागू करें' : 'Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
