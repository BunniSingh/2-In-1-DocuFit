import { Point } from '../types';

/**
 * Solves 8 linear equations using Gaussian elimination to find
 * the 3x3 homography matrix mapping dst -> src (reverse mapping).
 */
export function getHomographyMatrix(src: Point[], dst: Point[]): number[] | null {
  // We want to map dst point (x, y) to src point (u, v)
  // u = (h00*x + h01*y + h02) / (h20*x + h21*y + 1)
  // v = (h10*x + h11*y + h12) / (h20*x + h21*y + 1)
  const a: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const x = dst[i].x;
    const y = dst[i].y;
    const u = src[i].x;
    const v = src[i].y;

    a.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    b.push(u);

    a.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    b.push(v);
  }

  // Gaussian elimination
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    const tempA = a[i];
    a[i] = a[maxRow];
    a[maxRow] = tempA;
    const tempB = b[i];
    b[i] = b[maxRow];
    b[maxRow] = tempB;

    const pivot = a[i][i];
    if (Math.abs(pivot) < 1e-8) {
      return null; // Singular matrix
    }

    for (let k = i + 1; k < n; k++) {
      const factor = a[k][i] / pivot;
      for (let j = i; j < n; j++) {
        a[k][j] -= factor * a[i][j];
      }
      b[k] -= factor * b[i];
    }
  }

  // Back substitution
  const h = new Array(8).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = b[i];
    for (let j = i + 1; j < n; j++) {
      sum -= a[i][j] * h[j];
    }
    h[i] = sum / a[i][i];
  }

  // Full 3x3 matrix in row-major order: [h0, h1, h2, h3, h4, h5, h6, h7, 1]
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

/**
 * High-performance Perspective Warp using Bilinear Interpolation
 * Converts arbitrary 4-corner quad to standard rectangular card.
 */
