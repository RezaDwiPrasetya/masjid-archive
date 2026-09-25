import * as XLSX from "xlsx";
import { gemini, GEMINI_MODEL } from "@/lib/gemini";
import type { ExtractedTransaction, ExtractionResult } from "@/lib/extract-transactions";

// Helper: membersihkan angka dari format rupiah, titik, koma, dsb.
function parseCleanNumber(val: unknown): number {
  if (typeof val === "number") return Math.round(val);
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]+/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(Math.abs(num));
}

// Helper: memformat tanggal Excel serial atau string ke ISO YYYY-MM-DD
function formatExcelDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.toISOString().split("T")[0];
  }
  if (typeof val === "number") {
    // Excel serial date conversion
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed) {
      const y = parsed.y;
      const m = String(parsed.m).padStart(2, "0");
      const d = String(parsed.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Cek format DD/MM/YYYY atau DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

/**
 * Parsing langsung (deterministik) tabel kas dari baris 2D Excel
 */
function tryDeterministicParse(rows: unknown[][]): {
  transactions: ExtractedTransaction[];
  initialBalance: number | null;
  finalBalance: number | null;
} | null {
  let headerRowIdx = -1;
  let dateCol = -1;
  let descCol = -1;
  let incomeCol = -1;
  let expenseCol = -1;
  let donorCol = -1;
  let balanceCol = -1;

  // 1. Cari baris header yang memuat kolom kunci
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;

    for (let c = 0; c < row.length; c++) {
      const cellText = String(row[c] ?? "").toLowerCase().trim();
      if (!cellText) continue;

      if (/^(tgl|tanggal|waktu|date)$/i.test(cellText)) dateCol = c;
      if (/(uraian|keterangan|deskripsi|rincian|kegiatan|transaksi)/i.test(cellText)) descCol = c;
      if (/(masuk|pemasukan|debit|debet|terima|penerimaan)/i.test(cellText)) incomeCol = c;
      if (/(keluar|pengeluaran|kredit|credit|biaya|belanja)/i.test(cellText)) expenseCol = c;
      if (/(donatur|nama donatur|pemberi)/i.test(cellText)) donorCol = c;
      if (/(saldo|sisa)/i.test(cellText)) balanceCol = c;
    }

    // Jika minimal ada kolom deskripsi dan (masuk atau keluar), anggap ini header
    if (descCol !== -1 && (incomeCol !== -1 || expenseCol !== -1)) {
      headerRowIdx = r;
      break;
    }
  }

  // Jika tidak ditemukan struktur kolom standar, kembalikan null untuk fallback AI
  if (headerRowIdx === -1) return null;

  const transactions: ExtractedTransaction[] = [];
  let initialBalance: number | null = null;
  let finalBalance: number | null = null;

  // 2. Baca baris-baris data di bawah header
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const descRaw = descCol !== -1 ? String(row[descCol] ?? "").trim() : "";
    if (!descRaw) continue;

    const descLower = descRaw.toLowerCase();

    // Lewati baris subtotal / total / tanda tangan
    if (/^(total|jumlah|subtotal|rekapitulasi|tanda tangan|mengetahui)/i.test(descLower)) {
      continue;
    }

    // Deteksi Saldo Awal di baris
    if (/(saldo awal|saldo lalu|total saldo tgl|kas awal)/i.test(descLower)) {
      const candidateBal =
        incomeCol !== -1 && parseCleanNumber(row[incomeCol]) > 0
          ? parseCleanNumber(row[incomeCol])
          : balanceCol !== -1
          ? parseCleanNumber(row[balanceCol])
          : 0;
      if (candidateBal > 0) initialBalance = candidateBal;
      continue;
    }

    // Deteksi Saldo Akhir di baris
    if (/(saldo akhir|sisa kas|total kas akhir|total saldo akhir)/i.test(descLower)) {
      const candidateBal =
        balanceCol !== -1 && parseCleanNumber(row[balanceCol]) > 0
          ? parseCleanNumber(row[balanceCol])
          : incomeCol !== -1
          ? parseCleanNumber(row[incomeCol])
          : 0;
      if (candidateBal > 0) finalBalance = candidateBal;
      continue;
    }

    const incomeVal = incomeCol !== -1 ? parseCleanNumber(row[incomeCol]) : 0;
    const expenseVal = expenseCol !== -1 ? parseCleanNumber(row[expenseCol]) : 0;
    const dateVal = dateCol !== -1 ? formatExcelDate(row[dateCol]) : null;

    let donorNameVal: string | null = null;
    if (donorCol !== -1 && row[donorCol]) {
      const dName = String(row[donorCol]).trim();
      if (dName && !/(hamba allah|anonim|kas masjid|tromol|kotak amal)/i.test(dName)) {
        donorNameVal = dName;
      }
    }

    // Jika ada nilai pemasukan
    if (incomeVal > 0) {
      transactions.push({
        type: "pemasukan",
        amount: incomeVal,
        description: descRaw,
        transactionDate: dateVal,
        donorName: donorNameVal,
      });
    }

    // Jika ada nilai pengeluaran
    if (expenseVal > 0) {
      transactions.push({
        type: "pengeluaran",
        amount: expenseVal,
        description: descRaw,
        transactionDate: dateVal,
        donorName: null,
      });
    }
  }

  // Jika berhasil mengekstrak minimal satu transaksi
  if (transactions.length > 0) {
    return { transactions, initialBalance, finalBalance };
  }

  return null;
}

