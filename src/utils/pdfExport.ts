import { jsPDF } from 'jspdf';
import { CardItem, CardPairItem, PrintSettings, RenderCardItem } from '../types';
import { getFlatCardsFromPairs } from './pairUtils';

/**
 * Helper to load an image element or extract high-res data URL.
 */
function loadImageElement(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Pre-processes an image into a high quality JPEG / PNG data URL,
 * applying grayscale if requested in print settings.
 */
function processCardForPdf(
  img: HTMLImageElement,
  isGrayscale: boolean
): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width || 1016;
  canvas.height = img.naturalHeight || img.height || 638;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  if (isGrayscale) {
    ctx.filter = 'grayscale(100%) contrast(125%)';
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Generates an exact millimeter-accurate A4 PDF using jsPDF.
 * A4 dimensions: 210mm x 297mm.
 * Supports:
 * - Dynamic list of up to 4 card pairs (up to 8 cards), each with separate customizable margins
 * - Backwards compatibility with CardItem[] or frontUrl/backUrl
 * - Exact ISO CR80 sizing (86x54mm or 88x56mm)
 * - Dashed cut lines around cards with scissors corner ticks
 * - Instant file download trigger
 */
export async function downloadA4Pdf(
  cardsOrPairsOrFront: CardPairItem[] | CardItem[] | string | null,
  backUrlOrSettings?: string | null | PrintSettings,
  settingsOrFileName?: PrintSettings | string,
  fileName: string = 'Prakash_Print_ID_Cards_A4.pdf'
): Promise<void> {
  let cardsToPrint: { url: string; topMm: number; leftMm: number; label?: string }[] = [];
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
      // It's CardPairItem[]
      flatCardsList = getFlatCardsFromPairs(
        cardsOrPairsOrFront as CardPairItem[],
        settings.cardWidthMm || 86,
        {
          autoCenterOdd: settings.autoCenterOddCard !== false,
          onlyWithImages: true,
        }
      );
    } else {
      // It's CardItem[]
      flatCardsList = cardsOrPairsOrFront as CardItem[];
    }

    for (const item of flatCardsList) {
      const src = item.state.enhancedImage || item.state.croppedImage || item.state.originalImage;
      if (src) {
        cardsToPrint.push({
          url: src,
          topMm: item.margin.topMm,
          leftMm: item.margin.leftMm,
          label: item.label,
        });
      }
    }
  } else {
    // Legacy signature: downloadA4Pdf(frontUrl, backUrl, settings, fileName)
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
        cardsToPrint.push({ url: frontUrl, topMm: curY, leftMm: centerX, label: 'Front' });
        curY += settings.cardHeightMm + gap;
      }
      if (backUrl) {
        cardsToPrint.push({ url: backUrl, topMm: curY, leftMm: centerX, label: 'Back' });
      }
    } else {
      const totalRowW = frontUrl && backUrl ? cardW * 2 + gap : cardW;
      let curX = (210 - totalRowW) / 2;
      if (frontUrl && settings.layout !== 'back-only') {
        cardsToPrint.push({ url: frontUrl, topMm: topMargin, leftMm: curX, label: 'Front' });
        curX += cardW + gap;
      }
      if (backUrl && settings.layout !== 'front-only') {
        cardsToPrint.push({ url: backUrl, topMm: topMargin, leftMm: curX, label: 'Back' });
      }
    }
  }

  if (cardsToPrint.length === 0) {
    throw new Error('No card images to generate PDF.');
  }

  // Create jsPDF instance in A4 portrait, units: mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
    compress: true,
  });

  const pageWidth = 210;
  const cardW = settings.cardWidthMm;
  const cardH = settings.cardHeightMm;
  const isGrayscale = settings.grayscalePrint;

  // Helper to draw dashed cut guide rectangle
  const drawCutGuide = (x: number, y: number, w: number, h: number) => {
    if (!settings.showCutGuides) return;

    doc.saveGraphicsState();
    doc.setDrawColor(120, 120, 120); // Slate gray
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([2, 1.5], 0);
    // Draw guide outline with slight 0.5mm bleed margin for clean cutting
    doc.rect(x - 0.4, y - 0.4, w + 0.8, h + 0.8, 'S');

    // Draw small corner tick marks for scissors alignment
    const tickLen = 2.5;
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([], 0); // solid

    // Top-left corner tick
    doc.line(x - 2, y - 0.4, x - 2 + tickLen, y - 0.4);
    doc.line(x - 0.4, y - 2, x - 0.4, y - 2 + tickLen);

    // Top-right corner tick
    doc.line(x + w + 2, y - 0.4, x + w + 2 - tickLen, y - 0.4);
    doc.line(x + w + 0.4, y - 2, x + w + 0.4, y - 2 + tickLen);

    // Bottom-left corner tick
    doc.line(x - 2, y + h + 0.4, x - 2 + tickLen, y + h + 0.4);
    doc.line(x - 0.4, y + h + 2, x - 0.4, y + h + 2 - tickLen);

    // Bottom-right corner tick
    doc.line(x + w + 2, y + h + 0.4, x + w + 2 - tickLen, y + h + 0.4);
    doc.line(x + w + 0.4, y + h + 2, x + w + 0.4, y + h + 2 - tickLen);

    doc.restoreGraphicsState();
  };

  // Load and render each card at its designated separate margin
  for (const item of cardsToPrint) {
    const imgEl = await loadImageElement(item.url);
    if (!imgEl) continue;

    const processedData = processCardForPdf(imgEl, isGrayscale);
    doc.addImage(processedData, 'JPEG', item.leftMm, item.topMm, cardW, cardH);
    drawCutGuide(item.leftMm, item.topMm, cardW, cardH);
  }

  // Add subtle cyber cafe footer note on the printed sheet
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Prakash Print Studio | ISO CR80 (${settings.cardWidthMm}x${settings.cardHeightMm}mm) | Print Size: 100% (No Scale / Fit Page Off) | ${cardsToPrint.length} Card(s)`,
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  // Save/Download PDF
  doc.save(finalFileName);
}
