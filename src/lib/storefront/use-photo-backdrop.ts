"use client";

import { useCallback, useState, type SyntheticEvent } from "react";

/**
 * Samples the loaded product photo's own edge pixels so its card can match
 * that exact photo's background tone, instead of one fixed color that's
 * wrong for photos with a different tone (some shots are peachy, others
 * white). Reads pixels off the already-rendered <img> element, which
 * next/image serves same-origin (via /_next/image), so this never hits a
 * CORS/tainted-canvas error the way sampling the raw Firebase Storage URL
 * directly could.
 */
export function usePhotoBackdrop() {
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>(undefined);

  const handleLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const color = sampleEdgeColor(ctx, canvas.width, canvas.height);
      if (color) setBackgroundColor(color);
    } catch {
      // Leave the CSS fallback color in place if sampling ever fails.
    }
  }, []);

  return { backgroundColor, handleLoad };
}

function sampleEdgeColor(ctx: CanvasRenderingContext2D, width: number, height: number): string | null {
  const inset = Math.max(2, Math.round(Math.min(width, height) * 0.02));
  const points: [number, number][] = [
    [inset, inset],
    [width - inset - 1, inset],
    [inset, height - inset - 1],
    [width - inset - 1, height - inset - 1],
    [Math.floor(width / 2), inset]
  ];

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (const [x, y] of points) {
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const data = ctx.getImageData(x, y, 1, 1).data;
    // PNG packshots may have transparent padding around the product. Those
    // pixels read as black on a canvas, which would make the surrounding card
    // look unrelated to the visible image. Ignore them and retain the CSS
    // fallback when there is no real photo edge to sample.
    if (data[3] < 24) continue;
    r += data[0];
    g += data[1];
    b += data[2];
    count += 1;
  }
  if (count === 0) return null;
  return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
}
