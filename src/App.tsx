import React, { useState, useCallback, useEffect } from 'react';
import {
  Sparkles,
  Printer,
  FileDown,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Info,
  ArrowRight,
} from 'lucide-react';
import {
  CardPairItem,
  CardPairMargin,
  CardState,
  Language,
  PrintSettings,
  Point,
  ImageAdjustments,
  NavTab,
  ThemeMode,
} from './types';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { CropModal } from './components/CropModal';
import { ImageAdjustModal } from './components/ImageAdjustModal';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { PrintSheet } from './components/PrintSheet';
import { SizeReducer } from './components/SizeReducer';
import { generateDemoCards } from './utils/demoData';
import { exportA4SheetAsImage } from './utils/exportSheet';
import { downloadA4Pdf } from './utils/pdfExport';
import { warpPerspective, instantAutoCropFromDataUrl } from './utils/perspective';
import {
  initialAdjustments,
  initialCardState,
  getDefaultPairMargin,
  createNewPair,
  getFlatCardsFromPairs,
} from './utils/pairUtils';

const defaultPrintSettings: PrintSettings = {
  layout: 'custom-margins',
  copies: 1,
  cardWidthMm: 86,
  cardHeightMm: 54,
  gapMm: 8,
  topMarginMm: 14,
  leftMarginMm: 15,
  showCutGuides: true,
  showScissors: true,
  grayscalePrint: false,
  autoCenterOddCard: true,
};

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prakash_lang') as Language | null;
      if (saved === 'hi' || saved === 'en') return saved;
    }
    return 'en';
  });
  const isHi = language === 'hi';

  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prakash_theme') as ThemeMode | null;
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('prakash_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem('prakash_lang', language);
    } catch {
      // ignore
    }
  }, [language]);

  const [activeNavTab, setActiveNavTab] = useState<NavTab>('card-print');

  // Dynamic 4-Pair State (Up to 4 pairs = 8 cards on a single A4 page)
  const [pairs, setPairs] = useState<CardPairItem[]>([
    {
      id: 'pair-1',
      label: 'Pair 1',
      front: { ...initialCardState },
      back: { ...initialCardState },
      margin: getDefaultPairMargin(0),
    },
  ]);

  // Modal active targets: { pairId: string, side: 'front' | 'back' }
  const [activeCropTarget, setActiveCropTarget] = useState<{
    pairId: string;
    side: 'front' | 'back';
  } | null>(null);

  const [activeAdjustTarget, setActiveAdjustTarget] = useState<{
    pairId: string;
    side: 'front' | 'back';
  } | null>(null);

  const [activeCameraTarget, setActiveCameraTarget] = useState<{
    pairId: string;
    side: 'front' | 'back';
  } | null>(null);

  const [printSettings, setPrintSettings] = useState<PrintSettings>(defaultPrintSettings);
  const [isTopDownloadingPdf, setIsTopDownloadingPdf] = useState(false);

  // Add Pair Handler (Max 4 pairs per A4 page)
  const handleAddPair = () => {
    if (pairs.length >= 4) return;
    const newPair = createNewPair(pairs.length);
    setPairs((prev) => [...prev, newPair]);
  };

  // Remove Pair Handler
  const handleRemovePair = (pairId: string) => {
    if (pairs.length <= 1) return;
    setPairs((prev) => prev.filter((p) => p.id !== pairId));
  };

  // Update Pair Label
  const handleUpdatePairLabel = (pairId: string, label: string) => {
    setPairs((prev) =>
      prev.map((p) => (p.id === pairId ? { ...p, label } : p))
    );
  };

  // Update Individual Pair Margins
  const handleUpdatePairMargin = (pairId: string, margin: Partial<CardPairMargin>) => {
    setPairs((prev) =>
      prev.map((p) =>
        p.id === pairId ? { ...p, margin: { ...p.margin, ...margin } } : p
      )
    );
  };

  // File loading
  const handleFileSelect = (pairId: string, side: 'front' | 'back', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPairs((prev) =>
        prev.map((p) => {
          if (p.id !== pairId) return p;
          return {
            ...p,
            [side]: {
              ...p[side],
              originalImage: dataUrl,
              fileName: file.name,
            },
          };
        })
      );
      setActiveCropTarget({ pairId, side });
    };
    reader.readAsDataURL(file);
  };

  // Camera capture
  const handleCameraCapture = (pairId: string, side: 'front' | 'back', dataUrl: string) => {
    setPairs((prev) =>
      prev.map((p) => {
        if (p.id !== pairId) return p;
        return {
          ...p,
          [side]: {
            ...p[side],
            originalImage: dataUrl,
            fileName: `camera_${pairId}_${side}.jpg`,
          },
        };
      })
    );
    setActiveCropTarget({ pairId, side });
  };

  // Demo Card Loader
  const handleLoadDemo = useCallback(() => {
    const { front, back } = generateDemoCards();

    const imgFront = new Image();
    imgFront.onload = () => {
      const w = imgFront.width;
      const h = imgFront.height;
      const frontCropped = warpPerspective(
        imgFront,
        [
          { x: w * 0.16, y: h * 0.2 },
          { x: w * 0.84, y: h * 0.24 },
          { x: w * 0.81, y: h * 0.88 },
          { x: w * 0.13, y: h * 0.84 },
        ],
        1016,
        638
      );

      const imgBack = new Image();
      imgBack.onload = () => {
        const bw = imgBack.width;
        const bh = imgBack.height;
        const backCropped = warpPerspective(
          imgBack,
          [
            { x: bw * 0.15, y: bh * 0.22 },
            { x: bw * 0.83, y: bh * 0.18 },
            { x: bw * 0.86, y: bh * 0.82 },
            { x: bw * 0.18, y: bh * 0.86 },
          ],
          1016,
          638
        );

        setPairs([
          {
            id: 'pair-1',
            label: 'Pair 1',
            front: {
              originalImage: front,
              croppedImage: frontCropped,
              enhancedImage: null,
              cropPoints: null,
              rotation: 0,
              adjustments: initialAdjustments,
              fileName: 'sample_id_front.jpg',
            },
            back: {
              originalImage: back,
              croppedImage: backCropped,
              enhancedImage: null,
              cropPoints: null,
              rotation: 0,
              adjustments: initialAdjustments,
              fileName: 'sample_id_back.jpg',
            },
            margin: getDefaultPairMargin(0),
          },
        ]);
      };
      imgBack.src = back;
    };
    imgFront.src = front;
  }, []);

  // Reset All
  const handleResetAll = () => {
    setPairs([
      {
        id: 'pair-1',
        label: 'Pair 1',
        front: { ...initialCardState },
        back: { ...initialCardState },
        margin: getDefaultPairMargin(0),
      },
    ]);
  };

  // Crop Complete
  const handleCropComplete = (croppedDataUrl: string, points: Point[]) => {
    if (!activeCropTarget) return;
    const { pairId, side } = activeCropTarget;

    setPairs((prev) =>
      prev.map((p) => {
        if (p.id !== pairId) return p;
        return {
          ...p,
          [side]: {
            ...p[side],
            croppedImage: croppedDataUrl,
            enhancedImage: null,
            cropPoints: points,
          },
        };
      })
    );
  };

  // 1-Click Instant Auto-Crop
  const handleInstantAutoCrop = async (pairId: string, side: 'front' | 'back') => {
    const pair = pairs.find((p) => p.id === pairId);
    if (!pair || !pair[side].originalImage) return;

    try {
      const cropped = await instantAutoCropFromDataUrl(pair[side].originalImage!);
      setPairs((prev) =>
        prev.map((p) => {
          if (p.id !== pairId) return p;
          return {
            ...p,
            [side]: {
              ...p[side],
              croppedImage: cropped,
              enhancedImage: null,
            },
          };
        })
      );
    } catch (e) {
      console.error('Instant auto crop failed:', e);
      setActiveCropTarget({ pairId, side });
    }
  };

  // Copy image from front to back or back to front
  const handleCopyFromSide = (
    pairId: string,
    fromSide: 'front' | 'back',
    toSide: 'front' | 'back'
  ) => {
    const pair = pairs.find((p) => p.id === pairId);
    if (!pair || !pair[fromSide].originalImage) return;

    setPairs((prev) =>
      prev.map((p) => {
        if (p.id !== pairId) return p;
        return {
          ...p,
          [toSide]: {
            ...p[toSide],
            originalImage: pair[fromSide].originalImage,
            fileName: `copy_${pair[fromSide].fileName || 'card.jpg'}`,
          },
        };
      })
    );
    setActiveCropTarget({ pairId, side: toSide });
  };

  // Quick 90° Rotate of card side
  const handleQuickRotate = (pairId: string, side: 'front' | 'back') => {
    const pair = pairs.find((p) => p.id === pairId);
    if (!pair) return;
    const targetSrc = pair[side].enhancedImage || pair[side].croppedImage;
    if (!targetSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedUrl = canvas.toDataURL('image/jpeg', 0.95);
      setPairs((prev) =>
        prev.map((p) => {
          if (p.id !== pairId) return p;
          return {
            ...p,
            [side]: {
              ...p[side],
              croppedImage: rotatedUrl,
              enhancedImage: null,
            },
          };
        })
      );
    };
    img.src = targetSrc;
  };

  // Adjust Complete
  const handleAdjustComplete = (
    adjustedSrc: string,
    newAdjustments: ImageAdjustments
  ) => {
    if (!activeAdjustTarget) return;
    const { pairId, side } = activeAdjustTarget;

    setPairs((prev) =>
      prev.map((p) => {
        if (p.id !== pairId) return p;
        return {
          ...p,
          [side]: {
            ...p[side],
            enhancedImage: adjustedSrc,
            adjustments: newAdjustments,
          },
        };
      })
    );
  };

  // Clear single card side
  const handleClearCardSide = (pairId: string, side: 'front' | 'back') => {
    setPairs((prev) =>
      prev.map((p) => {
        if (p.id !== pairId) return p;
        return {
          ...p,
          [side]: { ...initialCardState },
        };
      })
    );
  };

  // Clear entire pair
  const handleClearPair = (pairId: string) => {
    setPairs((prev) =>
      prev.map((p) => {
        if (p.id !== pairId) return p;
        return {
          ...p,
          front: { ...initialCardState },
          back: { ...initialCardState },
        };
      })
    );
  };

  // Download Single Card
  const handleDownloadSingle = (targetIdOrSide: string, sideArg?: 'front' | 'back') => {
    let cardImage: string | null = null;
    let filename = 'card_hd.jpg';

    if (sideArg) {
      const pair = pairs.find((p) => p.id === targetIdOrSide);
      if (pair) {
        cardImage = pair[sideArg].enhancedImage || pair[sideArg].croppedImage;
        filename = `${pair.label}_${sideArg}.jpg`;
      }
    } else {
      // It's a flat card ID like pair-1-front
      const flatCards = getFlatCardsFromPairs(pairs, printSettings.cardWidthMm);
      const target = flatCards.find((c) => c.id === targetIdOrSide);
      if (target) {
        cardImage = target.state.enhancedImage || target.state.croppedImage;
        filename = `${target.label.replace(/[^a-z0-9]/gi, '_')}.jpg`;
      }
    }

    if (!cardImage) return;

    const link = document.createElement('a');
    link.href = cardImage;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download A4 PDF using jsPDF
  const handleDownloadPdf = async () => {
    const flatCards = getFlatCardsFromPairs(pairs, printSettings.cardWidthMm);
    const hasAnyReady = flatCards.some(
      (c) => c.state.enhancedImage || c.state.croppedImage || c.state.originalImage
    );

    if (!hasAnyReady) {
      alert(
        isHi
          ? 'कृपया पहले कम से कम एक कार्ड फ़ोटो जोड़ें।'
          : 'Please upload at least one card photo.'
      );
      return;
    }

    setIsTopDownloadingPdf(true);
    try {
      await downloadA4Pdf(pairs, printSettings, 'Prakash_Print_4_Pairs_A4.pdf');
    } finally {
      setIsTopDownloadingPdf(false);
    }
  };

  // Print trigger
  const handlePrint = () => {
    document.documentElement.style.setProperty(
      '--print-top-margin',
      `${printSettings.topMarginMm}mm`
    );

    try {
      window.print();
    } catch (e) {
      console.warn('Browser print failed:', e);
      handleDownloadPdf();
    }
  };

  // Download Full Sheet Image
  const handleDownloadFullSheet = async () => {
    await exportA4SheetAsImage(pairs, printSettings, 'prakash_print_a4_sheet.png');
  };

  // Statistics
  const flatCards = getFlatCardsFromPairs(pairs, printSettings.cardWidthMm);
  const totalSidesCount = pairs.length * 2;
  const readySidesCount = flatCards.filter(
    (c) => Boolean(c.state.enhancedImage || c.state.croppedImage)
  ).length;
  const hasAnyCard = flatCards.some(
    (c) => Boolean(c.state.croppedImage || c.state.originalImage)
  );

  // Target objects for modals
  const activeCropPair = pairs.find((p) => p.id === activeCropTarget?.pairId);
  const activeCropCardState = activeCropTarget && activeCropPair ? activeCropPair[activeCropTarget.side] : null;

  const activeAdjustPair = pairs.find((p) => p.id === activeAdjustTarget?.pairId);
  const activeAdjustCardState = activeAdjustTarget && activeAdjustPair ? activeAdjustPair[activeAdjustTarget.side] : null;

  const activeCameraPair = pairs.find((p) => p.id === activeCameraTarget?.pairId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Header Bar with Navigation Tabs */}
      <Header
        language={language}
        theme={theme}
        activeNavTab={activeNavTab}
        onSelectNavTab={setActiveNavTab}
        onToggleLanguage={() => setLanguage((l) => (l === 'hi' ? 'en' : 'hi'))}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onLoadDemo={handleLoadDemo}
        onResetAll={handleResetAll}
        hasCards={hasAnyCard}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-5 sm:space-y-6 pb-28 sm:pb-8">
        {activeNavTab === 'size-reducer' ? (
          /* Feature 2: Photo and PDF Target Size Reducer */
          <SizeReducer language={language} />
        ) : (
          /* Feature 1: ID Card A4 Print Studio with Dynamic 4 Pairs */
          <>
            {/* Step Progress Guide */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 max-w-3xl mx-auto shadow-xs no-print transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold">
                {/* Step 1 */}
                <div
                  className={`flex items-center gap-2 ${
                    hasAnyCard ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      hasAnyCard
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    1
                  </span>
                  <span>{isHi ? 'कार्ड पेयर जोड़ें' : 'Add Card Pairs'}</span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />

                {/* Step 2 */}
                <div
                  className={`flex items-center gap-2 ${
                    readySidesCount > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      readySidesCount > 0
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    2
                  </span>
                  <span>{isHi ? 'क्रॉप व अलग मार्जिन' : 'Crop & Margins'}</span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />

                {/* Step 3 */}
                <div
                  className={`flex items-center gap-2 ${
                    readySidesCount > 0
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      readySidesCount > 0
                        ? 'bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    3
                  </span>
                  <span>{isHi ? 'A4 PDF डाउनलोड' : 'Download PDF'}</span>
                </div>
              </div>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs no-print">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isHi ? 'अधिकतम 4 पेयर (8 कार्ड) प्रति A4 पेज' : 'Max 4 Pairs (8 Cards) per A4 Page'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-medium">
                <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                {isHi ? 'प्रत्येक कार्ड का अलग मार्जिन' : 'Separate Margin per Card'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {isHi ? 'ISO CR80 (86×54 mm) A4 रेडी' : 'ISO CR80 Standard ID Card'}
              </span>
            </div>

            {/* Cards Ready Alert & Quick Download Bar */}
            {readySidesCount > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 sm:p-5 max-w-2xl mx-auto shadow-xs animate-in fade-in zoom-in-95 no-print flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-emerald-800 dark:text-emerald-300">
                      {readySidesCount === totalSidesCount
                        ? isHi
                          ? `🎉 सभी ${pairs.length} पेयर (${totalSidesCount} कार्ड) A4 प्रिंट के लिए तैयार हैं!`
                          : `🎉 All ${pairs.length} pairs (${totalSidesCount} cards) ready for A4 printing!`
                        : isHi
                          ? `✓ ${readySidesCount} / ${totalSidesCount} कार्ड A4 प्रिंट के लिए तैयार!`
                          : `✓ ${readySidesCount} of ${totalSidesCount} cards ready!`}
                    </h4>
                    <p className="text-xs text-emerald-700/80 dark:text-slate-300 mt-0.5">
                      {isHi
                        ? 'सटीक 86×54 mm साइज़ में सीधे A4 PDF डाउनलोड करें या प्रिंट करें।'
                        : 'Download exact 86×54mm PDF directly or print.'}
                    </p>
                  </div>
                </div>

                {/* Quick Action in Banner */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isTopDownloadingPdf}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>{isTopDownloadingPdf ? 'PDF...' : isHi ? 'A4 PDF डाउनलोड' : 'Download PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isHi ? 'प्रिंट' : 'Print'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* DYNAMIC 4-PAIR UPLOAD SECTION */}
            <section className="no-print">
              <UploadSection
                pairs={pairs}
                language={language}
                onAddPair={handleAddPair}
                onRemovePair={handleRemovePair}
                onUpdatePairLabel={handleUpdatePairLabel}
                onUpdatePairMargin={handleUpdatePairMargin}
                onFileSelect={handleFileSelect}
                onOpenCrop={(pairId, side) => setActiveCropTarget({ pairId, side })}
                onOpenAdjust={(pairId, side) => setActiveAdjustTarget({ pairId, side })}
                onOpenCamera={(pairId, side) => setActiveCameraTarget({ pairId, side })}
                onQuickRotate={handleQuickRotate}
                onClearCardSide={handleClearCardSide}
                onClearPair={handleClearPair}
                onInstantAutoCrop={handleInstantAutoCrop}
                onCopyFromSide={handleCopyFromSide}
                onDownloadSingle={handleDownloadSingle}
              />
            </section>

            {/* Print Sheet & Settings Section */}
            <section>
              <PrintSheet
                pairs={pairs}
                settings={printSettings}
                language={language}
                onUpdateSettings={(newVals) =>
                  setPrintSettings((prev) => ({ ...prev, ...newVals }))
                }
                onUpdatePairMargin={handleUpdatePairMargin}
                onPrint={handlePrint}
                onDownloadPdf={handleDownloadPdf}
                onDownloadSingle={handleDownloadSingle}
                onDownloadFullSheet={handleDownloadFullSheet}
              />
            </section>

            {/* Cyber Cafe / Print Studio Quick Guide */}
            <section className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 max-w-3xl mx-auto text-xs text-slate-600 dark:text-slate-400 space-y-2 no-print shadow-xs">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                <Info className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <span>{isHi ? 'साइबर कैफ़े 4-पेयर प्रिंट टिप्स' : 'Cyber Cafe 4-Pair Print Studio Tips'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                <li>
                  <span className="text-slate-800 dark:text-slate-300 font-medium">
                    {isHi ? 'एक A4 पेज पर 4 पेयर (8 कार्ड):' : '4 Pairs (8 Cards) on Single A4 Page:'}
                  </span>{' '}
                  {isHi
                    ? 'प्लस (+) बटन दबाकर आसानी से 4 पेयर (कुल 8 कार्ड - 4 फ्रंट और 4 बैक) जोड़ें। 4 पंक्तियों में प्रिंट करने से लेमिनेशन पाउच और कागज़ की 75% बचत होती है।'
                    : 'Click the Plus (+) button to add up to 4 pairs (8 cards total - 4 front and 4 back). Printing 4 pairs on one sheet saves up to 75% on lamination pouches and photographic paper.'}
                </li>
                <li>
                  <span className="text-slate-800 dark:text-slate-300 font-medium">
                    {isHi ? 'प्रत्येक कार्ड का अलग मार्जिन:' : 'Custom Separate Margins:'}
                  </span>{' '}
                  {isHi
                    ? 'प्रत्येक पेयर के लिए ऊपर (Top) व बाएं (Left) से मिलीमीटर में दूरी सेट करें। आवश्यकतानुसार "बैक कार्ड अलग स्थिति में रखें" चेकबॉक्स चुनकर बैक कार्ड के अलग निर्देशांक भी तय कर सकते हैं।'
                    : 'Adjust Top and Left millimeter margins manually for each pair, or enable custom back card coordinates for complete freedom.'}
                </li>
                <li>
                  <span className="text-slate-800 dark:text-slate-300 font-medium">
                    {isHi ? 'सटीक A4 PDF डाउनलोड:' : 'Direct A4 PDF Download:'}
                  </span>{' '}
                  {isHi
                    ? '"A4 PDF डाउनलोड" बटन दबाने पर सभी 4 पेयर अपने तय मार्जिन पर सटीक 86×54 mm आकार में PDF में एक्सपोर्ट होते हैं।'
                    : 'Click "Download A4 PDF" to export all card pairs at their exact manual coordinates with high-resolution vectors.'}
                </li>
              </ul>
            </section>
          </>
        )}
      </main>

      {/* Mobile Sticky Action Bar for quick A4 PDF download & print */}
      {activeNavTab === 'card-print' && readySidesCount > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-lg no-print">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isTopDownloadingPdf}
            className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            <FileDown className="w-4 h-4" />
            <span>{isTopDownloadingPdf ? 'PDF...' : isHi ? 'A4 PDF डाउनलोड' : 'Download PDF'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isHi ? 'प्रिंट' : 'Print'}</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 py-4 text-center text-xs text-slate-500 dark:text-slate-500 no-print">
        <p>
          {isHi
            ? 'प्रकाश प्रिंट स्टूडियो • साइबर कैफ़े & प्रिंट शॉप के लिए स्मार्ट टूल'
            : 'Prakash Print Studio • Smart ID Card Utility for Cyber Cafes & Print Shops'}
        </p>
      </footer>

      {/* 4-Corner Crop Modal */}
      {activeCropTarget && activeCropPair && activeCropCardState && (
        <CropModal
          isOpen={Boolean(activeCropTarget)}
          onClose={() => setActiveCropTarget(null)}
          imageSrc={activeCropCardState.originalImage || ''}
          cardSide={activeCropTarget.side}
          cardLabel={`${activeCropPair.label} (${activeCropTarget.side === 'front' ? (isHi ? 'फ्रंट' : 'Front') : (isHi ? 'बैक' : 'Back')})`}
          language={language}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Document Enhancement / Xerox Modal */}
      {activeAdjustTarget && activeAdjustPair && activeAdjustCardState && (
        <ImageAdjustModal
          isOpen={Boolean(activeAdjustTarget)}
          onClose={() => setActiveAdjustTarget(null)}
          imageSrc={activeAdjustCardState.croppedImage || ''}
          cardSide={activeAdjustTarget.side}
          cardLabel={`${activeAdjustPair.label} (${activeAdjustTarget.side === 'front' ? (isHi ? 'फ्रंट' : 'Front') : (isHi ? 'बैक' : 'Back')})`}
          currentAdjustments={activeAdjustCardState.adjustments}
          language={language}
          onSave={handleAdjustComplete}
        />
      )}

      {/* Camera Capture Modal */}
      {activeCameraTarget && activeCameraPair && (
        <CameraCaptureModal
          isOpen={Boolean(activeCameraTarget)}
          onClose={() => setActiveCameraTarget(null)}
          cardSide={activeCameraTarget.side}
          cardLabel={`${activeCameraPair.label} (${activeCameraTarget.side === 'front' ? (isHi ? 'फ्रंट' : 'Front') : (isHi ? 'बैक' : 'Back')})`}
          language={language}
          onCapture={(dataUrl) =>
            handleCameraCapture(activeCameraTarget.pairId, activeCameraTarget.side, dataUrl)
          }
        />
      )}
    </div>
  );
}
