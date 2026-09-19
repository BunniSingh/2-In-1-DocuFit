import { CardItem, CardPairItem, PrintSettings, RenderCardItem } from '../types';
import { getFlatCardsFromPairs } from './pairUtils';

/**
 * Renders the A4 print layout onto an ultra-crisp 300 DPI canvas (2480 x 3508 px)
 * and triggers download of the image file.
 * Supports:
 * - Dynamic list of up to 4 card pairs (up to 8 cards), each with separate customizable margins
 * - Backwards compatibility with CardItem[] or frontUrl/backUrl
 */
export async function exportA4SheetAsImage(
  cardsOrPairsOrFront: CardPairItem[] | CardItem[] | string | null,
  backUrlOrSettings?: string | null | PrintSettings,
  settingsOrFileName?: PrintSettings | string,
  fileName: string = 'prakash_print_a4_sheet.png'
): Promise<void> {
  // A4 at 300 DPI = 2480 x 3508 pixels
  const canvasW = 2480;
  const canvasH = 3508;
  const mmToPx = canvasW / 210; // ~11.8095 px per mm

  let cardsToDraw: { url: string; topMm: number; leftMm: number }[] = [];
  let settings: PrintSettings;
  let finalFileName = fileName;

  if (Array.isArray(cardsOrPairsOrFront)) {
    settings = backUrlOrSettings as PrintSettings;
    if (typeof settingsOrFileName === 'string') {
      finalFileName = settingsOrFileName;
    }

    const firstItem = cardsOrPairsOrFront[0] as any;
    let flatCardsList: (CardItem | RenderCardItem)[] = [];

    if (firstItem && 'front' in firstItem && 'back' in firstItem) {
      flatCardsList = getFlatCardsFromPairs(
        cardsOrPairsOrFront as CardPairItem[],
        settings.cardWidthMm || 86,
        {
          autoCenterOdd: settings.autoCenterOddCard !== false,
          onlyWithImages: true,
        }
      );
    } else {
      flatCardsList = cardsOrPairsOrFront as CardItem[];
    }

    for (const item of flatCardsList) {
      const src = item.state.enhancedImage || item.state.croppedImage || item.state.originalImage;
      if (src) {
        cardsToDraw.push({
          url: src,
          topMm: item.margin.topMm,
          leftMm: item.margin.leftMm,
        });
      }
    }
  } else {
    const frontUrl = cardsOrPairsOrFront as string | null;
    const backUrl = backUrlOrSettings as string | null;
    settings = settingsOrFileName as PrintSettings;

    const cardW = settings.cardWidthMm;
    const gap = settings.gapMm;
    const topMargin = settings.topMarginMm;

    if (settings.layout === 'stacked') {
      const centerX = (210 - cardW) / 2;
      let curY = topMargin;
      if (frontUrl) {
        cardsToDraw.push({ url: frontUrl, topMm: curY, leftMm: centerX });
        curY += settings.cardHeightMm + gap;
      }
      if (backUrl) {
        cardsToDraw.push({ url: backUrl, topMm: curY, leftMm: centerX });
      }
    } else {
      const totalRowW = frontUrl && backUrl ? cardW * 2 + gap : cardW;
      let curX = (210 - totalRowW) / 2;
      if (frontUrl && settings.layout !== 'back-only') {
        cardsToDraw.push({ url: frontUrl, topMm: topMargin, leftMm: curX });
        curX += cardW + gap;
      }
      if (backUrl && settings.layout !== 'front-only') {
        cardsToDraw.push({ url: backUrl, topMm: topMargin, leftMm: curX });
      }
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas 2D context');

  // Fill crisp white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Load card image
  const loadImage = (url: string | null): Promise<HTMLImageElement | null> => {
    if (!url) return Promise.resolve(null);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const cardW = settings.cardWidthMm * mmToPx;
  const cardH = settings.cardHeightMm * mmToPx;

  const drawCard = (img: HTMLImageElement, x: number, y: number) => {
    ctx.save();
    if (settings.showCutGuides) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2 * (mmToPx / 11.8);
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(x - 2, y - 2, cardW + 4, cardH + 4);
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, cardW, cardH);
    }

    if (settings.grayscalePrint) {
      ctx.filter = 'grayscale(100%) contrast(120%)';
    }

    ctx.drawImage(img, x, y, cardW, cardH);
    ctx.restore();
  };

  for (const item of cardsToDraw) {
    const img = await loadImage(item.url);
    if (!img) continue;
    drawCard(img, item.leftMm * mmToPx, item.topMm * mmToPx);
  }

  // Trigger file download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
