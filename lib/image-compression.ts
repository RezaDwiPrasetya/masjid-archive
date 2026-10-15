/**
 * Modul Utilitas Kompresi Gambar Client-Side (Issue #075 / F-030)
 *
 * Mengoptimalkan ukuran berkas gambar (foto dokumen kas) langsung di browser
 * sebelum diunggah ke server Supabase Storage. Mengurangi ukuran foto kamera HP (3-8 MB)
 * menjadi ~200-400 KB via konversi WebP dan downscaling proporsional (max 1920px).
 */

export interface CompressionOptions {
  /** Lebar maksimum gambar (default: 1920) */
  maxWidth?: number;
  /** Tinggi maksimum gambar (default: 1920) */
  maxHeight?: number;
  /** Kualitas kompresi 0.0 - 1.0 (default: 0.82) */
  quality?: number;
  /** Format MIME output target (default: 'image/webp') */
  targetMimeType?: "image/webp" | "image/jpeg";
}

export interface CompressionResult {
  /** Berkas hasil kompresi (atau berkas asli jika dilewati/gagal) */
  file: File;
  /** Ukuran berkas sebelum kompresi (bytes) */
  originalSize: number;
  /** Ukuran berkas setelah kompresi (bytes) */
  compressedSize: number;
  /** Apakah berkas berhasil dikompresi menjadi lebih kecil */
  isCompressed: boolean;
  /** Persentase penghematan ukuran (0 - 100) */
  savingsPercent: number;
}

const SUPPORTED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

/**
 * Menghitung dimensi proporsional baru berdasarkan batas maksimum
 */
export function calculateTargetDimensions(
  width: number,
  height: number,
  maxWidth = 1920,
  maxHeight = 1920
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: Math.max(1, width), height: Math.max(1, height) };
  }

  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/**
 * Mengganti ekstensi berkas menjadi format target
 */
export function getNewFileName(originalName: string, targetMimeType: string): string {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName;
  const extension = targetMimeType === "image/webp" ? ".webp" : ".jpg";
  return `${baseName}${extension}`;
}

/**
 * Mengompresi satu berkas gambar di browser.
 * Berkas non-gambar (PDF, Excel) langsung dilewatkan tanpa perubahan (pass-through).
 * Jika terjadi kegagalan (misal canvas tidak didukung), mengembalikan berkas asli (graceful fallback).
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const originalSize = file.size;

  // Lewatkan jika bukan gambar atau jika dieksekusi di luar lingkungan browser
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    !SUPPORTED_IMAGE_MIMES.has(file.type.toLowerCase())
  ) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      isCompressed: false,
      savingsPercent: 0,
    };
  }

  const maxWidth = options.maxWidth ?? 1920;
  const maxHeight = options.maxHeight ?? 1920;
  const quality = options.quality ?? 0.82;
  const targetMimeType = options.targetMimeType ?? "image/webp";

  let objectUrl = "";

  try {
    objectUrl = URL.createObjectURL(file);

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const imageElement = new Image();
      imageElement.onload = () => resolve(imageElement);
      imageElement.onerror = () =>
        reject(new Error("Gagal membaca berkas gambar di peramban."));
      imageElement.src = objectUrl;
    });

    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;

    const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
      naturalWidth,
      naturalHeight,
      maxWidth,
      maxHeight
    );

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      // Fallback jika context 2D tidak tersedia
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        isCompressed: false,
        savingsPercent: 0,
      };
    }

    // Gambar dengan kualitas rendering tinggi
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Konversi canvas ke Blob WebP (atau fallback JPEG)
    let blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), targetMimeType, quality);
    });

    // Jika WebP tidak didukung peramban saat toBlob, fallback ke image/jpeg
    if (!blob && targetMimeType === "image/webp") {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
      });
    }

    // Jika tetap gagal menghasilkan blob, gunakan berkas asli
    if (!blob) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        isCompressed: false,
        savingsPercent: 0,
      };
    }

    // Proteksi: Jika ukuran terkompresi ternyata lebih besar dari aslinya, pertahankan berkas asli
    if (blob.size >= originalSize) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        isCompressed: false,
        savingsPercent: 0,
      };
    }

    const newFileName = getNewFileName(file.name, blob.type);
    const compressedFile = new File([blob], newFileName, {
      type: blob.type,
      lastModified: Date.now(),
    });

    const savingsPercent = Math.round(
      ((originalSize - compressedFile.size) / originalSize) * 100
    );

    return {
      file: compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
      isCompressed: true,
      savingsPercent,
    };
  } catch (error) {
    console.warn(
      `[ImageCompression] Gagal mengompresi ${file.name}, menggunakan berkas asli:`,
      error
    );
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      isCompressed: false,
      savingsPercent: 0,
    };
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

/**
 * Mengompresi sekumpulan berkas secara berurutan atau paralel terkendali
 */
export async function compressFiles(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (index: number, total: number, fileName: string) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) {
      onProgress(i + 1, files.length, file.name);
    }
    const result = await compressImage(file, options);
    results.push(result);
  }

  return results;
}
