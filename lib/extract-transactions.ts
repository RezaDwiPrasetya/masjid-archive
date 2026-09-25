import { SchemaType } from "@google/generative-ai";
import type { Schema } from "@google/generative-ai";
import { gemini, GEMINI_MODEL } from "@/lib/gemini";

const MODEL_NAME = GEMINI_MODEL;

// Schema transaksi dan saldo yang diharapkan dari Gemini
// Sesuai 12-Technical-Specification.md — Structured Output section
const transactionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    initialBalance: {
      type: SchemaType.INTEGER,
      nullable: true,
      description:
        "Saldo awal / saldo lalu / total saldo kas sebelum periode ini jika tercantum di bagian atas (angka bulat integer Rupiah tanpa titik). Abaikan garis bawah atau tanda garis di bawah angka.",
    },
    finalBalance: {
      type: SchemaType.INTEGER,
      nullable: true,
      description:
        "Total saldo akhir kas masjid setelah dihitung dengan pemasukan dan pengeluaran jika tercantum di bagian bawah (angka bulat integer Rupiah tanpa titik). Abaikan garis bawah atau tanda garis di bawah angka.",
    },
    transactions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: {
            type: SchemaType.STRING,
            enum: ["pemasukan", "pengeluaran"],
          },
          amount: {
            type: SchemaType.INTEGER,
          },
          description: {
            type: SchemaType.STRING,
          },
          transactionDate: {
            type: SchemaType.STRING,
            nullable: true,
          },
          donorName: {
            type: SchemaType.STRING,
            nullable: true,
            description:
              "Nama pemberi donasi jika tertulis jelas di baris pemasukan ini — bisa berupa nama perorangan (contoh: 'Bapak Kosasih', 'H. Ahmad') MAUPUN nama usaha/institusi (contoh: 'Toko Berkah', 'Laundry Niji', 'PT Sejahtera'). Selalu null untuk pengeluaran. Kembalikan null jika tidak ada identitas pemberi yang spesifik (misal deskripsi generik: 'Kotak Amal', 'Infaq Jumat'). Jangan mengarang nama.",
          },
        },
        required: ["type", "amount", "description"],
      },
    },
  },
  required: ["transactions"],
} as unknown as Schema;

// Prompt disusun untuk buku kas, lembar laporan keuangan masjid tulisan tangan, maupun dokumen PDF.
const EXTRACTION_PROMPT = `
Kamu adalah asisten akuntansi yang membantu membaca dan mendigitalkan laporan kas keuangan masjid yang ditulis tangan maupun diketik.

Berkas atau foto yang diberikan bisa berupa dokumen PDF (hasil scan/cetak fotokopi), foto halaman buku kas besar, atau lembaran laporan keuangan mingguan/pekanan yang dipajang di papan masjid.
Biasanya terdapat bagian "PEMASUKAN KAS MASJID" dan "PENGELUARAN KAS MASJID", serta catatan saldo awal di bagian atas dan saldo akhir di bagian bawah.

Tugasmu:
1. Ekstrak SETIAP baris rincian pemasukan dan pengeluaran sebagai satu entri transaksi terpisah.
   - JANGAN memasukkan baris rekapitulasi/subtotal seperti "JUMLAH", "TOTAL", atau baris tanda tangan bendahara.
2. Untuk setiap baris transaksi, isi:
   - "type": "pemasukan" atau "pengeluaran"
   - "amount": angka bulat integer dalam satuan Rupiah (tanpa titik, koma, atau garis)
   - "description": teks keterangan transaksi dari kertas tersebut
   - "transactionDate": tanggal transaksi jika tertulis per baris (format ISO YYYY-MM-DD), atau null jika tidak ada
   - "donorName": Ekstrak nama pemberi donasi (donorName) jika tertulis jelas berdampingan dengan nominal pemasukan — bisa berupa nama perorangan (contoh: "INFAK BAPAK KOSASIH" -> "Bapak Kosasih", "DARI IBU SITI" -> "Ibu Siti", "H. RIDWAN" -> "H. Ridwan") ATAU nama usaha/institusi (contoh: "INFAK TOKO BERKAH" -> "Toko Berkah", "DONASI LAUNDRY NIJI" -> "Laundry Niji"). Salin nama persis sebagaimana tertulis, dengan kapitalisasi yang wajar.
     * Untuk transaksi "pengeluaran", "donorName" SELALU null.
     * Kembalikan null HANYA jika baris pemasukan memang tidak menyebutkan identitas pemberi yang spesifik (misal deskripsi generik: "KAS MASJID", "KOTAK AMAL", "TROMOL JUMAT", "INFAQ UMUM", "SUMBANGAN HAMBA ALLAH"). JANGAN pernah mengarang atau menebak nama jika tidak tertulis jelas di foto/dokumen.
3. Ekstrak saldo pembukuan:
   - "initialBalance": Saldo awal / saldo kas pekan lalu yang tertulis di bagian atas (misal: "TOTAL SALDO TGL...", "SALDO LALU", "SALDO AWAL"). Ambil nilai nominalnya sebagai angka bulat integer biasa (misal: 1485000). Abaikan garis bawah atau tanda sama dengan di bawah angka. Jika tidak ada, isi null.
   - "finalBalance": Total saldo akhir kas masjid yang tertulis di bagian bawah setelah dihitung dengan pemasukan dan pengeluaran (misal: "TOTAL KAS MESJID TGL...", "SALDO AKHIR"). Ambil nominal hasil akhirnya sebagai angka bulat integer biasa (misal: 1605000). Abaikan garis bawah atau tanda sama dengan di bawah angka. Jika tidak ada, isi null.
4. Jika dokumen/foto buram/gelap/kosong/tidak bisa dibaca sama sekali, kembalikan array "transactions" yang kosong [] dan saldo null.

Penting: output HANYA berisi data yang benar-benar terbaca di dokumen/foto, tidak boleh ada data rekaan.
`.trim();

