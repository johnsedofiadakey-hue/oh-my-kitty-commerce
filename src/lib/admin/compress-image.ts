const MAX_DIMENSION = 1600;
const OUTPUT_QUALITY = 0.82;

/**
 * Downscales and re-encodes an image client-side before upload, via a
 * throwaway canvas — no new dependency for a two-call-site need. PNGs stay
 * PNG (product cutouts rely on alpha transparency); everything else
 * re-encodes to JPEG. Falls back to the original file untouched if the
 * browser can't decode it or the result isn't actually smaller.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, OUTPUT_QUALITY)
    );

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const extension = outputType === "image/png" ? "png" : "jpg";
    const name = `${file.name.replace(/\.[^.]+$/, "")}.${extension}`;
    return new File([blob], name, { type: outputType });
  } catch {
    return file;
  }
}
