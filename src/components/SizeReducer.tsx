import React, { useState, useRef } from 'react';
import {
  Upload,
  FileDown,
  Sparkles,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Eye,
  Check,
  Zap,
  Info,
  ShieldCheck,
  ZoomIn,
  X
} from 'lucide-react';
import { Language } from '../types';
import {
  compressImageToTargetSize,
  compressPdfToTargetSize,
  formatFileSize,
  CompressionResult,
} from '../utils/compressEngine';
import { PDFDocument, rgb } from 'pdf-lib';

interface SizeReducerProps {
  language: Language;
}

export const SizeReducer: React.FC<SizeReducerProps> = ({ language }) => {
  const isHi = language === 'hi';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [targetSizeInput, setTargetSizeInput] = useState<string>('200');
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('KB');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showZoomModal, setShowZoomModal] = useState<boolean>(false);

  // Common preset targets for Cyber Cafes & Govt Job Portals
  const presets = [
    { label: isHi ? '20 KB (हस्ताक्षर)' : '20 KB (Sign)', value: '20', unit: 'KB' as const },
    { label: isHi ? '50 KB (फ़ोटो)' : '50 KB (Photo)', value: '50', unit: 'KB' as const },
    { label: isHi ? '100 KB (फॉर्म)' : '100 KB (Govt Form)', value: '100', unit: 'KB' as const },
    { label: isHi ? '200 KB (सर्टिफिकेट/PDF)' : '200 KB (Certificate/PDF)', value: '200', unit: 'KB' as const },
    { label: isHi ? '500 KB (दस्तावेज़)' : '500 KB (Document)', value: '500', unit: 'KB' as const },
    { label: isHi ? '1 MB (ईमेल/पोर्टल)' : '1 MB (Email)', value: '1', unit: 'MB' as const },
  ];

  // Handle file selection
  const handleFile = (file: File) => {
    setSelectedFile(file);
    setResult(null);

    // Generate local preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setFilePreview('pdf');
    } else {
      setFilePreview(null);
    }

    // Default target: for PDF, set 200 KB if empty
    if (file.type === 'application/pdf' && (!targetSizeInput || targetSizeInput === '')) {
      setTargetSizeInput('200');
      setTargetUnit('KB');
    }
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Demo Sample 1: 5MB High-Res Document Photo
  const handleLoadSamplePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 3200;
    canvas.height = 2400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Realistic paper texture
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 3200, 2400);

    // Subtle scanner shadow / noise
    for (let i = 0; i < 20000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(200, 210, 220, 0.15)' : 'rgba(230, 240, 250, 0.2)';
      ctx.fillRect(Math.random() * 3200, Math.random() * 2400, 2, 2);
    }

    // Header Emblem / Title
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('GOVERNMENT APPLICANT IDENTITY CARD & CERTIFICATE', 180, 240);

    ctx.fillStyle = '#0f172a';
    ctx.font = '500 42px sans-serif';
    ctx.fillText('Candidate Name: Rajesh Kumar Verma', 180, 380);
    ctx.fillText('Roll Number / Reg ID: 2026-SSC-9874120', 180, 460);
    ctx.fillText('DOB: 14/08/1997  •  Category: General  •  State: Uttar Pradesh', 180, 540);
    ctx.fillText('Verification Authority: Regional Examination Directorate', 180, 620);

    // Decorative Table
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(180, 720, 2840, 800);
    ctx.beginPath();
    ctx.moveTo(180, 820);
    ctx.lineTo(3020, 820);
    ctx.moveTo(180, 920);
    ctx.lineTo(3020, 920);
    ctx.moveTo(180, 1020);
    ctx.lineTo(3020, 1020);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('Subject / Document Code       Score / Status       Verification Date', 220, 780);
    ctx.font = 'normal 32px monospace';
    ctx.fillText('101 - General Intelligence    89.5% [VERIFIED]     12-JAN-2026', 220, 880);
    ctx.fillText('102 - Quantitative Aptitude   94.0% [VERIFIED]     12-JAN-2026', 220, 980);
    ctx.fillText('103 - English Comprehension   88.0% [VERIFIED]     12-JAN-2026', 220, 1080);

    // Photo Box
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(2300, 240, 500, 600);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeRect(2300, 240, 500, 600);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('APPLICANT PHOTO', 2360, 550);

    // Barcode
    ctx.fillStyle = '#000000';
    for (let x = 180; x < 1200; x += Math.random() * 12 + 6) {
      ctx.fillRect(x, 1650, 4, 180);
    }
    ctx.font = 'bold 30px monospace';
    ctx.fillText('*2026-9874-1209-X9*', 400, 1880);

    // Footer notice
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 32px sans-serif';
    ctx.fillText('This document is electronically verified. Keep safe for cyber cafe printing.', 180, 2100);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const sampleFile = new File([blob], 'sample_document_5mb_photo.jpg', { type: 'image/jpeg' });
      handleFile(sampleFile);
      setTargetSizeInput('50');
      setTargetUnit('KB');
    }, 'image/jpeg', 1.0);
  };

  // Demo Sample 2: 4.6MB Multi-Page High-Res PDF
  const handleLoadSamplePdf = async () => {
    setIsProcessing(true);
    setProgressMsg(isHi ? '4.6MB का सैंपल PDF तैयार हो रहा है...' : 'Generating 4.6MB Sample PDF...');

    try {
      const pdf = await PDFDocument.create();

      // We create a realistic multi-page PDF with high-resolution image embeds to reach ~4.6 MB
      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 3400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pageTitles = [
        'CENTRAL EMPLOYMENT NOTIFICATION & CERTIFICATE (PAGE 1)',
        'ACADEMIC MARKSHEET & VERIFICATION RECORD (PAGE 2)',
        'DOMICILE & CATEGORY CERTIFICATE (PAGE 3)',
      ];

      for (let p = 0; p < 3; p++) {
        // High density visual content
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 2400, 3400);

        // Header
        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'bold 64px sans-serif';
        ctx.fillText(pageTitles[p], 140, 200);

        // Watermark emblem
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(1200, 1700, 600, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText(`Application Reference ID: 2026/CYBER/DOC/P${p + 1}`, 140, 320);
        ctx.fillText(`Candidate Name: Rajesh Kumar Verma`, 140, 400);
        ctx.fillText(`Center Code: UP-LKO-4089`, 140, 480);

        // Realistic paragraph blocks
        ctx.fillStyle = '#334155';
        ctx.font = '32px sans-serif';
        const dummyText =
          'This document certifies that the candidate has satisfied all preliminary background and document scrutiny requirements as per standard cyber cafe print guidelines. The text and numeric figures contained herein must remain 100% crisp and readable when compressed to target file size.';
        ctx.fillText(dummyText.substring(0, 75), 140, 600);
        ctx.fillText(dummyText.substring(75, 155), 140, 660);
        ctx.fillText(dummyText.substring(155), 140, 720);

        // High resolution textured table
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.strokeRect(140, 800, 2120, 1200);

        for (let row = 0; row < 12; row++) {
          const y = 800 + row * 100;
          ctx.beginPath();
          ctx.moveTo(140, y);
          ctx.lineTo(2260, y);
          ctx.stroke();

          ctx.fillStyle = row === 0 ? '#1e3a8a' : '#1e293b';
          ctx.font = row === 0 ? 'bold 32px monospace' : '30px monospace';
          ctx.fillText(
            `Serial #0${row + 1}   Index Code: REF-${row * 145 + 32}   Status: VERIFIED & CONFIRMED   Score: ${85 + row}%`,
            160,
            y - 35
          );
        }

        // Add some noise / detailed photo block on page to increase raw byte size naturally
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(140, 2100, 2120, 800);
        ctx.fillStyle = '#0284c7';
        for (let k = 0; k < 15000; k++) {
          ctx.fillRect(140 + Math.random() * 2120, 2100 + Math.random() * 800, 3, 3);
        }

        // Convert page canvas to high-res jpeg bytes
        const pageBlob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.96)
        );
        const pageBuffer = await pageBlob.arrayBuffer();
        const embeddedImg = await pdf.embedJpg(pageBuffer);

        const page = pdf.addPage([595.28, 841.89]); // A4 in points
        page.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: 595.28,
          height: 841.89,
        });
      }

      const pdfBytes = await pdf.save();
      const samplePdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const sampleFile = new File([samplePdfBlob], 'sample_document_4.6mb.pdf', { type: 'application/pdf' });

      handleFile(sampleFile);
      setTargetSizeInput('200');
      setTargetUnit('KB');
    } catch (err) {
      console.error('Failed to create sample PDF:', err);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // Trigger compression
  const handleCompress = async () => {
    if (!selectedFile) return;

    const num = parseFloat(targetSizeInput);
    if (isNaN(num) || num <= 0) {
      alert(isHi ? 'कृपया मान्य लक्ष्य साइज़ (Target Size) दर्ज करें।' : 'Please enter a valid target size.');
      return;
    }

    const multiplier = targetUnit === 'MB' ? 1024 * 1024 : 1024;
    const targetBytes = Math.round(num * multiplier);

    setIsProcessing(true);
    setProgressMsg(isHi ? 'साइज़ कम किया जा रहा है...' : 'Compressing to target size...');

    try {
      if (selectedFile.type === 'application/pdf') {
        const res = await compressPdfToTargetSize(selectedFile, targetBytes, setProgressMsg);
        setResult(res);
      } else {
        const res = await compressImageToTargetSize(selectedFile, targetBytes, setProgressMsg);
        setResult(res);
      }
    } catch (err) {
      console.error('Compression error:', err);
      alert(
        isHi
          ? 'फ़ाइल कंप्रेस करने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'Compression failed. Please try another size.'
      );
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // Trigger Download
  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset
  const handleReset = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setResult(null);
    setTargetSizeInput('200');
    setTargetUnit('KB');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
              <Zap className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {isHi ? 'सटीक फ़ोटो व PDF साइज़ रिड्यूसर' : 'Target Size Photo & PDF Compressor'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isHi
              ? '4.6MB या 10MB की PDF व फ़ोटो को सटीक 200KB, 100KB, 50KB में कम करें बिना किसी धुंधलेपन के।'
              : 'Reduce 4.6MB or 10MB PDFs & Photos to exact 200KB, 100KB, or 50KB with razor-sharp clarity.'}
          </p>
        </div>

        {/* Demo Sample Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="try-sample-pdf-btn"
            onClick={handleLoadSamplePdf}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title={isHi ? '4.6MB का सैंपल PDF तुरंत लोड करें' : 'Try 4.6MB Sample PDF'}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{isHi ? 'सैंपल 4.6MB PDF' : 'Sample PDF'}</span>
          </button>

          <button
            type="button"
            id="try-sample-photo-btn"
            onClick={handleLoadSamplePhoto}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title={isHi ? 'सैंपल 5MB फ़ोटो लोड करें' : 'Try sample 5MB photo'}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{isHi ? 'सैंपल फ़ोटो' : 'Sample Photo'}</span>
          </button>

          {selectedFile && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{isHi ? 'नया' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Upload Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={handleDrop}
            onClick={() => {
              if (!selectedFile) fileInputRef.current?.click();
            }}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                : selectedFile
                  ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs'
                  : 'border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/20 dark:bg-slate-900/60 dark:border-slate-800 dark:hover:bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                    {selectedFile.type === 'application/pdf' ? (
                      <FileText className="w-6 h-6 text-rose-500" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[220px] sm:max-w-xs">
                      {selectedFile.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isHi ? 'मूल साइज़:' : 'Original Size:'}{' '}
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {isHi ? 'फ़ाइल बदलें' : 'Change'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-slate-500 dark:text-slate-400 space-y-2 select-none">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {isHi ? 'यहाँ PDF या फ़ोटो ड्रैग करें या क्लिक करके चुनें' : 'Drag & drop PDF or Photo here, or click to browse'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHi
                    ? 'PDF, JPG, PNG, WEBP (4.6MB, 10MB या कितनी भी बड़ी फ़ाइल)'
                    : 'PDF, JPG, PNG, WEBP (4.6MB, 10MB, or any size file)'}
                </p>
              </div>
            )}
          </div>

          {/* Target Size Input Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{isHi ? 'मनचाहा लक्ष्य साइज़ दर्ज करें (Target Size):' : 'Enter Target File Size:'}</span>
              </label>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                {isHi ? 'गारंटीड रिडक्शन' : 'Guaranteed Target'}
              </span>
            </div>

            {/* Input and Unit Selector */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="5"
                  max="50000"
                  value={targetSizeInput}
                  onChange={(e) => setTargetSizeInput(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 dark:text-white tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 dark:text-slate-400 pointer-events-none">
                  {targetUnit}
                </span>
              </div>

              {/* Unit Toggle: KB / MB */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTargetUnit('KB')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    targetUnit === 'KB'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  KB
                </button>
                <button
                  type="button"
                  onClick={() => setTargetUnit('MB')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    targetUnit === 'MB'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  MB
                </button>
              </div>
            </div>

            {/* Common Indian Govt & Cyber Cafe Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                {isHi ? 'लोकप्रिय प्रीसेट्स (क्विक सेलेक्ट):' : 'Popular Target Presets:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTargetSizeInput(preset.value);
                      setTargetUnit(preset.unit);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                      targetSizeInput === preset.value && targetUnit === preset.unit
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {targetSizeInput === preset.value && targetUnit === preset.unit && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Clarity Guarantee Badge */}
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-2.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>
                {isHi
                  ? 'शार्पनेस व टेक्स्ट एन्हांसर सक्रिय: बैकग्राउंड नॉइज़ हटाकर टेक्स्ट व अक्षरों को बिल्कुल स्पष्ट रखा जाता है।'
                  : 'Clarity Enhancer Active: Background noise removed so text & numbers stay 100% sharp and readable.'}
              </span>
            </div>

            {/* Compress Action Button */}
            <div className="pt-2">
              <button
                type="button"
                id="start-compress-btn"
                onClick={handleCompress}
                disabled={!selectedFile || isProcessing}
                className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{progressMsg || (isHi ? 'कंप्रेस हो रहा है...' : 'Compressing...')}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>
                      {isHi
                        ? `⚡ ${targetSizeInput} ${targetUnit} में साइज़ कम करें`
                        : `⚡ Compress to ${targetSizeInput} ${targetUnit}`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Result, Details & Download (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {result ? (
            <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in zoom-in-95">
              {/* Success Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isHi ? 'सटीक साइज़ तैयार है!' : 'Target Size Achieved!'}</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                  {result.reductionPercentage}% {isHi ? 'कम हुआ' : 'Saved'}
                </span>
              </div>

              {/* Size Stats Comparison */}
              <div className="grid grid-cols-2 gap-3">
                {/* Original */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
                    {isHi ? 'पहले का साइज़' : 'Original Size'}
                  </span>
                  <span className="text-sm font-bold text-slate-400 line-through">
                    {formatFileSize(result.originalSizeBytes)}
                  </span>
                </div>

                {/* Achieved */}
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 text-center">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block mb-0.5">
                    {isHi ? 'हासिल किया गया साइज़' : 'New Achieved Size'}
                  </span>
                  <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatFileSize(result.compressedSizeBytes)}
                  </span>
                </div>
              </div>

              {/* Target Limit Status Notification */}
              <div className="bg-emerald-50/60 dark:bg-slate-950/70 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>
                  {isHi
                    ? `सत्यापित: साइज़ ${formatFileSize(result.compressedSizeBytes)} है (लक्ष्य ${formatFileSize(result.targetSizeBytes)} के अंदर)`
                    : `Verified: File is ${formatFileSize(result.compressedSizeBytes)} (Under requested ${formatFileSize(result.targetSizeBytes)})`}
                </span>
              </div>

              {/* Visual Preview Area (Works for both Photo and PDF Page 1) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                    <span>
                      {result.fileType === 'pdf'
                        ? isHi
                          ? `PDF पृष्ठ 1 स्पष्टता प्रिव्यू (${result.pageCount} पेज कुल)`
                          : `PDF Page 1 Clarity Preview (${result.pageCount} pages total)`
                        : isHi
                          ? 'फ़ोटो स्पष्टता प्रिव्यू'
                          : 'Photo Clarity Preview'}
                    </span>
                  </span>

                  {(result.page1PreviewUrl || result.dataUrl) && (
                    <button
                      type="button"
                      onClick={() => setShowZoomModal(true)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <ZoomIn className="w-3 h-3" />
                      <span>{isHi ? 'बड़ा देखें' : 'Zoom In'}</span>
                    </button>
                  )}
                </div>

                {/* Preview Frame */}
                <div
                  onClick={() => setShowZoomModal(true)}
                  className="w-full aspect-[1.4/1] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 relative flex items-center justify-center cursor-pointer group shadow-inner"
                >
                  <img
                    src={result.page1PreviewUrl || result.dataUrl}
                    alt="Document Preview"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-xs text-white font-semibold">
                    <ZoomIn className="w-4 h-4" />
                    <span>{isHi ? 'टेक्स्ट स्पष्टता ज़ूम करें' : 'Click to inspect text'}</span>
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 backdrop-blur-xs font-mono shadow-xs">
                    {formatFileSize(result.compressedSizeBytes)}
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button
                type="button"
                id="download-reduced-file-btn"
                onClick={handleDownload}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>
                  {isHi
                    ? `📥 ${result.fileName} डाउनलोड करें`
                    : `📥 Download Reduced File (${formatFileSize(result.compressedSizeBytes)})`}
                </span>
              </button>
            </div>
          ) : (
            /* Empty State Guide */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xs transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-500/20">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {isHi ? 'कंप्रेस परिणाम यहाँ दिखेगा' : 'Result will appear here'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {isHi
                    ? '4.6MB या 10MB की PDF/फ़ोटो अपलोड करें और लक्ष्य साइज़ (जैसे 200 KB) डालकर "साइज़ कम करें" बटन दबाएं।'
                    : 'Upload 4.6MB or 10MB PDF/photo, enter target size (e.g. 200 KB), and click Compress.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-left space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isHi ? 'सरकारी पोर्टल्स हेतु 100% उपयुक्त' : 'Govt Form & Cyber Cafe Ready'}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11.5px]">
                  {isHi
                    ? 'एसएससी, यूपीएससी, राज्य सेवा, पैन, पासपोर्ट व छात्रवृत्ति फॉर्म में रिजेक्ट नहीं होगा। टेक्स्ट व आंकड़े बिल्कुल साफ़ रहते हैं।'
                    : 'Guaranteed to pass portal upload checks without blurred letters or numbers.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Zoom Inspection Modal */}
      {showZoomModal && result && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ZoomIn className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isHi ? 'दस्तावेज़ स्पष्टता निरीक्षण (100% क्लैरिटी चेक)' : 'Document Clarity Inspection'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowZoomModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image View */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
              <img
                src={result.page1PreviewUrl || result.dataUrl}
                alt="High Resolution Inspect"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md border border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>
                {isHi ? 'अंतिम साइज़:' : 'Final Size:'}{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatFileSize(result.compressedSizeBytes)}</strong>
              </span>
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer"
              >
                {isHi ? 'फ़ाइल डाउनलोड करें' : 'Download File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
