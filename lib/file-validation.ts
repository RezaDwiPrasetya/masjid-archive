import { randomUUID } from "crypto";

/**
 * Batas ukuran berkas maksimum per file.
 * Nilai default: 10 MB (10 * 1024 * 1024 bytes).
 *
 * Alasan pemilihan 10 MB:
 * 1. Foto resolusi tinggi dari kamera smartphone modern untuk papan tulis kas masjid
 *    berukuran sekitar 3–8 MB. Batas ini menjamin foto tidak perlu dikompres manual
 *    oleh pengurus yang dapat menurunkan akurasi vision-LLM Gemini.
 * 2. Dokumen pindaian kas multi-halaman berformat PDF biasanya berukuran 2–7 MB.
 * 3. Berkas spreadsheet Excel (.xlsx / .xls) umumnya < 2 MB.
 * 4. Melindungi kuota bandwidth serverless Vercel dan Supabase Storage dari unggahan berlebih.
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_SIZE_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);

export type AllowedCategory = "image" | "pdf" | "excel";

export interface ExtensionConfig {
  fileType: AllowedCategory;
  allowedMimes: string[];
}

export const ALLOWED_EXTENSIONS_MAP: Record<string, ExtensionConfig> = {
  jpg: {
    fileType: "image",
    allowedMimes: ["image/jpeg"],
  },
  jpeg: {
    fileType: "image",
    allowedMimes: ["image/jpeg"],
  },
  png: {
    fileType: "image",
    allowedMimes: ["image/png"],
  },
  webp: {
    fileType: "image",
    allowedMimes: ["image/webp"],
  },
  pdf: {
    fileType: "pdf",
    allowedMimes: ["application/pdf"],
  },
  xlsx: {
    fileType: "excel",
    allowedMimes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  xls: {
    fileType: "excel",
    allowedMimes: ["application/vnd.ms-excel"],
  },
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_EXTENSIONS_MAP);

export interface ValidatedFileItem {
  file: File;
  fileType: AllowedCategory;
  cleanName: string;
}

export type FileValidationResult =
  | { ok: true; validatedFiles: ValidatedFileItem[] }
  | { ok: false; status: 400 | 413; error: string };

/**
 * Sanitasi nama berkas:
 * - Hanya mengizinkan huruf, angka, titik, strip, underscore: [a-zA-Z0-9._-]
 * - Karakter lain digantikan dengan "-"
 * - Membatasi panjang nama berkas (default maks 100 karakter) dengan mempertahankan ekstensi
 */
export function sanitizeFileName(fileName: string, maxLength = 100): string {
  const trimmed = fileName.trim();
  const lastDotIndex = trimmed.lastIndexOf(".");

  if (lastDotIndex === -1) {
    const clean = trimmed.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, maxLength);
    return clean || "file";
  }

  const base = trimmed.slice(0, lastDotIndex);
  const ext = trimmed.slice(lastDotIndex); // Menyertakan "."
  const cleanBase = base.replace(/[^a-zA-Z0-9._-]/g, "-");
  const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, "").toLowerCase();

  const maxBaseLength = Math.max(1, maxLength - cleanExt.length);
  const truncatedBase = cleanBase.slice(0, maxBaseLength);

  return `${truncatedBase}${cleanExt}`;
}

/**
 * Membangun nama objek unik yang aman untuk Supabase Storage:
 * Format: `${randomUUID()}-${sanitizedName}`
 */
export function buildSafeStoragePath(folderPrefix: string, originalFileName: string): {
  storagePath: string;
  cleanName: string;
} {
  const cleanName = sanitizeFileName(originalFileName);
  const uniqueName = `${randomUUID()}-${cleanName}`;
  const storagePath = `${folderPrefix}/${uniqueName}`;
  return { storagePath, cleanName };
}

/**
 * Validasi koleksi berkas unggahan:
 * 1. Minimal 1 file
 * 2. Ukuran file <= MAX_FILE_SIZE_BYTES (Tolak 413)
 * 3. Ekstensi terdaftar dan cocok dengan MIME type (Tolak 400)
 */
export function validateUploadFiles(files: File[]): FileValidationResult {
  if (!files || files.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "Minimal satu file wajib dipilih.",
    };
  }

  const validatedFiles: ValidatedFileItem[] = [];

  for (const file of files) {
    // 1. Validasi ukuran file (HTTP 413)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const actualMB = (file.size / 1024 / 1024).toFixed(2);
      return {
        ok: false,
        status: 413,
        error: `File "${file.name}" melebihi batas ukuran maksimum ${MAX_FILE_SIZE_MB} MB (ukuran: ${actualMB} MB).`,
      };
    }

    // 2. Ekstrak dan validasi ekstensi berkas
    const lastDotIndex = file.name.lastIndexOf(".");
    if (lastDotIndex === -1 || lastDotIndex === file.name.length - 1) {
      return {
        ok: false,
        status: 400,
        error: `File "${file.name}" tidak memiliki ekstensi. Ekstensi yang didukung: ${ALLOWED_EXTENSIONS.join(", ")}.`,
      };
    }

    const ext = file.name.slice(lastDotIndex + 1).toLowerCase();
    const rule = ALLOWED_EXTENSIONS_MAP[ext];

    if (!rule) {
      return {
        ok: false,
        status: 400,
        error: `Ekstensi ".${ext}" pada file "${file.name}" tidak didukung. Ekstensi yang diizinkan: ${ALLOWED_EXTENSIONS.join(", ")}.`,
      };
    }

    // 3. Validasi kecocokan ekstensi dengan MIME type
    const normalizedMime = file.type?.toLowerCase().trim() || "";
    if (!rule.allowedMimes.includes(normalizedMime)) {
      return {
        ok: false,
        status: 400,
        error: `Tipe konten "${file.type || "tidak dikenal"}" tidak sesuai dengan ekstensi ".${ext}" pada file "${file.name}".`,
      };
    }

    validatedFiles.push({
      file,
      fileType: rule.fileType,
      cleanName: sanitizeFileName(file.name),
    });
  }

  return {
    ok: true,
    validatedFiles,
  };
}
