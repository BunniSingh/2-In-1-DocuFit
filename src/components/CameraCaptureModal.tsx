import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, X, AlertCircle } from 'lucide-react';
import { Language } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardSide: 'front' | 'back';
  language: Language;
  onCapture: (dataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  cardSide,
  language,
  onCapture,
}) => {
  const isHi = language === 'hi';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;
    setErrorMsg(null);

    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      .then((s) => {
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        console.warn('Camera access error:', err);
        setErrorMsg(
          isHi
            ? 'कैमरा खोलने की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में कैमरा अनुमति दें या फ़ाइल अपलोड करें।'
            : 'Camera access denied or unavailable. Please grant permission or choose file upload.'
        );
      });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode, isHi]);

  const handleSnap = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    onCapture(dataUrl);
    onClose();
  };

  const handleToggleFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {cardSide === 'front'
                ? isHi
                  ? 'सामने का भाग (Front) फ़ोटो खींचें'
                  : 'Capture Front Side Photo'
                : isHi
                  ? 'पीछे का भाग (Back) फ़ोटो खींचें'
                  : 'Capture Back Side Photo'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 relative overflow-hidden min-h-[320px]">
          {errorMsg ? (
            <div className="text-center p-6 space-y-3 max-w-sm">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-xs text-slate-600 dark:text-slate-300">{errorMsg}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                {isHi ? 'वापस जाएँ' : 'Back to Upload'}
              </button>
            </div>
          ) : (
            <div className="relative w-full max-w-md aspect-[4/3] rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-black flex items-center justify-center shadow-md">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* ID Card Guide Frame Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-full aspect-[1.586/1] border-2 border-dashed border-blue-400 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] relative flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white bg-slate-900/85 px-2.5 py-1 rounded-md border border-white/20">
                    {isHi ? 'कार्ड को यहाँ फ्रेम में रखें' : 'Align card inside frame'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {!errorMsg && (
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <button
              type="button"
              onClick={handleToggleFacing}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title={isHi ? 'कैमरा बदलें' : 'Switch Camera'}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">{isHi ? 'कैमरा बदलें' : 'Flip'}</span>
            </button>

            <button
              type="button"
              onClick={handleSnap}
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{isHi ? 'फ़ोटो खींचें' : 'Take Photo'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
