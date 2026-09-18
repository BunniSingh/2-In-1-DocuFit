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
} from 'lucide-react';
import { CardState, PrintSettings, Language } from '../types';

interface PrintSheetProps {
  frontCard: CardState;
  backCard: CardState;
  settings: PrintSettings;
  language: Language;
  onUpdateSettings: (newSettings: Partial<PrintSettings>) => void;
  onPrint: () => void;
  onDownloadPdf: () => Promise<void>;
  onDownloadSingle: (side: 'front' | 'back') => void;
  onDownloadFullSheet: () => Promise<void> | void;
}

export const PrintSheet: React.FC<PrintSheetProps> = ({
  frontCard,
  backCard,
  settings,
  language,
  onUpdateSettings,
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
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

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

  const frontSrc = frontCard.enhancedImage || frontCard.croppedImage;
  const backSrc = backCard.enhancedImage || backCard.croppedImage;

  if (!frontSrc && !backSrc) return null;

  // Handle PDF Download with user feedback
  const handlePdfDownload = async () => {
    setIsGeneratingPdf(true);
    try {
      await onDownloadPdf();
      setSuccessToast(
        isHi
          ? '✓ A4 PDF सफलतापूर्वक डाउनलोड हो गया!'
          : '✓ A4 PDF downloaded successfully!'
      );
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
      alert(
        isHi
          ? 'PDF बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'Failed to generate PDF. Please try again.'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle PNG sheet export
  const handlePngDownload = async () => {
    setIsGeneratingPng(true);
    try {
      await onDownloadFullSheet();
      setSuccessToast(
        isHi
          ? '✓ A4 HD इमेज डाउनलोड हो गई!'
          : '✓ A4 HD Sheet Image downloaded!'
      );
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('PNG export error:', err);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // Generate card pairs based on layout and copies
  const renderCardPair = (keyPrefix: string, frontUrl?: string | null, backUrl?: string | null) => {
    const cardStyle: React.CSSProperties = {
      width: `${settings.cardWidthMm}mm`,
      height: `${settings.cardHeightMm}mm`,
      borderRadius: '2mm',
    };

    const isGrayscale = settings.grayscalePrint;

    return (
      <div
        key={keyPrefix}
        className={`flex ${
          settings.layout === 'stacked'
            ? 'flex-col items-center'
            : 'flex-row items-center justify-center'
        }`}
        style={{
          gap: `${settings.gapMm}mm`,
        }}
      >
        {/* Front Card */}
        {settings.layout !== 'back-only' && frontUrl && (
          <div className="relative group">
            <div
              style={cardStyle}
              className={`bg-white overflow-hidden relative shadow-xs ${
                settings.showCutGuides ? 'border border-dashed border-slate-500' : 'border border-slate-300'
              } ${isGrayscale ? 'grayscale contrast-125' : ''}`}
            >
              <img
                src={frontUrl}
                alt="Front Card"
                className="w-full h-full object-cover"
              />
            </div>
            {settings.showScissors && (
              <div className="absolute -top-3.5 left-2 flex items-center gap-0.5 text-[9px] text-slate-500 pointer-events-none no-print">
                <Scissors className="w-3 h-3 rotate-90 text-blue-600" />
                <span className="font-mono">cut</span>
              </div>
            )}
          </div>
        )}

        {/* Back Card */}
        {settings.layout !== 'front-only' && backUrl && (
          <div className="relative group">
            <div
              style={cardStyle}
              className={`bg-white overflow-hidden relative shadow-xs ${
                settings.showCutGuides ? 'border border-dashed border-slate-500' : 'border border-slate-300'
              } ${isGrayscale ? 'grayscale contrast-125' : ''}`}
            >
              <img
                src={backUrl}
                alt="Back Card"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLayoutContent = () => {
    if (settings.layout === 'multi-copies') {
      return (
        <div
          className="flex flex-col items-center"
          style={{ gap: `${settings.gapMm + 6}mm` }}
        >
          {renderCardPair('pair-1', frontSrc, backSrc)}
          {renderCardPair('pair-2', frontSrc, backSrc)}
        </div>
      );
    }

    return renderCardPair('single-pair', frontSrc, backSrc);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-semibold text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300 border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Print Controls Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 no-print transition-colors">
        {/* Top Bar with Primary Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isHi ? 'A4 प्रिंट व PDF एक्सपोर्ट' : 'A4 Print & PDF Export'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isHi
                ? 'कार्ड्स ISO CR80 (86×54 mm) स्टैंडर्ड साइज़ में सटीक A4 शीट पर सेट हैं'
                : 'Formatted to exact ISO CR80 (86×54 mm) dimensions on standard A4'}
            </p>
          </div>

          {/* Primary Action Buttons: PDF, Print & PNG */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Primary Action: Direct PDF Download */}
            <button
              type="button"
              id="download-pdf-btn"
              onClick={handlePdfDownload}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title={isHi ? 'सीधा A4 PDF फाइल डाउनलोड करें' : 'Download direct A4 PDF file'}
            >
              <FileDown className="w-4 h-4" />
              <span>
                {isGeneratingPdf
                  ? isHi
                    ? 'PDF बन रहा है...'
                    : 'Generating PDF...'
                  : isHi
                    ? '📥 A4 PDF डाउनलोड करें'
                    : 'Download A4 PDF'}
              </span>
            </button>

            {/* Browser Print Button */}
            <button
              type="button"
              id="main-print-btn"
              onClick={onPrint}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              title={isHi ? 'ब्राउज़र से सीधा प्रिंट करें' : 'Print directly via browser'}
            >
              <Printer className="w-4 h-4" />
              <span>{isHi ? '🖨️ सीधा प्रिंट' : 'Print Sheet'}</span>
            </button>

            {/* Download A4 PNG */}
            <button
              type="button"
              id="download-sheet-btn"
              onClick={handlePngDownload}
              disabled={isGeneratingPng}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={isHi ? 'A4 शीट की 300 DPI HD इमेज डाउनलोड करें' : 'Download full A4 sheet PNG'}
            >
              <ImageIcon className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <span>{isGeneratingPng ? 'PNG...' : isHi ? 'HD इमेज' : 'Sheet PNG'}</span>
            </button>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Layout Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" />
              {isHi ? 'कार्ड लेआउट (Layout)' : 'Card Layout'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                id="layout-horizontal-btn"
                onClick={() => onUpdateSettings({ layout: 'side-by-side' })}
                className={`px-2 py-2 rounded-lg border text-[11px] font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  settings.layout === 'side-by-side'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
                title={isHi ? 'आजू-बाजू (लेमिनेशन फ़ोल्ड हेतु)' : 'Horizontal Side by Side'}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>{isHi ? 'आजू-बाजू' : 'Horizontal'}</span>
              </button>

              <button
                type="button"
                id="layout-vertical-btn"
                onClick={() => onUpdateSettings({ layout: 'stacked' })}
                className={`px-2 py-2 rounded-lg border text-[11px] font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  settings.layout === 'stacked'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
                title={isHi ? 'ऊपर-नीचे (2 कट)' : 'Top and Bottom'}
              >
                <Rows2 className="w-3.5 h-3.5" />
                <span>{isHi ? 'ऊपर-नीचे' : 'Vertical'}</span>
              </button>

              <button
                type="button"
                id="layout-multi-btn"
                onClick={() => onUpdateSettings({ layout: 'multi-copies' })}
                className={`px-2 py-2 rounded-lg border text-[11px] font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  settings.layout === 'multi-copies'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
                title={isHi ? 'एक साथ 2 सेट (4 कार्ड - कागज़ बचत)' : '2 Sets (4 Cards)'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isHi ? '2 सेट्स' : '2 Sets'}</span>
              </button>
            </div>
          </div>

          {/* 2. Card Dimensions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Maximize className="w-3.5 h-3.5 text-amber-500" />
              {isHi ? 'कार्ड साइज़ (Dimensions)' : 'Card Size'}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ cardWidthMm: 86, cardHeightMm: 54 })
                }
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
                onClick={() =>
                  onUpdateSettings({ cardWidthMm: 88, cardHeightMm: 56 })
                }
                className={`px-2 py-2 rounded-lg border text-[11px] font-semibold flex flex-col items-center cursor-pointer transition-all ${
                  settings.cardWidthMm === 88
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>88 × 56 mm</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">
                  {isHi ? 'लेमिनेशन पाउच' : 'Lamination'}
                </span>
              </button>
            </div>
          </div>

          {/* 3. Guidelines & Options */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-blue-600" />
              {isHi ? 'काटने के निशान & मोड' : 'Cut Marks & Mode'}
            </label>
            <div className="flex flex-col gap-1.5 pt-0.5">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.showCutGuides}
                  onChange={(e) =>
                    onUpdateSettings({ showCutGuides: e.target.checked })
                  }
                  className="rounded accent-blue-600 cursor-pointer"
                />
                <span>{isHi ? 'काटने हेतु डैश लाइन (Cut Guides)' : 'Dashed Cut Border'}</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.grayscalePrint}
                  onChange={(e) =>
                    onUpdateSettings({ grayscalePrint: e.target.checked })
                  }
                  className="rounded accent-blue-600 cursor-pointer"
                />
                <span>{isHi ? 'B&W ज़ेरॉक्स मोड (स्याही बचत)' : 'B&W Monochrome Print'}</span>
              </label>
            </div>
          </div>

          {/* 4. Top Margin & Spacing */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>{isHi ? 'ऊपर से मार्जिन (Top Margin)' : 'Top Margin'}</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{settings.topMarginMm} mm</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={settings.topMarginMm}
              onChange={(e) =>
                onUpdateSettings({ topMarginMm: Number(e.target.value) })
              }
              className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => onUpdateSettings({ topMarginMm: 10 })}
                className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              >
                10mm
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ topMarginMm: 20 })}
                className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer font-bold text-slate-700 dark:text-slate-200"
              >
                {isHi ? '20mm (डिफ़ॉल्ट)' : '20mm (Default)'}
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ topMarginMm: 40 })}
                className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              >
                40mm
              </button>
            </div>
          </div>
        </div>

        {/* Individual Download Shortcuts & Preview Controls */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>{isHi ? 'अलग से कार्ड फाइल डाउनलोड करें:' : 'Save single card:'}</span>
            {frontSrc && (
              <button
                type="button"
                onClick={() => onDownloadSingle('front')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{isHi ? 'सामने (Front) HD' : 'Front HD'}</span>
              </button>
            )}
            {backSrc && (
              <button
                type="button"
                onClick={() => onDownloadSingle('back')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{isHi ? 'पीछे (Back) HD' : 'Back HD'}</span>
              </button>
            )}
          </div>

          {/* Scale / Zoom controls for Sheet Preview */}
          <div className="flex items-center gap-2">
            <span className="text-[11px]">{isHi ? 'शीट प्रिव्यू ज़ूम:' : 'Preview Zoom:'}</span>
            <button
              type="button"
              onClick={() => setSheetScale(sheetScale === 'fit' ? '100' : 'fit')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              {sheetScale === 'fit' ? <ZoomIn className="w-3 h-3 text-blue-600" /> : <ZoomOut className="w-3 h-3 text-blue-600" />}
              <span>{sheetScale === 'fit' ? (isHi ? '100% वास्तविक साइज़' : '100% Actual Size') : (isHi ? 'स्क्रीन में फिट करें' : 'Fit to Screen')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live A4 Print Sheet Container */}
      <div
        ref={previewContainerRef}
        className="w-full flex flex-col items-center justify-center p-2 sm:p-6 bg-slate-200/60 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 sm:mb-3 flex items-center justify-between w-full no-print font-medium px-1">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>
              {isHi
                ? 'A4 शीट (210 × 297 mm) लाइव प्रिव्यू'
                : 'A4 Sheet (210 × 297 mm) Live Preview'}
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
              minHeight: '297mm',
              paddingTop: `${settings.topMarginMm}mm`,
              paddingLeft: `${settings.leftMarginMm}mm`,
              paddingRight: `${settings.leftMarginMm}mm`,
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              transform: sheetScale === 'fit' && fitScale < 1 ? `scale(${fitScale})` : 'scale(1)',
              marginBottom: sheetScale === 'fit' && fitScale < 1 ? `-${Math.round(1123 * (1 - fitScale))}px` : '0',
            }}
          >
            {renderLayoutContent()}

            {/* Subtle sheet watermark footer for A4 visual realism */}
            <div className="absolute bottom-3 left-0 right-0 text-center text-[8px] text-slate-400 pointer-events-none font-mono">
              Prakash Print Studio • ISO CR80 (86×54mm) • A4 (210×297mm)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
