import { jsPDF } from 'jspdf';
import { PrintSettings } from '../types';

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
 * - Exact ISO CR80 sizing (86x54mm or 88x56mm)
 * - Horizontal side-by-side, Vertical stacked, or 2 sets (4 cards)
 * - Dashed cut lines around cards
 * - Alignment marks & scissors icons
 * - Instant file download trigger
 */
export async function downloadA4Pdf(
  frontUrl: string | null,
  backUrl: string | null,
  settings: PrintSettings,
  fileName: string = 'ID_Card_A4_Print.pdf'
): Promise<void> {
  // Load images
  const [frontImg, backImg] = await Promise.all([
    loadImageElement(frontUrl),
    loadImageElement(backUrl),
  ]);

  if (!frontImg && !backImg) {
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
  const gap = settings.gapMm;
  const topMargin = settings.topMarginMm;
  const isGrayscale = settings.grayscalePrint;

  // Prepared processed image data URLs
  const frontData = frontImg ? processCardForPdf(frontImg, isGrayscale) : null;
  const backData = backImg ? processCardForPdf(backImg, isGrayscale) : null;

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

  // Helper to render one pair (or single)
  const drawCardPair = (startY: number) => {
    const layout = settings.layout;

    if (layout === 'stacked') {
      // Top and bottom centered
      const centerX = (pageWidth - cardW) / 2;
      let curY = startY;

      if (frontData) {
        doc.addImage(frontData, 'JPEG', centerX, curY, cardW, cardH);
        drawCutGuide(centerX, curY, cardW, cardH);
        curY += cardH + gap;
      }

      if (backData) {
        doc.addImage(backData, 'JPEG', centerX, curY, cardW, cardH);
        drawCutGuide(centerX, curY, cardW, cardH);
      }
    } else {
      // Horizontal side-by-side or front-only / back-only
      const showFront = layout !== 'back-only' && Boolean(frontData);
      const showBack = layout !== 'front-only' && Boolean(backData);

      const totalRowW = showFront && showBack ? cardW * 2 + gap : cardW;
      const startX = (pageWidth - totalRowW) / 2;

      let curX = startX;
      if (showFront && frontData) {
        doc.addImage(frontData, 'JPEG', curX, startY, cardW, cardH);
        drawCutGuide(curX, startY, cardW, cardH);
        curX += cardW + gap;
      }

      if (showBack && backData) {
        doc.addImage(backData, 'JPEG', curX, startY, cardW, cardH);
        drawCutGuide(curX, startY, cardW, cardH);
      }
    }
  };

  // Draw pairs based on layout
  if (settings.layout === 'multi-copies') {
    // First set
    drawCardPair(topMargin);
    // Second set
    const secondY = topMargin + cardH + gap * 1.5;
    drawCardPair(secondY);
  } else {
    drawCardPair(topMargin);
  }

  // Add subtle header/footer note on the printed sheet
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Prakash Print Studio | ISO CR80 (${settings.cardWidthMm}x${settings.cardHeightMm}mm) | Print Size: 100% (No Scale / Fit Page off)`,
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  // Save/Download PDF
  doc.save(fileName);
}
