import { PrintSettings } from '../types';

/**
 * Renders the A4 print layout onto an ultra-crisp 300 DPI canvas (2480 x 3508 px)
 * and triggers download of the image file.
 */
export async function exportA4SheetAsImage(
  frontUrl: string | null,
  backUrl: string | null,
  settings: PrintSettings,
  fileName: string = 'prakash_print_a4_sheet.png'
): Promise<void> {
  // A4 at 300 DPI = 2480 x 3508 pixels
  const canvasW = 2480;
  const canvasH = 3508;
  const mmToPx = canvasW / 210; // ~11.8095 px per mm

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas 2D context');

  // Fill crisp white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Load card images
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

  const [frontImg, backImg] = await Promise.all([
    loadImage(frontUrl),
    loadImage(backUrl),
  ]);

  const cardW = settings.cardWidthMm * mmToPx;
  const cardH = settings.cardHeightMm * mmToPx;
  const gap = settings.gapMm * mmToPx;
  const topMargin = settings.topMarginMm * mmToPx;

  const drawCard = (img: HTMLImageElement | null, x: number, y: number) => {
    if (!img) return;

    ctx.save();
    // Card border
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

  const drawPair = (startY: number) => {
    const layout = settings.layout;

    if (layout === 'stacked') {
      const centerX = (canvasW - cardW) / 2;
      let curY = startY;
      if (frontImg) {
        drawCard(frontImg, centerX, curY);
        curY += cardH + gap;
      }
      if (backImg) {
        drawCard(backImg, centerX, curY);
      }
    } else {
      // Horizontal side-by-side or front-only / back-only / multi-copies
      const showFront = layout !== 'back-only' && Boolean(frontImg);
      const showBack = layout !== 'front-only' && Boolean(backImg);

      const totalRowW = (showFront && showBack) ? (cardW * 2 + gap) : cardW;
      const startX = (canvasW - totalRowW) / 2;

      let curX = startX;
      if (showFront && frontImg) {
        drawCard(frontImg, curX, startY);
        curX += cardW + gap;
      }
      if (showBack && backImg) {
        drawCard(backImg, curX, startY);
      }
    }
  };

  if (settings.layout === 'multi-copies') {
    drawPair(topMargin);
    const secondY = topMargin + cardH + (gap * 1.5);
    drawPair(secondY);
  } else {
    drawPair(topMargin);
  }

  // Trigger file download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
