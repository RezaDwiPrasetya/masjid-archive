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
        },
        required: ["type", "amount", "description"],
      },
    },
  },
  required: ["transactions"],
} as unknown as Schema;

// Prompt disusun untuk buku kas dan lembar laporan keuangan masjid tulisan tangan.
const EXTRACTION_PROMPT = `
Kamu adalah asisten akuntansi yang membantu membaca dan mendigitalkan laporan kas keuangan masjid yang ditulis tangan.

Foto yang diberikan bisa berupa halaman buku kas besar atau lembaran laporan keuangan mingguan/pekanan yang dipajang di papan masjid.
Biasanya terdapat bagian "PEMASUKAN KAS MASJID" dan "PENGELUARAN KAS MASJID", serta catatan saldo awal di bagian atas dan saldo akhir di bagian bawah.

Tugasmu:
1. Ekstrak SETIAP baris rincian pemasukan dan pengeluaran sebagai satu entri transaksi terpisah.
   - JANGAN memasukkan baris rekapitulasi/subtotal seperti "JUMLAH", "TOTAL", atau baris tanda tangan bendahara.
2. Untuk setiap baris transaksi, isi:
   - "type": "pemasukan" atau "pengeluaran"
   - "amount": angka bulat integer dalam satuan Rupiah (tanpa titik, koma, atau garis)
   - "description": teks keterangan transaksi dari kertas tersebut
   - "transactionDate": tanggal transaksi jika tertulis per baris (format ISO YYYY-MM-DD), atau null jika tidak ada
3. Ekstrak saldo pembukuan:
   - "initialBalance": Saldo awal / saldo kas pekan lalu yang tertulis di bagian atas (misal: "TOTAL SALDO TGL...", "SALDO LALU", "SALDO AWAL"). Ambil nilai nominalnya sebagai angka bulat integer biasa (misal: 1485000). Abaikan garis bawah atau tanda sama dengan di bawah angka. Jika tidak ada, isi null.
   - "finalBalance": Total saldo akhir kas masjid yang tertulis di bagian bawah setelah dihitung dengan pemasukan dan pengeluaran (misal: "TOTAL KAS MESJID TGL...", "SALDO AKHIR"). Ambil nominal hasil akhirnya sebagai angka bulat integer biasa (misal: 1605000). Abaikan garis bawah atau tanda sama dengan di bawah angka. Jika tidak ada, isi null.
4. Jika foto buram/gelap/tidak bisa dibaca sama sekali, kembalikan array "transactions" yang kosong [] dan saldo null.

Penting: output HANYA berisi data yang benar-benar terbaca di foto, tidak boleh ada data rekaan.
`.trim();

export type ExtractedTransaction = {
  type: "pemasukan" | "pengeluaran";
  amount: number;
  description: string;
  transactionDate: string | null;
};

export type ExtractionResult = {
  transactions: ExtractedTransaction[];
  initialBalance: number | null;
  finalBalance: number | null;
  rawResponse: Record<string, unknown>;
  modelName: string;
};

/**
 * Ambil gambar dari URL publik Supabase dan kirim ke Gemini
 * untuk diekstrak menjadi daftar transaksi terstruktur beserta saldo awal & akhir buku.
 */
export async function extractTransactionsFromImage(
  imageUrl: string
): Promise<ExtractionResult> {
  // Fetch gambar dari Supabase Storage sebagai binary
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(
      `Gagal mengambil gambar dari storage (HTTP ${imageResponse.status})`
    );
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBase64 = Buffer.from(imageBuffer).toString("base64");
  const imageMimeType = imageResponse.headers.get("content-type") ?? "image/jpeg";

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
              mimeType: imageMimeType,
              data: imageBase64,
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
  throw lastError ?? new Error("Semua model ekstraksi gagal memproses gambar.");
}
