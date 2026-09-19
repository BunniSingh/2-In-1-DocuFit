import { CardPairItem, CardPairMargin, CardState, ImageAdjustments, RenderCardItem } from '../types';

export const initialAdjustments: ImageAdjustments = {
  mode: 'original',
  brightness: 0,
  contrast: 0,
  sharpness: false,
};

export const initialCardState: CardState = {
  originalImage: null,
  croppedImage: null,
  enhancedImage: null,
  cropPoints: null,
  rotation: 0,
  adjustments: initialAdjustments,
  fileName: null,
};

/**
 * Returns mathematically balanced default margins for up to 4 pairs on an A4 sheet.
 * A4 height is 297mm; Card height is 54mm.
 * 4 rows fit with 10mm vertical gap between rows and 15mm left margin (centered horizontally: 15 + 86 + 8 + 86 = 195mm < 210mm).
 */
export function getDefaultPairMargin(
  pairIndex: number,
  cardWidthMm: number = 86
): CardPairMargin {
  const rowTops = [14, 78, 142, 206];
  const topMm = rowTops[pairIndex] ?? 14 + pairIndex * 64;
  const leftMm = 15;
  const gapMm = 8;
  const backLeftMm = leftMm + cardWidthMm + gapMm; // 15 + 86 + 8 = 109mm

  return {
    topMm,
    leftMm,
    gapMm,
    independentBack: false,
    backTopMm: topMm,
    backLeftMm,
  };
}

/**
 * Creates a brand new empty pair.
 */
export function createNewPair(pairIndex: number): CardPairItem {
  const num = pairIndex + 1;
  return {
    id: `pair-${Date.now()}-${num}`,
    label: `Pair ${num}`,
    front: { ...initialCardState },
    back: { ...initialCardState },
    margin: getDefaultPairMargin(pairIndex),
  };
}

export function hasCardImage(state?: CardState | null): boolean {
  if (!state) return false;
  return Boolean(state.enhancedImage || state.croppedImage || state.originalImage);
}

export interface FlatCardOptions {
  onlyWithImages?: boolean; // default true: removes reserved space from page
  autoCenterOdd?: boolean; // default true: aligns single/odd card in horizontal center (62mm)
}

/**
 * Flattens an array of CardPairItems into RenderCardItem[]
 * with exact millimeter positions on the A4 sheet.
 * - Removes reserved blank space from un-uploaded cards
 * - Auto-aligns single/odd cards in the center (e.g. 1 card or 3rd card centered at 62mm)
 */
export function getFlatCardsFromPairs(
  pairs: CardPairItem[],
  cardWidthMm: number = 86,
  options?: FlatCardOptions
): RenderCardItem[] {
  const onlyWithImages = options?.onlyWithImages !== false; // default true
  const autoCenterOdd = options?.autoCenterOdd !== false; // default true

  // A4 sheet width is 210mm. Center X coordinate is (210 - cardWidthMm) / 2
  const centerLeftMm = Number(((210 - cardWidthMm) / 2).toFixed(1)); // 62.0 mm for standard 86mm card

  interface CardCandidate {
    id: string;
    pairId: string;
    side: 'front' | 'back';
    pairLabel: string;
    label: string;
    state: CardState;
    pairMargin: CardPairMargin;
    pairIndex: number;
    hasImage: boolean;
  }

  const allCandidates: CardCandidate[] = [];

  pairs.forEach((pair, pairIdx) => {
    // Front candidate
    allCandidates.push({
      id: `${pair.id}-front`,
      pairId: pair.id,
      side: 'front',
      pairLabel: pair.label,
      label: `${pair.label} (Front)`,
      state: pair.front,
      pairMargin: pair.margin,
      pairIndex: pairIdx,
      hasImage: hasCardImage(pair.front),
    });

    // Back candidate
    allCandidates.push({
      id: `${pair.id}-back`,
      pairId: pair.id,
      side: 'back',
      pairLabel: pair.label,
      label: `${pair.label} (Back)`,
      state: pair.back,
      pairMargin: pair.margin,
      pairIndex: pairIdx,
      hasImage: hasCardImage(pair.back),
    });
  });

  // Filter candidates if onlyWithImages is true (removes reserved space)
  const activeCandidates = onlyWithImages
    ? allCandidates.filter((c) => c.hasImage)
    : allCandidates;

  const totalActive = activeCandidates.length;
  const result: RenderCardItem[] = [];

  const defaultRowTops = [14, 78, 142, 206];

  for (let idx = 0; idx < totalActive; idx++) {
    const candidate = activeCandidates[idx];
    const rowIndex = Math.floor(idx / 2);
    const colIndex = idx % 2; // 0 = left, 1 = right

    // Determine row top
    const rowTopMm =
      pairs[rowIndex]?.margin?.topMm ??
      candidate.pairMargin?.topMm ??
      defaultRowTops[rowIndex] ??
      (14 + rowIndex * 64);

    let topMm = rowTopMm;
    let leftMm: number;

    // Check if this card is alone on its row (first column and the very last uploaded card)
    const isSingleOnRow = colIndex === 0 && idx === totalActive - 1;

    if (candidate.side === 'back' && candidate.pairMargin.independentBack) {
      topMm = candidate.pairMargin.backTopMm;
      leftMm = candidate.pairMargin.backLeftMm;
    } else if (isSingleOnRow && autoCenterOdd) {
      // CENTER ALIGN the odd/single card (e.g. 1 card -> centered; 3 cards -> 3rd card centered at 62mm)
      leftMm = centerLeftMm;
    } else if (colIndex === 0) {
      // Left column
      leftMm = candidate.pairMargin?.leftMm ?? 15;
    } else {
      // Right column
      const baseLeft = candidate.pairMargin?.leftMm ?? 15;
      const gap = candidate.pairMargin?.gapMm ?? 8;
      leftMm = baseLeft + cardWidthMm + gap;
    }

    result.push({
      id: candidate.id,
      pairId: candidate.pairId,
      side: candidate.side,
      pairLabel: candidate.pairLabel,
      label: candidate.label,
      state: candidate.state,
      margin: {
        topMm,
        leftMm,
      },
    });
  }

  return result;
}