export type ExtractedTransaction = {
  type: "pemasukan" | "pengeluaran";
  amount: number;
  description: string;
  transactionDate: string | null;
  donorName?: string | null;
};

export type ExtractionResult = {
  transactions: ExtractedTransaction[];
  initialBalance: number | null;
  finalBalance: number | null;
  rawResponse: Record<string, unknown>;
  modelName: string;
};

/**
 * Ambil file gambar atau dokumen PDF dari URL publik Supabase dan kirim ke Gemini
 * untuk diekstrak menjadi daftar transaksi terstruktur beserta saldo awal & akhir buku.
 */
export async function extractTransactionsFromFile(
  fileUrl: string,
  fileTypeHint?: string
): Promise<ExtractionResult> {
  // Fetch file dari Supabase Storage sebagai binary
  const fileResponse = await fetch(fileUrl);
  if (!fileResponse.ok) {
    throw new Error(
      `Gagal mengambil file dari storage (HTTP ${fileResponse.status})`
    );
  }

  const fileBuffer = await fileResponse.arrayBuffer();
  const fileBase64 = Buffer.from(fileBuffer).toString("base64");

  // Deteksi dan bersihkan MIME Type
  let rawMime = fileResponse.headers.get("content-type") || "";
  if (rawMime.includes(";")) {
    rawMime = rawMime.split(";")[0].trim();
  }

  const urlLower = fileUrl.toLowerCase();
  let resolvedMimeType = "image/jpeg";

  if (
    rawMime === "application/pdf" ||
    urlLower.endsWith(".pdf") ||
    fileTypeHint === "pdf"
  ) {
    resolvedMimeType = "application/pdf";
  } else if (rawMime.includes("png") || urlLower.endsWith(".png")) {
    resolvedMimeType = "image/png";
  } else if (
    rawMime.includes("jpeg") ||
    rawMime.includes("jpg") ||
    urlLower.endsWith(".jpg") ||
    urlLower.endsWith(".jpeg")
  ) {
    resolvedMimeType = "image/jpeg";
  } else if (rawMime && rawMime !== "application/octet-stream") {
    resolvedMimeType = rawMime;
  }

  // Daftar model kandidat berurutan: jika model utama terkena antrean/lonjakan (503/timeout),
  // sistem langsung beralih ke model cadangan tanpa membiarkan request menggantung.
  const candidateModels = Array.from(new Set([MODEL_NAME, "gemini-3.5-flash"]));

  let lastError: unknown = null;

  for (const candidate of candidateModels) {
    const model = gemini.getGenerativeModel({
      model: candidate,
      generationConfig: {
        // Structured output — menjamin JSON valid sesuai schema
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
      },
    });

    // Batas waktu 25 detik per model untuk mencegah request menggantung di antrean server Google
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 25000);

    try {
      const result = await model.generateContent(
        [
          EXTRACTION_PROMPT,
          {
            inlineData: {
              mimeType: resolvedMimeType,
              data: fileBase64,
            },
          },
        ],
        { signal: abortController.signal }
      );

      clearTimeout(timeoutId);

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText) as {
        transactions?: ExtractedTransaction[];
        initialBalance?: number | null;
        finalBalance?: number | null;
      };

      return {
        transactions: parsed.transactions ?? [],
        initialBalance: parsed.initialBalance ?? null,
        finalBalance: parsed.finalBalance ?? null,
        rawResponse: parsed as Record<string, unknown>,
        modelName: candidate,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      lastError = err;
      const errMessage = err instanceof Error ? err.message : String(err);
      console.warn(
        `[Extract] Model ${candidate} gagal/timeout (${errMessage.slice(0, 100)}). Mencoba model fallback...`
      );
    }
  }

  // Jika semua model gagal
  throw lastError ?? new Error("Semua model ekstraksi gagal memproses dokumen/gambar.");
}

/**
 * Alias kompatibilitas mundur untuk pemanggil yang menggunakan nama fungsi lama
 */
export async function extractTransactionsFromImage(
  imageUrl: string
): Promise<ExtractionResult> {
  return extractTransactionsFromFile(imageUrl, "image");
}