export function warpPerspective(
  srcImg: HTMLImageElement | HTMLCanvasElement,
  srcPoints: Point[],
  outWidth: number = 1016,
  outHeight: number = 638
): string {
  // Destination rectangle points: Top-Left, Top-Right, Bottom-Right, Bottom-Left
  const dstPoints: Point[] = [
    { x: 0, y: 0 },
    { x: outWidth, y: 0 },
    { x: outWidth, y: outHeight },
    { x: 0, y: outHeight }
  ];

  const H = getHomographyMatrix(srcPoints, dstPoints);
  if (!H) {
    throw new Error('Could not calculate perspective transformation matrix.');
  }

  // Extract source image data
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcImg.width;
  srcCanvas.height = srcImg.height;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) throw new Error('Canvas 2D context unavailable');
  srcCtx.drawImage(srcImg, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
  const srcPixels = srcData.data;
  const sw = srcCanvas.width;
  const sh = srcCanvas.height;

  // Prepare output canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = outWidth;
  outCanvas.height = outHeight;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Canvas 2D context unavailable');
  const outData = outCtx.createImageData(outWidth, outHeight);
  const outPixels = outData.data;

  const [h0, h1, h2, h3, h4, h5, h6, h7] = H;

  // Bilinear sampling loop
  let outIdx = 0;
  for (let y = 0; y < outHeight; y++) {
    const uRow = h1 * y + h2;
    const vRow = h4 * y + h5;
    const wRow = h7 * y + 1;

    for (let x = 0; x < outWidth; x++) {
      const W = h6 * x + wRow;
      const invW = 1 / W;
      const u = (h0 * x + uRow) * invW;
      const v = (h3 * x + vRow) * invW;

      if (u >= 0 && u < sw - 1 && v >= 0 && v < sh - 1) {
        const u0 = Math.floor(u);
        const v0 = Math.floor(v);
        const u1 = u0 + 1;
        const v1 = v0 + 1;

        const fu = u - u0;
        const fv = v - v0;
        const fu1 = 1 - fu;
        const fv1 = 1 - fv;

        const w00 = fu1 * fv1;
        const w10 = fu * fv1;
        const w01 = fu1 * fv;
        const w11 = fu * fv;

        const idx00 = (v0 * sw + u0) * 4;
        const idx10 = (v0 * sw + u1) * 4;
        const idx01 = (v1 * sw + u0) * 4;
        const idx11 = (v1 * sw + u1) * 4;

        outPixels[outIdx] = Math.round(
          srcPixels[idx00] * w00 +
          srcPixels[idx10] * w10 +
          srcPixels[idx01] * w01 +
          srcPixels[idx11] * w11
        );
        outPixels[outIdx + 1] = Math.round(
          srcPixels[idx00 + 1] * w00 +
          srcPixels[idx10 + 1] * w10 +
          srcPixels[idx01 + 1] * w01 +
          srcPixels[idx11 + 1] * w11
        );
        outPixels[outIdx + 2] = Math.round(
          srcPixels[idx00 + 2] * w00 +
          srcPixels[idx10 + 2] * w10 +
          srcPixels[idx01 + 2] * w01 +
          srcPixels[idx11 + 2] * w11
        );
        outPixels[outIdx + 3] = 255;
      } else if (u >= -0.5 && u <= sw - 0.5 && v >= -0.5 && v <= sh - 0.5) {
        // Nearest neighbor for edges
        const uClamped = Math.max(0, Math.min(sw - 1, Math.round(u)));
        const vClamped = Math.max(0, Math.min(sh - 1, Math.round(v)));
        const idx = (vClamped * sw + uClamped) * 4;

        outPixels[outIdx] = srcPixels[idx];
        outPixels[outIdx + 1] = srcPixels[idx + 1];
        outPixels[outIdx + 2] = srcPixels[idx + 2];
        outPixels[outIdx + 3] = 255;
      } else {
        outPixels[outIdx] = 255;
        outPixels[outIdx + 1] = 255;
        outPixels[outIdx + 2] = 255;
        outPixels[outIdx + 3] = 255;
      }

      outIdx += 4;
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Smart Auto-detect card boundary quad in an image.
 * Uses gradient edge scanning along radial and directional axes.
 */
export function autoDetectCardQuad(
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
): Point[] {
  // Default fallback points with 8% padding
  const padX = canvasWidth * 0.08;
  const padY = canvasHeight * 0.08;
  const defaultQuad: Point[] = [
    { x: padX, y: padY },
    { x: canvasWidth - padX, y: padY },
    { x: canvasWidth - padX, y: canvasHeight - padY },
    { x: padX, y: canvasHeight - padY }
  ];

  try {
    const scanCanvas = document.createElement('canvas');
    const scanW = 200;
    const scanH = Math.round((img.height / img.width) * 200) || 130;
    scanCanvas.width = scanW;
    scanCanvas.height = scanH;
    const ctx = scanCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return defaultQuad;

    ctx.drawImage(img, 0, 0, scanW, scanH);
    const imgData = ctx.getImageData(0, 0, scanW, scanH);
    const d = imgData.data;

    // Convert to grayscale luminance
    const gray = new Float32Array(scanW * scanH);
    for (let i = 0; i < gray.length; i++) {
      const idx = i * 4;
      gray[i] = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
    }

    // Scan inward along 4 diagonals from corners towards center to find high gradient
    const centerX = scanW / 2;
    const centerY = scanH / 2;

    const findCornerAlongRay = (startX: number, startY: number): Point => {
      const steps = 40;
      let maxGrad = 0;
      let bestX = startX;
      let bestY = startY;

      let prevLum = gray[Math.floor(startY) * scanW + Math.floor(startX)] || 128;

      for (let s = 2; s < steps; s++) {
        const t = s / steps;
        const curX = Math.round(startX + (centerX - startX) * t);
        const curY = Math.round(startY + (centerY - startY) * t);

        if (curX < 0 || curX >= scanW || curY < 0 || curY >= scanH) continue;

        const curLum = gray[curY * scanW + curX];
        const grad = Math.abs(curLum - prevLum);

        if (grad > maxGrad && grad > 25) {
          maxGrad = grad;
          bestX = curX;
          bestY = curY;
        }
        prevLum = curLum;
      }

      // Return scaled back to canvas coordinates
      return {
        x: (bestX / scanW) * canvasWidth,
        y: (bestY / scanH) * canvasHeight
      };
    };

    const tl = findCornerAlongRay(scanW * 0.04, scanH * 0.04);
    const tr = findCornerAlongRay(scanW * 0.96, scanH * 0.04);
    const br = findCornerAlongRay(scanW * 0.96, scanH * 0.96);
    const bl = findCornerAlongRay(scanW * 0.04, scanH * 0.96);

    // Validate sanity: width and height must be positive and substantial
    const wTop = Math.hypot(tr.x - tl.x, tr.y - tl.y);
    const wBottom = Math.hypot(br.x - bl.x, br.y - bl.y);
    const hLeft = Math.hypot(bl.x - tl.x, bl.y - tl.y);
    const hRight = Math.hypot(br.x - tr.x, br.y - tr.y);

    if (wTop > canvasWidth * 0.4 && wBottom > canvasWidth * 0.4 &&
        hLeft > canvasHeight * 0.3 && hRight > canvasHeight * 0.3) {
      return [tl, tr, br, bl];
    }

    return defaultQuad;
  } catch (err) {
    console.warn('Auto-detect fallback used:', err);
    return defaultQuad;
  }
}

/**
 * Perform instant edge detection and perspective warp on an image data URL,
 * returning a clean 1016x638 CR80 card image.
 */
export function instantAutoCropFromDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const quad = autoDetectCardQuad(img, w, h);
        const result = warpPerspective(img, quad, 1016, 638);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}

