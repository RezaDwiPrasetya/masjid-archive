import assert from "node:assert";
import {
  sanitizeFileName,
  validateUploadFiles,
  buildSafeStoragePath,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "../lib/file-validation";

console.log("=================================================================");
console.log("TEST SUITE: File Upload Hardening Validation (lib/file-validation.ts)");
console.log("=================================================================\n");

let passed = 0;
let failed = 0;

function runTest(description: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } catch (err: unknown) {
    console.error(`  ❌ FAIL: ${description}`);
    if (err instanceof Error) {
      console.error(`     Error: ${err.message}`);
    }
    failed++;
  }
}

// Helper untuk membuat mock File object
function createMockFile(name: string, size: number, type: string): File {
  return {
    name,
    size,
    type,
    arrayBuffer: async () => new ArrayBuffer(size),
    slice: () => new Blob(),
    stream: () => new ReadableStream(),
    text: async () => "",
    lastModified: Date.now(),
  } as unknown as File;
}

// -----------------------------------------------------------------------------
// 1. UJI SANITASI NAMA BERKAS
// -----------------------------------------------------------------------------
console.log("[1] Pengujian Sanitasi Nama Berkas:");

runTest("Nama aneh dengan spasi, path traversal, dan simbol harus dibersihkan ke [a-zA-Z0-9._-]", () => {
  const dirty = "../../laporan kas #01 @minggu (final)!.pdf";
  const cleaned = sanitizeFileName(dirty);
  
  // Memastikan hanya berisi karakter aman
  assert.ok(/^[a-zA-Z0-9._-]+$/.test(cleaned), `Karakter harus aman, didapat: ${cleaned}`);
  assert.ok(cleaned.endsWith(".pdf"), "Ekstensi .pdf harus tetap dipertahankan");
  assert.ok(!cleaned.includes("/"), "Tidak boleh ada slash");
  assert.ok(!cleaned.includes(" "), "Tidak boleh ada spasi");
});

runTest("Nama berkas super panjang (> 100 karakter) harus dipotong dengan mempertahankan ekstensi", () => {
  const longBase = "a".repeat(150);
  const longFileName = `${longBase}.xlsx`;
  const cleaned = sanitizeFileName(longFileName, 100);

  assert.ok(cleaned.length <= 100, `Panjang nama harus <= 100, didapat: ${cleaned.length}`);
  assert.ok(cleaned.endsWith(".xlsx"), "Ekstensi .xlsx harus tetap ada di akhir");
});

runTest("buildSafeStoragePath menghasilkan prefix random UUID dan path aman", () => {
  const result = buildSafeStoragePath("reports/123", "foto kas masjid #1.jpg");
  assert.ok(result.storagePath.startsWith("reports/123/"));
  assert.ok(result.storagePath.endsWith(".jpg"));
  assert.ok(!result.storagePath.includes(" "), "Path tidak boleh memuat spasi");
});

// -----------------------------------------------------------------------------
// 2. UJI EKSTENSI PALSU & MIME TYPE MISMATCH
// -----------------------------------------------------------------------------
console.log("\n[2] Pengujian Validasi Ekstensi & MIME Type:");

runTest("Ekstensi .html dengan MIME image/jpeg harus DITOLAK (400)", () => {
  const fakeFile = createMockFile("payload.html", 1024, "image/jpeg");
  const res = validateUploadFiles([fakeFile]);

  assert.strictEqual(res.ok, false);
  if (!res.ok) {
    assert.strictEqual(res.status, 400);
    assert.ok(res.error.includes("tidak didukung"), "Pesan error harus menyebut ekstensi tidak didukung");
  }
});

runTest("Ekstensi .jpg dengan MIME application/pdf (MIME mismatch) harus DITOLAK (400)", () => {
  const mismatchFile = createMockFile("foto.jpg", 1024, "application/pdf");
  const res = validateUploadFiles([mismatchFile]);

  assert.strictEqual(res.ok, false);
  if (!res.ok) {
    assert.strictEqual(res.status, 400);
    assert.ok(res.error.includes("tidak sesuai dengan ekstensi"), "Pesan error harus menyebut MIME mismatch");
  }
});

runTest("File tanpa ekstensi harus DITOLAK (400)", () => {
  const noExtFile = createMockFile("laporankas", 1024, "image/jpeg");
  const res = validateUploadFiles([noExtFile]);

  assert.strictEqual(res.ok, false);
  if (!res.ok) {
    assert.strictEqual(res.status, 400);
    assert.ok(res.error.includes("tidak memiliki ekstensi"));
  }
});

runTest("Seluruh ekstensi sah (jpg, jpeg, png, webp, pdf, xlsx, xls) dengan MIME cocok harus DIIZINKAN (ok: true)", () => {
  const validFiles = [
    createMockFile("foto1.jpg", 1024, "image/jpeg"),
    createMockFile("foto2.jpeg", 1024, "image/jpeg"),
    createMockFile("papan.png", 1024, "image/png"),
    createMockFile("gambar.webp", 1024, "image/webp"),
    createMockFile("rekap.pdf", 1024, "application/pdf"),
    createMockFile("buku_kas.xlsx", 1024, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    createMockFile("lama.xls", 1024, "application/vnd.ms-excel"),
  ];

  const res = validateUploadFiles(validFiles);
  assert.strictEqual(res.ok, true);
  if (res.ok) {
    assert.strictEqual(res.validatedFiles.length, 7);
  }
});

// -----------------------------------------------------------------------------
// 3. UJI BATAS UKURAN BERKAS (10 MB -> 413 PAYLOAD TOO LARGE)
// -----------------------------------------------------------------------------
console.log("\n[3] Pengujian Batas Ukuran Berkas (10 MB & HTTP 413):");

runTest("Berkas melebihi batas 10 MB (mis. 10.5 MB) harus DITOLAK dengan status 413", () => {
  const oversizeBytes = Math.floor(10.5 * 1024 * 1024);
  const largeFile = createMockFile("foto_raksasa.jpg", oversizeBytes, "image/jpeg");

  const res = validateUploadFiles([largeFile]);
  assert.strictEqual(res.ok, false);
  if (!res.ok) {
    assert.strictEqual(res.status, 413, "Status harus 413 Payload Too Large");
    assert.ok(res.error.includes(`melebihi batas ukuran maksimum ${MAX_FILE_SIZE_MB} MB`));
    assert.ok(res.error.includes("10.50 MB"));
  }
});

runTest("Berkas tepat 10 MB (10 * 1024 * 1024 bytes) harus DIIZINKAN (ok: true)", () => {
  const exactFile = createMockFile("foto_pas.jpg", MAX_FILE_SIZE_BYTES, "image/jpeg");
  const res = validateUploadFiles([exactFile]);
  assert.strictEqual(res.ok, true);
});

runTest("Berkas normal 3 MB harus DIIZINKAN (ok: true)", () => {
  const normalFile = createMockFile("foto_normal.png", 3 * 1024 * 1024, "image/png");
  const res = validateUploadFiles([normalFile]);
  assert.strictEqual(res.ok, true);
});

console.log("\n=================================================================");
console.log(`HASIL AKHIR: ${passed} Passed, ${failed} Failed`);
console.log("=================================================================");

if (failed > 0) {
  process.exit(1);
}