/**
 * Fallback AI menggunakan Gemini untuk membaca tabel Excel jika formatnya tidak standar
 */
async function parseExcelWithGemini(csvContent: string): Promise<ExtractionResult> {
  const model = gemini.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `
Kamu adalah asisten akuntansi pembukuan masjid.
Berikut adalah isi lembar spreadsheet Excel pembukuan kas masjid dalam format CSV:

\`\`\`csv
${csvContent.slice(0, 30000)}
\`\`\`

Tugasmu:
1. Ekstrak setiap baris pemasukan dan pengeluaran sebagai entri transaksi.
   Abaikan baris total/subtotal/rekapitulasi.
2. Format output harus berupa JSON persis dengan struktur:
{
  "initialBalance": <angka saldo awal atau null>,
  "finalBalance": <angka saldo akhir atau null>,
  "transactions": [
    {
      "type": "pemasukan" | "pengeluaran",
      "amount": <angka bulat integer rupiah>,
      "description": "<uraian teks asli>",
      "transactionDate": "<YYYY-MM-DD atau null>",
      "donorName": "<nama donatur jika tertulis di pemasukan, selain itu null>"
    }
  ]
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text);

  return {
    transactions: parsed.transactions ?? [],
    initialBalance: parsed.initialBalance ?? null,
    finalBalance: parsed.finalBalance ?? null,
    rawResponse: parsed,
    modelName: `${GEMINI_MODEL} (Excel Hybrid)`,
  };
}

/**
 * Fungsi utama untuk membaca file Excel (XLSX / XLS) dari Supabase storage
 */
export async function parseTransactionsFromExcel(fileUrl: string): Promise<ExtractionResult> {
  const res = await fetch(fileUrl);
  if (!res.ok) {
    throw new Error(`Gagal mengunduh file Excel dari storage (HTTP ${res.status})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "buffer", cellDates: true });

  if (workbook.SheetNames.length === 0) {
    throw new Error("File Excel tidak memiliki lembar kerja (worksheet).");
  }

  // Ambil lembar kerja pertama
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // 1. Coba parsing deterministik terlebih dahulu (100% cepat & tanpa biaya token)
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "" });
  const deterministicResult = tryDeterministicParse(rows);

  if (deterministicResult && deterministicResult.transactions.length > 0) {
    return {
      transactions: deterministicResult.transactions,
      initialBalance: deterministicResult.initialBalance,
      finalBalance: deterministicResult.finalBalance,
      rawResponse: { method: "direct_deterministic_parser", sheet: firstSheetName, rowsCount: rows.length },
      modelName: "Direct Excel Parser (100% Akurasi)",
    };
  }

  // 2. Jika format tabel tidak standar/acak, gunakan fallback Gemini dengan data CSV
  const csvData = XLSX.utils.sheet_to_csv(worksheet);
  return await parseExcelWithGemini(csvData);
}
