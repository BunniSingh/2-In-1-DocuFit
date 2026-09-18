export interface Point {
  x: number;
  y: number;
}

export type CardSideType = 'front' | 'back';

export interface ImageAdjustments {
  mode: 'original' | 'document' | 'high-contrast' | 'xerox';
  brightness: number; // -50 to 50, default 0
  contrast: number; // -50 to 50, default 0
  sharpness: boolean;
}

export interface CardState {
  originalImage: string | null; // data URL or object URL
  croppedImage: string | null;
  enhancedImage: string | null;
  cropPoints: Point[] | null; // normalized 0-1 or canvas coordinates
  rotation: number; // 0, 90, 180, 270
  adjustments: ImageAdjustments;
  fileName: string | null;
}

export type PrintLayoutType = 'side-by-side' | 'stacked' | 'multi-copies' | 'front-only' | 'back-only';

export type CardSizePreset = 'standard' | 'lamination' | 'custom';

export interface PrintSettings {
  layout: PrintLayoutType;
  copies: number; // 1 to 5
  cardWidthMm: number; // default 86
  cardHeightMm: number; // default 54
  gapMm: number; // gap between cards, default 8
  topMarginMm: number; // margin from top of page, default 20
  leftMarginMm: number; // default 15
  showCutGuides: boolean;
  showScissors: boolean;
  grayscalePrint: boolean;
}

export type Language = 'hi' | 'en';

export type NavTab = 'card-print' | 'size-reducer';

export type ThemeMode = 'light' | 'dark';
