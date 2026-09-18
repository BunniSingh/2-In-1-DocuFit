import React from 'react';
import {
  Printer,
  Sparkles,
  RefreshCw,
  Globe,
  Zap,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';
import { Language, NavTab, ThemeMode } from '../types';

interface HeaderProps {
  language: Language;
  theme: ThemeMode;
  activeNavTab: NavTab;
  onSelectNavTab: (tab: NavTab) => void;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onLoadDemo: () => void;
  onResetAll: () => void;
  hasCards: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  theme,
  activeNavTab,
  onSelectNavTab,
  onToggleLanguage,
  onToggleTheme,
  onLoadDemo,
  onResetAll,
  hasCards,
}) => {
  const isHi = language === 'hi';
  const isDark = theme === 'dark';

  return (
    <header className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-xs transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex flex-col gap-3">
        {/* Top Row: Brand & System Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              {activeNavTab === 'card-print' ? (
                <Printer className="w-5 h-5" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {isHi ? 'प्रकाश प्रिंट स्टूडियो' : 'Prakash Print Studio'}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isHi ? 'तैयार' : 'Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {isHi
                  ? 'स्मार्ट ID कार्ड A4 प्रिंट & सटीक फ़ोटो/PDF साइज़ रिड्यूसर'
                  : 'Smart ID Card A4 Print & Target-Size Photo/PDF Compressor'}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center flex-wrap gap-2 justify-center">
            {/* Demo Button (only on card print tab) */}
            {activeNavTab === 'card-print' && (
              <button
                type="button"
                id="demo-btn"
                onClick={onLoadDemo}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title={isHi ? 'सैंपल कार्ड लोड करके तुरंत टेस्ट करें' : 'Load sample cards to test'}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{isHi ? 'डेमो कार्ड' : 'Demo Card'}</span>
              </button>
            )}

            {/* Reset All (only when cards exist and on card print tab) */}
            {activeNavTab === 'card-print' && hasCards && (
              <button
                type="button"
                id="reset-all-btn"
                onClick={onResetAll}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title={isHi ? 'सभी कार्ड हटाएँ' : 'Clear all cards'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isHi ? 'नया कार्ड' : 'Reset'}</span>
              </button>
            )}

            {/* Theme Toggle (Light / Dark) */}
            <button
              type="button"
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title={isDark ? (isHi ? 'लाइट मोड चालू करें' : 'Switch to Light Mode') : (isHi ? 'डार्क मोड चालू करें' : 'Switch to Dark Mode')}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              type="button"
              id="lang-toggle-btn"
              onClick={onToggleLanguage}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title={isHi ? 'Switch to English' : 'हिन्दी में बदलें'}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
              <span>{isHi ? 'English' : 'हिन्दी'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Main Navigation Tabs */}
        <div className="flex items-center justify-center sm:justify-start pt-1 border-t border-slate-100 dark:border-slate-800">
          <nav className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            {/* Tab 1: ID Card Print Studio */}
            <button
              type="button"
              id="nav-tab-card-print"
              onClick={() => onSelectNavTab('card-print')}
              className={`px-2.5 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 ${
                activeNavTab === 'card-print'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Printer className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{isHi ? '1. ID कार्ड प्रिंट' : '1. Card Print'}</span>
            </button>

            {/* Tab 2: Photo & PDF Size Reducer */}
            <button
              type="button"
              id="nav-tab-size-reducer"
              onClick={() => onSelectNavTab('size-reducer')}
              className={`px-2.5 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 ${
                activeNavTab === 'size-reducer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{isHi ? '2. साइज़ कम करें' : '2. Size Reducer'}</span>
              <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase hidden xs:inline ${
                activeNavTab === 'size-reducer'
                  ? 'bg-blue-800 text-white'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
              }`}>
                {isHi ? 'सटीक' : 'Exact'}
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
