/**
 * Test Suite: Fungsionalitas Kompresi Gambar Client-Side (Issue #075 / F-030)
 *
 * Menguji logika perhitungan dimensi, penamaan berkas, passthrough non-gambar,
 * ketahanan runtime (Node vs Browser), dan kompatibilitas validasi server-side.
 */

import {
  calculateTargetDimensions,
  getNewFileName,
  compressImage,
  compressFiles,
} from "../lib/image-compression";
import { validateUploadFiles, ALLOWED_EXTENSIONS_MAP } from "../lib/file-validation";

let passedTests = 0;
let totalTests = 0;

function assert(description: string, condition: boolean, extraInfo?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${description}`);
  } else {
    console.error(`  [FAIL] ${description}`);
    if (extraInfo) console.error(`         Detail: ${extraInfo}`);
  }
}

async function runAllTests() {
  console.log("\n=== TEST SUITE 1: Perhitungan Dimensi Proporsional (calculateTargetDimensions) ===");

  {
    // 1. Gambar lebih kecil dari 1920 tidak boleh di-upscale
    const dim1 = calculateTargetDimensions(800, 600, 1920, 1920);
    assert(
      "Gambar kecil (800x600) dipertahankan tanpa perubahan dimensi",
      dim1.width === 800 && dim1.height === 600,
      `Hasil: ${dim1.width}x${dim1.height}`
    );

    // 2. Foto landscape kamera HP 4000x3000 (4:3) di-downscale proporsional ke lebar 1920
    const dim2 = calculateTargetDimensions(4000, 3000, 1920, 1920);
    assert(
      "Foto kamera HP 4000x3000 di-downscale proporsional menjadi 1920x1440",
      dim2.width === 1920 && dim2.height === 1440,
      `Hasil: ${dim2.width}x${dim2.height}`
    );

    // 3. Foto portrait kamera HP 3000x4000 (3:4) di-downscale proporsional ke tinggi 1920
    const dim3 = calculateTargetDimensions(3000, 4000, 1920, 1920);
    assert(
      "Foto portrait 3000x4000 di-downscale proporsional menjadi 1440x1920",
      dim3.width === 1440 && dim3.height === 1920,
      `Hasil: ${dim3.width}x${dim3.height}`
    );

    // 4. Gambar persegi resolusi tinggi 2400x2400 di-downscale menjadi 1920x1920
    const dim4 = calculateTargetDimensions(2400, 2400, 1920, 1920);
    assert(
      "Gambar persegi 2400x2400 di-downscale menjadi 1920x1920",
      dim4.width === 1920 && dim4.height === 1920,
      `Hasil: ${dim4.width}x${dim4.height}`
    );

    // 5. Batas dimensi khusus (custom maxWidth/maxHeight)
    const dim5 = calculateTargetDimensions(1200, 800, 600, 600);
    assert(
      "Custom limit 600x600 pada input 1200x800 menghasilkan 600x400",
      dim5.width === 600 && dim5.height === 400,
      `Hasil: ${dim5.width}x${dim5.height}`
    );

    // 6. Penanganan dimensi nol atau negatif (edge case)
    const dim6 = calculateTargetDimensions(0, -10, 1920, 1920);
    assert(
      "Dimensi nol/negatif menghasilkan nilai minimum 1px tanpa error",
      dim6.width >= 1 && dim6.height >= 1,
      `Hasil: ${dim6.width}x${dim6.height}`
    );
  }

  console.log("\n=== TEST SUITE 2: Penyesuaian Nama Berkas (getNewFileName) ===");

  {
    // 7. JPEG ke WebP
    const name1 = getNewFileName("buku_kas_pekan1.jpg", "image/webp");
    assert(
      "buku_kas_pekan1.jpg dikonversi menjadi buku_kas_pekan1.webp",
      name1 === "buku_kas_pekan1.webp",
      `Hasil: ${name1}`
    );

    // 8. PNG ke WebP
    const name2 = getNewFileName("tanda-terima.png", "image/webp");
    assert(
      "tanda-terima.png dikonversi menjadi tanda-terima.webp",
      name2 === "tanda-terima.webp",
      `Hasil: ${name2}`
    );

    // 9. Berkas dengan banyak titik dalam nama
    const name3 = getNewFileName("laporan.kas.masjid.v1.jpeg", "image/webp");
    assert(
      "Nama berkas multi-titik 'laporan.kas.masjid.v1.jpeg' diekstensi dengan benar",
      name3 === "laporan.kas.masjid.v1.webp",
      `Hasil: ${name3}`
    );

    // 10. Fallback JPEG
    const name4 = getNewFileName("foto_kertas.png", "image/jpeg");
    assert(
      "foto_kertas.png dengan target image/jpeg menghasilkan foto_kertas.jpg",
      name4 === "foto_kertas.jpg",
      `Hasil: ${name4}`
    );
  }

  console.log("\n=== TEST SUITE 3: Ketahanan Runtime & Pass-Through (Node.js Environment) ===");

  {
    // Buat mock File untuk lingkungan Node.js
    const pdfBlob = new Blob(["%PDF-1.4 dummy pdf content"], { type: "application/pdf" });
    const pdfFile = new File([pdfBlob], "laporan_keuangan.pdf", { type: "application/pdf" });

    const resPdf = await compressImage(pdfFile);
    assert(
      "Berkas non-gambar (PDF) langsung dilewatkan tanpa kompresi (pass-through)",
      resPdf.isCompressed === false && resPdf.file.name === "laporan_keuangan.pdf",
      `Tipe: ${resPdf.file.type}`
    );

    const xlsxBlob = new Blob(["dummy xlsx content"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const xlsxFile = new File([xlsxBlob], "rekap.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const resXlsx = await compressImage(xlsxFile);
    assert(
      "Berkas spreadsheet Excel langsung dilewatkan tanpa manipulasi",
      resXlsx.isCompressed === false && resXlsx.file.name === "rekap.xlsx"
    );

    // Saat di Node (tanpa DOM window), gambar juga aman fallback ke berkas asli
    const imgBlob = new Blob(["fake image bytes"], { type: "image/jpeg" });
    const imgFile = new File([imgBlob], "foto.jpg", { type: "image/jpeg" });

    const resImgNode = await compressImage(imgFile);
    assert(
      "Di lingkungan non-browser (Node.js/SSR), berkas gambar aman dikembalikan utuh (graceful fallback)",
      resImgNode.file.name === "foto.jpg" && resImgNode.originalSize === imgFile.size
    );

    // Batch compression
    const batch = await compressFiles([pdfFile, xlsxFile, imgFile]);
    assert(
      "compressFiles memproses sekumpulan berkas secara teratur (3 berkas)",
      batch.length === 3
    );
  }

  console.log("\n=== TEST SUITE 4: Kompatibilitas Validasi Server & Pipeline Storage ===");

  {
    // 11. Periksa dukungan ALLOWED_EXTENSIONS_MAP untuk webp
    assert(
      "ALLOWED_EXTENSIONS_MAP mendukung ekstensi 'webp'",
      "webp" in ALLOWED_EXTENSIONS_MAP &&
        ALLOWED_EXTENSIONS_MAP["webp"].fileType === "image" &&
        ALLOWED_EXTENSIONS_MAP["webp"].allowedMimes.includes("image/webp")
    );

    // 12. Validasi berkas WebP melalui fungsi server validateUploadFiles
    const webpBlob = new Blob(["RIFF dummy webp binary content"], { type: "image/webp" });
    const webpFile = new File([webpBlob], "laporan_kas.webp", { type: "image/webp" });

    const validation = validateUploadFiles([webpFile]);
    assert(
      "validateUploadFiles meloloskan berkas WebP hasil kompresi dengan valid",
      validation.ok === true && validation.validatedFiles.length === 1
    );

    if (validation.ok) {
      assert(
        "Berkas WebP dikenali sebagai kategori fileType 'image'",
        validation.validatedFiles[0]?.fileType === "image"
      );
    }
  }

  console.log("\n========================================================");
  console.log(`HASIL AKHIR: ${passedTests} / ${totalTests} PENGUJIAN LULUS`);
  console.log("========================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
