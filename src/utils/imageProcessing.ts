import { ImageAdjustments } from '../types';

/**
 * Applies document enhancement, filters, brightness, contrast, and sharpening.
 */
export function applyImageEnhancements(
  imgDataUrl: string,
  adjustments: ImageAdjustments
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imgDataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      const len = d.length;

      const brightnessFactor = (adjustments.brightness / 100) * 128; // -64 to +64
      const contrastFactor = Math.tan(((adjustments.contrast + 100) / 200) * (Math.PI / 4)); // 0 to 1+

      for (let i = 0; i < len; i += 4) {
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];

        // Mode specific color transforms
        if (adjustments.mode === 'document') {
          // Document Clean: remove yellowing and shadows, push bright grays to crisp paper white
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > 165) {
            // Background paper cleanup
            const boost = (lum - 165) / 90; // 0 to 1
            r = Math.min(255, r + (255 - r) * boost * 0.9);
            g = Math.min(255, g + (255 - g) * boost * 0.9);
            b = Math.min(255, b + (255 - b) * boost * 0.9);
          } else if (lum < 110) {
            // Deepen text
            r = Math.max(0, r * 0.85);
            g = Math.max(0, g * 0.85);
            b = Math.max(0, b * 0.85);
          }
        } else if (adjustments.mode === 'high-contrast') {
          // Boost dark text and punch up colors
          r = Math.min(255, Math.max(0, ((r - 128) * 1.35) + 128));
          g = Math.min(255, Math.max(0, ((g - 128) * 1.35) + 128));
          b = Math.min(255, Math.max(0, ((b - 128) * 1.35) + 128));
        } else if (adjustments.mode === 'xerox') {
          // B&W Xerox Photocopy mode
          let lum = 0.299 * r + 0.587 * g + 0.114 * b;
          // S-curve contrast for clean photocopy look
          lum = ((lum - 128) * 1.6) + 128;
          lum = Math.min(255, Math.max(0, lum));
          r = lum;
          g = lum;
          b = lum;
        }

        // Apply general brightness & contrast
        if (adjustments.brightness !== 0) {
          r += brightnessFactor;
          g += brightnessFactor;
          b += brightnessFactor;
        }

        if (adjustments.contrast !== 0) {
          r = ((r - 128) * contrastFactor) + 128;
          g = ((g - 128) * contrastFactor) + 128;
          b = ((b - 128) * contrastFactor) + 128;
        }

        d[i] = Math.min(255, Math.max(0, Math.round(r)));
        d[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
        d[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
      }

      ctx.putImageData(imgData, 0, 0);

      // Apply unsharp mask filter if sharpness requested
      if (adjustments.sharpness) {
        applySharpenFilter(ctx, canvas.width, canvas.height);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.96));
    };
    img.onerror = () => reject(new Error('Failed to load image for enhancement.'));
    img.src = imgDataUrl;
  });
}

function applySharpenFilter(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const src = imgData.data;
  const copy = new Uint8ClampedArray(src);

  // 3x3 unsharp convolution kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0]
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const top = copy[((y - 1) * w + x) * 4 + c];
        const bottom = copy[((y + 1) * w + x) * 4 + c];
        const left = copy[(y * w + (x - 1)) * 4 + c];
        const right = copy[(y * w + (x + 1)) * 4 + c];
        const center = copy[idx + c];

        const val = 5 * center - (top + bottom + left + right);
        src[idx + c] = Math.min(255, Math.max(0, val));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
