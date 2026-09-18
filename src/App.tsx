import React, { useState, useCallback, useEffect } from 'react';
import {
  Sparkles,
  Printer,
  FileDown,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  ArrowRight,
  Sparkle
} from 'lucide-react';
import { CardState, Language, PrintSettings, Point, ImageAdjustments, NavTab, ThemeMode } from './types';
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

const initialAdjustments: ImageAdjustments = {
  mode: 'original',
  brightness: 0,
  contrast: 0,
  sharpness: false,
};

const initialCardState: CardState = {
  originalImage: null,
  croppedImage: null,
  enhancedImage: null,
  cropPoints: null,
  rotation: 0,
  adjustments: initialAdjustments,
  fileName: null,
};

const defaultPrintSettings: PrintSettings = {
  layout: 'side-by-side',
  copies: 1,
  cardWidthMm: 86,
  cardHeightMm: 54,
  gapMm: 8,
  topMarginMm: 20,
  leftMarginMm: 15,
  showCutGuides: true,
  showScissors: true,
  grayscalePrint: false,
};

export default function App() {
  const [language, setLanguage] = useState<Language>('hi');
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

  const [activeNavTab, setActiveNavTab] = useState<NavTab>('card-print');

  const [frontCard, setFrontCard] = useState<CardState>(initialCardState);
  const [backCard, setBackCard] = useState<CardState>(initialCardState);

  const [activeCropSide, setActiveCropSide] = useState<'front' | 'back' | null>(null);
  const [activeAdjustSide, setActiveAdjustSide] = useState<'front' | 'back' | null>(null);
  const [activeCameraSide, setActiveCameraSide] = useState<'front' | 'back' | null>(null);

  const [printSettings, setPrintSettings] = useState<PrintSettings>(defaultPrintSettings);
  const [isTopDownloadingPdf, setIsTopDownloadingPdf] = useState(false);

  // File loading
  const handleFileSelect = (side: 'front' | 'back', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (side === 'front') {
        setFrontCard((prev) => ({
          ...prev,
          originalImage: dataUrl,
          fileName: file.name,
        }));
      } else {
        setBackCard((prev) => ({
          ...prev,
          originalImage: dataUrl,
          fileName: file.name,
        }));
      }
      setActiveCropSide(side);
    };
    reader.readAsDataURL(file);
  };

  // Camera capture
  const handleCameraCapture = (side: 'front' | 'back', dataUrl: string) => {
    if (side === 'front') {
      setFrontCard((prev) => ({
        ...prev,
        originalImage: dataUrl,
        fileName: 'camera_front.jpg',
      }));
    } else {
      setBackCard((prev) => ({
        ...prev,
        originalImage: dataUrl,
        fileName: 'camera_back.jpg',
      }));
    }
    setActiveCropSide(side);
  };

  // Demo Card Loader
  const handleLoadDemo = useCallback(() => {
    const { front, back } = generateDemoCards();

    // Auto crop sample cards to standard card ratio
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

      setFrontCard({
        originalImage: front,
        croppedImage: frontCropped,
        enhancedImage: null,
        cropPoints: null,
        rotation: 0,
        adjustments: initialAdjustments,
        fileName: 'sample_id_front.jpg',
      });
    };
    imgFront.src = front;

    const imgBack = new Image();
    imgBack.onload = () => {
      const w = imgBack.width;
      const h = imgBack.height;
      const backCropped = warpPerspective(
        imgBack,
        [
          { x: w * 0.15, y: h * 0.22 },
          { x: w * 0.83, y: h * 0.18 },
          { x: w * 0.86, y: h * 0.82 },
          { x: w * 0.18, y: h * 0.86 },
        ],
        1016,
        638
      );

      setBackCard({
        originalImage: back,
        croppedImage: backCropped,
        enhancedImage: null,
        cropPoints: null,
        rotation: 0,
        adjustments: initialAdjustments,
        fileName: 'sample_id_back.jpg',
      });
    };
    imgBack.src = back;
  }, []);

  // Reset All
  const handleResetAll = () => {
    setFrontCard(initialCardState);
    setBackCard(initialCardState);
  };

  // Crop Complete
  const handleCropComplete = (croppedDataUrl: string, points: Point[]) => {
    if (activeCropSide === 'front') {
      setFrontCard((prev) => ({
        ...prev,
        croppedImage: croppedDataUrl,
        enhancedImage: null,
        cropPoints: points,
      }));
    } else if (activeCropSide === 'back') {
      setBackCard((prev) => ({
        ...prev,
        croppedImage: croppedDataUrl,
        enhancedImage: null,
        cropPoints: points,
      }));
    }
  };

  // 1-Click Instant Auto-Crop
  const handleInstantAutoCrop = async (side: 'front' | 'back') => {
    const card = side === 'front' ? frontCard : backCard;
    if (!card.originalImage) return;

    try {
      const cropped = await instantAutoCropFromDataUrl(card.originalImage);
      if (side === 'front') {
        setFrontCard((prev) => ({
          ...prev,
          croppedImage: cropped,
          enhancedImage: null,
        }));
      } else {
        setBackCard((prev) => ({
          ...prev,
          croppedImage: cropped,
          enhancedImage: null,
        }));
      }
    } catch (e) {
      console.error('Instant auto crop failed:', e);
      setActiveCropSide(side);
    }
  };

  // Use same photo for other side (e.g. single photo contains both front and back)
  const handleUseSameImageForOtherSide = (fromSide: 'front' | 'back') => {
    const sourceCard = fromSide === 'front' ? frontCard : backCard;
    if (!sourceCard.originalImage) return;

    const targetSide = fromSide === 'front' ? 'back' : 'front';
    if (targetSide === 'back') {
      setBackCard((prev) => ({
        ...prev,
        originalImage: sourceCard.originalImage,
        fileName: sourceCard.fileName ? `back_${sourceCard.fileName}` : 'back_photo.jpg',
      }));
    } else {
      setFrontCard((prev) => ({
        ...prev,
        originalImage: sourceCard.originalImage,
        fileName: sourceCard.fileName ? `front_${sourceCard.fileName}` : 'front_photo.jpg',
      }));
    }
    setActiveCropSide(targetSide);
  };

  // Quick 90° Rotate of already cropped card
  const handleQuickRotate = (side: 'front' | 'back') => {
    const card = side === 'front' ? frontCard : backCard;
    const targetSrc = card.enhancedImage || card.croppedImage;
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
      if (side === 'front') {
        setFrontCard((prev) => ({
          ...prev,
          croppedImage: rotatedUrl,
          enhancedImage: null,
        }));
      } else {
        setBackCard((prev) => ({
          ...prev,
          croppedImage: rotatedUrl,
          enhancedImage: null,
        }));
      }
    };
    img.src = targetSrc;
  };

  // Adjust Complete
  const handleAdjustComplete = (
    adjustedSrc: string,
    newAdjustments: ImageAdjustments
  ) => {
    if (activeAdjustSide === 'front') {
      setFrontCard((prev) => ({
        ...prev,
        enhancedImage: adjustedSrc,
        adjustments: newAdjustments,
      }));
    } else if (activeAdjustSide === 'back') {
      setBackCard((prev) => ({
        ...prev,
        enhancedImage: adjustedSrc,
        adjustments: newAdjustments,
      }));
    }
  };

  // Clear single card
  const handleClearCard = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontCard(initialCardState);
    } else {
      setBackCard(initialCardState);
    }
  };

  // Download A4 PDF using jsPDF
  const handleDownloadPdf = async () => {
    const frontSrc = frontCard.enhancedImage || frontCard.croppedImage;
    const backSrc = backCard.enhancedImage || backCard.croppedImage;

    if (!frontSrc && !backSrc) {
      alert(
        isHi
          ? 'कृपया पहले कम से कम एक कार्ड फ़ोटो जोड़ें।'
          : 'Please upload at least one card photo.'
      );
      return;
    }

    setIsTopDownloadingPdf(true);
    try {
      await downloadA4Pdf(
        frontSrc,
        backSrc,
        printSettings,
        'Prakash_Print_ID_Card_A4.pdf'
      );
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
      // If window.print() is blocked by sandbox iframe, trigger PDF download fallback
      handleDownloadPdf();
    }
  };

  // Download Single Card
  const handleDownloadSingle = (side: 'front' | 'back') => {
    const card = side === 'front' ? frontCard : backCard;
    const src = card.enhancedImage || card.croppedImage;
    if (!src) return;

    const link = document.createElement('a');
    link.href = src;
    link.download = `card_${side}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Full Sheet Image
  const handleDownloadFullSheet = async () => {
    const frontSrc = frontCard.enhancedImage || frontCard.croppedImage;
    const backSrc = backCard.enhancedImage || backCard.croppedImage;
    await exportA4SheetAsImage(frontSrc, backSrc, printSettings, 'prakash_print_a4_sheet.png');
  };

  const hasAnyCard = Boolean(
    frontCard.croppedImage ||
      frontCard.originalImage ||
      backCard.croppedImage ||
      backCard.originalImage
  );

  const frontReady = Boolean(frontCard.enhancedImage || frontCard.croppedImage);
  const backReady = Boolean(backCard.enhancedImage || backCard.croppedImage);
  const bothCardsReady = frontReady && backReady;

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
          /* Feature 1: ID Card A4 Print Studio */
          <>
            {/* Step Progress Guide */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 max-w-3xl mx-auto shadow-xs no-print transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold">
                {/* Step 1 */}
                <div className={`flex items-center gap-2 ${hasAnyCard ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasAnyCard ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300' : 'bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-300'}`}>
                    1
                  </span>
                  <span>{isHi ? 'कार्ड अपलोड' : 'Upload Cards'}</span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />

                {/* Step 2 */}
                <div className={`flex items-center gap-2 ${frontReady || backReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${frontReady || backReady ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                    2
                  </span>
                  <span>{isHi ? 'क्रॉप व क्लीन' : 'Crop & Clean'}</span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />

                {/* Step 3 */}
                <div className={`flex items-center gap-2 ${frontReady || backReady ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${frontReady || backReady ? 'bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500'}`}>
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
                {isHi ? '4-कॉर्नर पर्सपेक्टिव ट्रांसफ़ॉर्म' : '4-Corner Perspective Warp'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-medium">
                <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                {isHi ? '2.5x मैग्नीफायर लूना' : '2.5x Loupe Magnifier'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {isHi ? 'ISO CR80 (86×54 mm) A4 रेडी' : 'ISO CR80 Standard ID Card'}
              </span>
            </div>

            {/* Cards Ready Alert & Quick Download Bar */}
            {(frontReady || backReady) && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 sm:p-5 max-w-2xl mx-auto shadow-xs animate-in fade-in zoom-in-95 no-print flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-emerald-800 dark:text-emerald-300">
                      {bothCardsReady
                        ? isHi
                          ? '🎉 दोनों साइड्स A4 प्रिंट के लिए तैयार हैं!'
                          : '🎉 Both sides ready for A4 printing!'
                        : isHi
                          ? '✓ कार्ड A4 प्रिंट के लिए तैयार है!'
                          : '✓ Card ready for A4 printing!'}
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
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isHi ? 'प्रिंट' : 'Print'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Dual Upload Section (Front & Back) */}
            <section className="no-print">
              <UploadSection
                frontCard={frontCard}
                backCard={backCard}
                language={language}
                onFileSelect={handleFileSelect}
                onOpenCrop={(side) => setActiveCropSide(side)}
                onOpenAdjust={(side) => setActiveAdjustSide(side)}
                onOpenCamera={(side) => setActiveCameraSide(side)}
                onQuickRotate={handleQuickRotate}
                onClearCard={handleClearCard}
                onInstantAutoCrop={handleInstantAutoCrop}
                onUseSameImageForOtherSide={handleUseSameImageForOtherSide}
                onDownloadSingle={handleDownloadSingle}
              />
            </section>

            {/* Print Sheet & Settings Section */}
            <section>
              <PrintSheet
                frontCard={frontCard}
                backCard={backCard}
                settings={printSettings}
                language={language}
                onUpdateSettings={(newVals) =>
                  setPrintSettings((prev) => ({ ...prev, ...newVals }))
                }
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
                <span>{isHi ? 'साइबर कैफ़े प्रिंट टिप्स व सुझाव' : 'Cyber Cafe Print Studio Tips'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                <li>
                  <span className="text-slate-800 dark:text-slate-300 font-medium">{isHi ? 'सीधा A4 PDF डाउनलोड:' : 'Direct A4 PDF Download:'}</span>{' '}
                  {isHi
                    ? '"A4 PDF डाउनलोड करें" बटन दबाएं। यह सटीक 86×54 mm CR80 डाइमेंशन्स में PDF फाइल तुरंत सेव करता है जिसे आप कभी भी प्रिंट या व्हाट्सएप पर शेयर कर सकते हैं।'
                    : 'Click "Download A4 PDF" to get an exact ISO CR80 document ready for instant printing or sharing.'}
                </li>
                <li>
                  <span className="text-slate-800 dark:text-slate-300 font-medium">{isHi ? 'लेमिनेशन पाउच हेतु:' : 'For Lamination Pouches:'}</span>{' '}
                  {isHi
                    ? 'लेआउट में "आजू-बाजू (Horizontal)" चुनें। कार्ड प्रिंट के बाद बीच से मोड़कर आसानी से 88×56mm लेमिनेशन पाउच में फिट हो जाता है।'
                    : 'Select "Horizontal Side-by-Side" to fold the card in half directly into the lamination pouch.'}
                </li>
                <li>
                  <span className="text-slate-800 dark:text-slate-300 font-medium">{isHi ? 'गहरी या छाया वाली फ़ोटो:' : 'Dark or Shadowed Photos:'}</span>{' '}
                  {isHi
                    ? '"साफ़ करें (Clean)" बटन दबाकर "साफ़ दस्तावेज़ (Doc Clean)" या "B&W ज़ेरॉक्स" मोड चुनें।'
                    : 'Click "Clean" to apply "Doc Clean" or "B&W Xerox" mode for crisp text.'}
                </li>
              </ul>
            </section>
          </>
        )}
      </main>

      {/* Mobile Sticky Action Bar for quick A4 PDF download & print */}
      {activeNavTab === 'card-print' && (frontReady || backReady) && (
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
      {activeCropSide && (
        <CropModal
          isOpen={Boolean(activeCropSide)}
          onClose={() => setActiveCropSide(null)}
          imageSrc={
            (activeCropSide === 'front'
              ? frontCard.originalImage
              : backCard.originalImage) || ''
          }
          cardSide={activeCropSide}
          language={language}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Document Enhancement / Xerox Modal */}
      {activeAdjustSide && (
        <ImageAdjustModal
          isOpen={Boolean(activeAdjustSide)}
          onClose={() => setActiveAdjustSide(null)}
          imageSrc={
            (activeAdjustSide === 'front'
              ? frontCard.croppedImage
              : backCard.croppedImage) || ''
          }
          cardSide={activeAdjustSide}
          currentAdjustments={
            activeAdjustSide === 'front'
              ? frontCard.adjustments
              : backCard.adjustments
          }
          language={language}
          onSave={handleAdjustComplete}
        />
      )}

      {/* Camera Capture Modal */}
      {activeCameraSide && (
        <CameraCaptureModal
          isOpen={Boolean(activeCameraSide)}
          onClose={() => setActiveCameraSide(null)}
          cardSide={activeCameraSide}
          language={language}
          onCapture={(dataUrl) => handleCameraCapture(activeCameraSide, dataUrl)}
        />
      )}
    </div>
  );
}
