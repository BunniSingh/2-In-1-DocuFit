import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  FileDown,
  Download,
  Scissors,
  Layers,
  LayoutGrid,
  Columns2,
  Rows2,
  Maximize,
  CheckCircle2,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Info,
  Move,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { CardItem, CardMargin, CardPairItem, CardPairMargin, CardState, PrintSettings, Language, RenderCardItem } from '../types';
import { getFlatCardsFromPairs } from '../utils/pairUtils';

interface PrintSheetProps {
  pairs?: CardPairItem[];
  cards?: CardItem[];
  frontCard?: CardState;
  backCard?: CardState;
  settings: PrintSettings;
  language: Language;
  onUpdateSettings: (newSettings: Partial<PrintSettings>) => void;
  onUpdatePairMargin?: (pairId: string, margin: Partial<CardPairMargin>) => void;
  onUpdateCardMargin?: (id: string, margin: Partial<CardMargin>) => void;
  onPrint: () => void;
  onDownloadPdf: () => Promise<void>;
  onDownloadSingle: (idOrSide: string) => void;
  onDownloadFullSheet: () => Promise<void> | void;
}

export const PrintSheet: React.FC<PrintSheetProps> = ({
  pairs,
  cards,
  frontCard,
  backCard,
  settings,
  language,
  onUpdateSettings,
  onUpdatePairMargin,
  onUpdateCardMargin,
  onPrint,
  onDownloadPdf,
  onDownloadSingle,
  onDownloadFullSheet,
}) => {
  const isHi = language === 'hi';

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [sheetScale, setSheetScale] = useState<'fit' | '100'>('fit');
  const [fitScale, setFitScale] = useState<number>(1);
  const [activeMarginPairId, setActiveMarginPairId] = useState<string>(
    pairs && pairs[0] ? pairs[0].id : 'pair-1'
  );
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync activeMarginPairId if pairs change
  useEffect(() => {
    if (pairs && pairs.length > 0 && !pairs.some((p) => p.id === activeMarginPairId)) {
      setActiveMarginPairId(pairs[0].id);
    }
  }, [pairs, activeMarginPairId]);

  // Calculate fit scale so A4 (794px width) fits on mobile phones without horizontal overflow
  useEffect(() => {
    const updateScale = () => {
      if (!previewContainerRef.current) return;
      const containerWidth = previewContainerRef.current.clientWidth - 16;
      const a4PixelWidth = 794; // 210mm @ 96DPI
      if (containerWidth < a4PixelWidth) {
        const calculated = Math.max(0.32, Math.min(1, containerWidth / a4PixelWidth));
        setFitScale(calculated);
      } else {
        setFitScale(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleDownloadPdfWithState = async () => {
    setIsGeneratingPdf(true);
    try {
      await onDownloadPdf();
      showToast(isHi ? 'A4 PDF सफलतापूर्वक डाउनलोड हो गया!' : 'A4 PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadFullSheetWithState = async () => {
    setIsGeneratingPng(true);
    try {
      await onDownloadFullSheet();
      showToast(isHi ? 'HD A4 इमेज सफलतापूर्वक डाउनलोड हो गई!' : 'HD A4 Image downloaded successfully!');
    } catch (err) {
      console.error('Sheet PNG error:', err);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // Nudge margin for active pair
  const handleNudgePair = (
    pairId: string,
    field: keyof CardPairMargin,
    delta: number,
    currentVal: number,
    maxVal: number = 260
  ) => {
    if (!onUpdatePairMargin) return;
    const newVal = Math.max(0, Math.min(maxVal, currentVal + delta));
    onUpdatePairMargin(pairId, { [field]: newVal });
  };

  // Auto-arrange all pairs onto A4 sheet
  const handleAutoArrangePairs = (mode: 'standard-4-rows' | 'compact-rows' | 'centered') => {
    if (!onUpdatePairMargin || !pairs) return;

    if (mode === 'standard-4-rows') {
      const rowTops = [14, 78, 142, 206];
      pairs.forEach((pair, idx) => {
        const top = rowTops[idx] ?? 14 + idx * 64;
        onUpdatePairMargin(pair.id, {
          topMm: top,
          leftMm: 15,
          gapMm: 8,
          independentBack: false,
          backTopMm: top,
          backLeftMm: 109,
        });
      });
      showToast(isHi ? '4 पेयर मानक पंक्तियों में व्यवस्थित' : '4 Pairs arranged in standard 4 rows');
    } else if (mode === 'compact-rows') {
      const rowTops = [12, 70, 128, 186];
      pairs.forEach((pair, idx) => {
        const top = rowTops[idx] ?? 12 + idx * 58;
        onUpdatePairMargin(pair.id, {
          topMm: top,
          leftMm: 15,
          gapMm: 8,
          independentBack: false,
          backTopMm: top,
          backLeftMm: 109,
        });
      });
      showToast(isHi ? 'कॉम्पैक्ट लेआउट सेट किया गया' : 'Compact row layout set');
    } else if (mode === 'centered') {
      pairs.forEach((pair, idx) => {
        const rowTops = [14, 78, 142, 206];
        const top = rowTops[idx] ?? 14 + idx * 64;
        onUpdatePairMargin(pair.id, {
          topMm: top,
          leftMm: 15,
          gapMm: 8,
        });
      });
      showToast(isHi ? 'पेयर्स क्षैतिज रूप से केंद्रित' : 'Pairs centered horizontally');
    }
  };

  const isGrayscale = settings.grayscalePrint;

  // Flattened cards for rendering (removes empty reserved space and auto-centers single/odd cards)
  const flatCards: (CardItem | RenderCardItem)[] = pairs && pairs.length > 0
    ? getFlatCardsFromPairs(pairs, settings.cardWidthMm, {
        autoCenterOdd: settings.autoCenterOddCard !== false,
        onlyWithImages: true,
      })
    : cards || [];

  const activePair = pairs?.find((p) => p.id === activeMarginPairId);

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-semibold text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300 border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Print Controls Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 no-print transition-colors">
        {/* Top Bar with Primary Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isHi ? 'A4 प्रिंट व PDF एक्सपोर्ट' : 'A4 Print & PDF Export'}
              </h3>
              {flatCards.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {flatCards.length === 1 ? (
                    <span>{isHi ? '1 कार्ड: 62mm केंद्र में' : '1 Card: Centered (62mm)'}</span>
                  ) : flatCards.length === 3 ? (
                    <span>{isHi ? '3 कार्ड: 3रा कार्ड 62mm केंद्र में' : '3 Cards: 3rd Card Centered (62mm)'}</span>
                  ) : flatCards.length % 2 === 1 ? (
                    <span>{isHi ? `${flatCards.length} कार्ड: आखिरी कार्ड 62mm केंद्र में` : `${flatCards.length} Cards: Last Card Centered (62mm)`}</span>
                  ) : (
                    <span>{isHi ? `${flatCards.length} कार्ड: पेयर्स (15 & 109mm)` : `${flatCards.length} Cards: Paired (15 & 109mm)`}</span>
                  )}
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                    • {isHi ? '0 रिज़र्व स्पेस' : '0 Reserved Space'}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-medium border border-slate-200 dark:border-slate-700">
                  {isHi ? '0 रिज़र्व स्पेस (पेज खाली)' : '0 Reserved Space (Clean Page)'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isHi
                ? 'एक A4 पेज पर 4 पेयर तक | सटीक 86×54mm वास्तविक कार्ड आकार | अलग मार्जिन'
                : 'Up to 4 Card Pairs per A4 Page | 100% exact 86×54mm size | Separate margins'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Direct Print Button */}
            <button
              type="button"
              id="print-sheet-btn"
              onClick={onPrint}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isHi ? 'प्रिंट निकालें (Ctrl + P)' : 'Print Sheet (Ctrl+P)'}</span>
            </button>

            {/* A4 PDF Download Button */}
            <button
              type="button"
              id="download-pdf-btn"
              onClick={handleDownloadPdfWithState}
              disabled={isGeneratingPdf}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/70 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>
                {isGeneratingPdf
                  ? isHi
                    ? 'PDF तैयार हो रहा है...'
                    : 'Generating PDF...'
                  : isHi
                    ? 'A4 PDF डाउनलोड'
                    : 'Download A4 PDF'}
              </span>
            </button>

            {/* A4 High-Res Image Button */}
            <button
              type="button"
              id="download-sheet-png-btn"
              onClick={handleDownloadFullSheetWithState}
              disabled={isGeneratingPng}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title={isHi ? '300 DPI A4 शीट PNG' : 'Download 300 DPI A4 Sheet PNG'}
            >
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{isGeneratingPng ? '...' : isHi ? 'A4 इमेज (PNG)' : 'A4 Image'}</span>
            </button>
          </div>
        </div>

        {/* PAIR MARGINS MANUAL CONTROLS SECTION */}
        {pairs && pairs.length > 0 && onUpdatePairMargin && (
          <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {isHi ? 'प्रत्येक पेयर का अलग मार्जिन (Manual Margins per Pair)' : 'Individual Pair Margins (Set Manually)'}
                </h4>
              </div>

              {/* 1-Click Auto Arrange Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">
                  {isHi ? 'त्वरित लेआउट:' : 'Quick Layout:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleAutoArrangePairs('standard-4-rows')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer shadow-2xs"
                >
                  {isHi ? 'मानक 4 पंक्तियाँ' : 'Standard 4 Rows'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoArrangePairs('compact-rows')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer shadow-2xs"
                >
                  {isHi ? 'कॉम्पैक्ट' : 'Compact'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoArrangePairs('centered')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer shadow-2xs"
                >
                  {isHi ? 'केंद्रित' : 'Centered'}
                </button>
              </div>
            </div>

            {/* Pair Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {pairs.map((p, idx) => {
                const isSelected = p.id === activeMarginPairId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveMarginPairId(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{p.label || `Pair ${idx + 1}`}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {p.margin.topMm}T / {p.margin.leftMm}L
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Pair Margin Inputs */}
            {activePair && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>{activePair.label} ({isHi ? 'निर्देशांक mm' : 'Coordinates in mm'})</span>
                  </span>

                  {/* Independent Back toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                    <input
                      type="checkbox"
                      checked={activePair.margin.independentBack}
                      onChange={(e) =>
                        onUpdatePairMargin(activePair.id, {
                          independentBack: e.target.checked,
                          backTopMm: activePair.margin.backTopMm || activePair.margin.topMm,
                          backLeftMm: activePair.margin.backLeftMm || activePair.margin.leftMm + 94,
                        })
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{isHi ? 'बैक कार्ड अलग स्थिति में रखें' : 'Custom Back Card Coordinates'}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Top Margin */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <span>{isHi ? 'ऊपरी मार्जिन (Top mm)' : 'Top Margin (mm)'}</span>
                      <span className="font-bold text-blue-600">{activePair.margin.topMm} mm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleNudgePair(activePair.id, 'topMm', -1, activePair.margin.topMm)
                        }
                        className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={250}
                        value={activePair.margin.topMm}
                        onChange={(e) =>
                          onUpdatePairMargin(activePair.id, { topMm: Number(e.target.value) || 0 })
                        }
                        className="flex-1 text-center font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleNudgePair(activePair.id, 'topMm', 1, activePair.margin.topMm)
                        }
                        className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Left Margin */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <span>{isHi ? 'बायां मार्जिन (Left mm)' : 'Left Margin (mm)'}</span>
                      <span className="font-bold text-blue-600">{activePair.margin.leftMm} mm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleNudgePair(activePair.id, 'leftMm', -1, activePair.margin.leftMm, 120)
                        }
                        className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={activePair.margin.leftMm}
                        onChange={(e) =>
                          onUpdatePairMargin(activePair.id, { leftMm: Number(e.target.value) || 0 })
                        }
                        className="flex-1 text-center font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleNudgePair(activePair.id, 'leftMm', 1, activePair.margin.leftMm, 120)
                        }
                        className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Gap Between Front & Back */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      <span>{isHi ? 'गैप (Gap mm)' : 'Gap Between (mm)'}</span>
                      <span className="font-bold text-blue-600">{activePair.margin.gapMm} mm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleNudgePair(activePair.id, 'gapMm', -1, activePair.margin.gapMm, 40)
                        }
                        className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={activePair.margin.gapMm}
                        onChange={(e) =>
                          onUpdatePairMargin(activePair.id, { gapMm: Number(e.target.value) || 0 })
                        }
                        className="flex-1 text-center font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleNudgePair(activePair.id, 'gapMm', 1, activePair.margin.gapMm, 40)
                        }
                        className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Independent Back inputs */}
                {activePair.margin.independentBack && (
                  <div className="p-2.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {isHi ? 'बैक Top (mm):' : 'Back Top (mm):'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={250}
                        value={activePair.margin.backTopMm}
                        onChange={(e) =>
                          onUpdatePairMargin(activePair.id, { backTopMm: Number(e.target.value) || 0 })
                        }
                        className="w-full mt-1 text-center font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-purple-200 rounded py-1 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {isHi ? 'बैक Left (mm):' : 'Back Left (mm):'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={activePair.margin.backLeftMm}
                        onChange={(e) =>
                          onUpdatePairMargin(activePair.id, { backLeftMm: Number(e.target.value) || 0 })
                        }
                        className="w-full mt-1 text-center font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-purple-200 rounded py-1 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Quick Row Presets for activePair */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-slate-500 font-medium">{isHi ? 'त्वरित प्रीसेट:' : 'Presets:'}</span>
                  <button
                    type="button"
                    onClick={() => onUpdatePairMargin(activePair.id, { topMm: 14, leftMm: 15, gapMm: 8 })}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    Row 1 (14mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePairMargin(activePair.id, { topMm: 78, leftMm: 15, gapMm: 8 })}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    Row 2 (78mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePairMargin(activePair.id, { topMm: 142, leftMm: 15, gapMm: 8 })}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    Row 3 (142mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePairMargin(activePair.id, { topMm: 206, leftMm: 15, gapMm: 8 })}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    Row 4 (206mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePairMargin(activePair.id, { leftMm: 62 })}
                    title={isHi ? 'कार्ड को क्षैतिज केंद्र में रखें' : 'Align card horizontally in page center'}
                    className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-semibold cursor-pointer"
                  >
                    {isHi ? 'केंद्र (62mm)' : 'Center (62mm)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Print Settings Secondary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card Dimensions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Maximize className="w-3.5 h-3.5 text-amber-500" />
              {isHi ? 'कार्ड साइज़ (Dimensions)' : 'Card Size'}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ cardWidthMm: 86, cardHeightMm: 54 })}
                className={`px-2 py-2 rounded-lg border text-[11px] font-semibold flex flex-col items-center cursor-pointer transition-all ${
                  settings.cardWidthMm === 86
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>86 × 54 mm</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">
                  {isHi ? 'आधार / पैन / वोटर' : 'Standard ID'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ cardWidthMm: 85.6, cardHeightMm: 53.98 })}
                className={`px-2 py-2 rounded-lg border text-[11px] font-semibold flex flex-col items-center cursor-pointer transition-all ${
                  settings.cardWidthMm === 85.6
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>85.6 × 54 mm</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">
                  {isHi ? 'CR-80 सटीक' : 'CR-80 Strict'}
                </span>
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {isHi ? 'गाइड व फ़िल्टर' : 'Guides & Filters'}
            </label>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.autoCenterOddCard !== false}
                  onChange={(e) => onUpdateSettings({ autoCenterOddCard: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  {isHi ? 'अकेला / 3रा कार्ड बीच में रखें (Center 62mm)' : 'Auto-Center Odd/Single Card (62mm)'}
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.showCutGuides}
                  onChange={(e) => onUpdateSettings({ showCutGuides: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>{isHi ? 'कटिंग गाइड लाइन (डैश)' : 'Dashed Cutting Lines'}</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.grayscalePrint}
                  onChange={(e) => onUpdateSettings({ grayscalePrint: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>{isHi ? 'ब्लैक & व्हाइट प्रिंट (काली स्याही बचत)' : 'B&W Grayscale Mode'}</span>
              </label>
            </div>
          </div>

          {/* Single Card Image Downloads */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {isHi ? 'सिंगल कार्ड इमेज डाउनलोड' : 'Download Single Card'}
            </label>
            <div className="flex items-center gap-1.5 flex-wrap max-h-20 overflow-y-auto">
              {flatCards.length > 0 ? (
                flatCards.map((c, i) => {
                  const hasImage = Boolean(c.state.enhancedImage || c.state.croppedImage || c.state.originalImage);
                  if (!hasImage) return null;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onDownloadSingle(c.id)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>{c.label || `#${i + 1}`}</span>
                    </button>
                  );
                })
              ) : (
                <span className="text-[11px] text-slate-400">
                  {isHi ? 'कोई फ़ोटो उपलब्ध नहीं' : 'No photos available'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE A4 PRINT SHEET CONTAINER */}
      <div
        ref={previewContainerRef}
        className="w-full flex flex-col items-center justify-center p-2 sm:p-6 bg-slate-200/60 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 sm:mb-3 flex items-center justify-between w-full no-print font-medium px-1">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>
              {isHi
                ? 'A4 शीट (210 × 297 mm) लाइव प्रिव्यू — अधिकतम 4 पेयर (8 कार्ड)'
                : 'A4 Sheet (210 × 297 mm) Live Preview — Up to 4 Pairs (8 Cards)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSheetScale(sheetScale === 'fit' ? '100' : 'fit')}
            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
          >
            {sheetScale === 'fit' ? <ZoomIn className="w-3 h-3 text-blue-600" /> : <ZoomOut className="w-3 h-3 text-blue-600" />}
            <span>{sheetScale === 'fit' ? (isHi ? '100% ज़ूम' : '100% Zoom') : (isHi ? 'स्क्रीन में फिट' : 'Fit Screen')}</span>
          </button>
        </div>

        {/* Scaled paper preview wrapper */}
        <div
          className={`w-full flex justify-center transition-all ${
            sheetScale === '100' ? 'overflow-x-auto py-2' : 'overflow-hidden'
          }`}
          style={{
            height: sheetScale === 'fit' && fitScale < 1 ? `${Math.round(1123 * fitScale)}px` : 'auto',
          }}
        >
          <div
            id="printSheet"
            className="bg-white text-slate-900 shadow-xl relative select-none rounded-xs origin-top transition-transform duration-200"
            style={{
              width: '210mm',
              height: '297mm',
              minHeight: '297mm',
              position: 'relative',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              transform: sheetScale === 'fit' && fitScale < 1 ? `scale(${fitScale})` : 'scale(1)',
              marginBottom: sheetScale === 'fit' && fitScale < 1 ? `-${Math.round(1123 * (1 - fitScale))}px` : '0',
            }}
          >
            {/* RENDER ALL CARDS FROM PAIRS AT THEIR SEPARATE MARGINS (ZERO RESERVED SPACE) */}
            {flatCards.length > 0 ? (
              flatCards.map((card, idx) => {
                const cardImage = card.state.enhancedImage || card.state.croppedImage || card.state.originalImage;
                if (!cardImage) return null;

                const centerCoord = Number(((210 - settings.cardWidthMm) / 2).toFixed(1));
                const isCentered = Math.abs(card.margin.leftMm - centerCoord) < 0.5;

                return (
                  <div
                    key={card.id}
                    id={`sheet-card-${card.id}`}
                    style={{
                      position: 'absolute',
                      top: `${card.margin.topMm}mm`,
                      left: `${card.margin.leftMm}mm`,
                      width: `${settings.cardWidthMm}mm`,
                      height: `${settings.cardHeightMm}mm`,
                      borderRadius: '2mm',
                    }}
                    className={`bg-white overflow-hidden shadow-2xs ${
                      settings.showCutGuides
                        ? 'border border-dashed border-slate-500'
                        : 'border border-slate-300'
                    } ${isGrayscale ? 'grayscale contrast-125' : ''}`}
                  >
                    <img
                      src={cardImage}
                      alt={card.label}
                      className="w-full h-full object-cover"
                    />

                    {/* Non-print UI coordinate tag */}
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/85 text-white font-mono text-[8px] no-print pointer-events-none flex items-center gap-1">
                      <span>{card.label}</span>
                      <span>•</span>
                      <span>{card.margin.topMm}, {card.margin.leftMm}mm</span>
                      {isCentered && (
                        <span className="text-amber-300 font-bold ml-0.5">(Centered)</span>
                      )}
                    </div>

                    {/* Scissors cutting guide */}
                    {settings.showScissors && (
                      <div className="absolute -top-3.5 left-2 flex items-center gap-0.5 text-[9px] text-slate-500 pointer-events-none no-print">
                        <Scissors className="w-3 h-3 rotate-90 text-blue-600" />
                        <span className="font-mono">cut</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center select-none">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-3 text-slate-400">
                  <Printer className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  {isHi ? 'A4 प्रिंट शीट तैयार है (0 रिज़र्व स्पेस)' : 'A4 Print Canvas Ready (Zero Reserved Space)'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {isHi
                    ? 'बाईं ओर कार्ड फ़ोटो जोड़ें। 1 कार्ड या 3 कार्ड अपलोड होने पर आखिरी कार्ड अपने आप बीच (Center 62mm) में संरेखित रहेगा।'
                    : 'Upload card photos on the left. Single or 3rd cards will automatically center align (62mm) with zero wasted space.'}
                </p>
              </div>
            )}

            {/* Sheet watermark footer */}
            <div className="absolute bottom-3 left-0 right-0 text-center text-[8px] text-slate-400 pointer-events-none font-mono">
              Prakash Print Studio • ISO CR80 (86×54mm) • A4 Sheet (210×297mm) • Up to 4 Pairs (8 Cards)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
