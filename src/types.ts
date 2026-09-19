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

export interface CardMargin {
  topMm: number; // Top margin in millimeters
  leftMm: number; // Left margin in millimeters
}

export interface CardPairMargin {
  topMm: number; // Front card top margin in mm
  leftMm: number; // Front card left margin in mm
  gapMm: number; // Gap between front and back in mm (default 8)
  independentBack: boolean; // if true, back card uses independent backTopMm & backLeftMm
  backTopMm: number;
  backLeftMm: number;
}

export interface CardPairItem {
  id: string; // unique identifier e.g. 'pair-1', 'pair-2', 'pair-3', 'pair-4'
  label: string; // e.g. 'Pair 1', 'Card Pair 1 (Aadhaar)'
  front: CardState;
  back: CardState;
  margin: CardPairMargin;
}

export interface CardItem {
  id: string; // unique identifier e.g. 'card-1'
  label: string; // e.g. 'Card 1 (Front)', 'Card 2 (Back)'
  state: CardState;
  margin: CardMargin;
}

export interface RenderCardItem extends CardItem {
  pairId: string;
  side: 'front' | 'back';
  pairLabel: string;
}

export type PrintLayoutType = 'side-by-side' | 'stacked' | 'multi-copies' | 'front-only' | 'back-only' | 'custom-margins';

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
  autoCenterOddCard?: boolean; // Align single/odd card in horizontal center (62mm)
}

export type Language = 'hi' | 'en';

export type NavTab = 'card-print' | 'size-reducer';

export type ThemeMode = 'light' | 'dark';
