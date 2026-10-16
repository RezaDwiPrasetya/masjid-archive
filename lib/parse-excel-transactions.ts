import * as XLSX from "xlsx";
import { gemini, GEMINI_MODEL } from "@/lib/gemini";
import type { ExtractedTransaction, ExtractionResult } from "@/lib/extract-transactions";

// Helper: membersihkan angka dari format rupiah, titik ribuan, desimal, dsb.
function parseCleanNumber(val: unknown): number {
  if (typeof val === "number") return isNaN(val) ? 0 : Math.round(val);
  if (!val) return 0;
  const str = String(val).trim();
  if (!str || /^[-–—\s]+$/.test(str)) return 0;

  // Tangani kemungkinan desimal sen di ujung (misal: "350.000,00"), buang sen
  let s = str.replace(/,\d{1,2}$/, "");
  // Hapus semua karakter non-angka
  s = s.replace(/[^0-9]+/g, "");
  const num = parseInt(s, 10);
  return isNaN(num) ? 0 : num;
}

// Helper: memformat tanggal Excel serial atau string ke ISO YYYY-MM-DD
function formatExcelDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    // Gunakan UTC parts agar tidak tergeser zona waktu lokal
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, "0");
    const d = String(val.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
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

  // Cek format YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Cek format tanggal teks Indonesia (misal: "28 November 2025" atau "28 Nov 2025")
  const idDateMatch = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (idDateMatch) {
    const [, d, monStr, y] = idDateMatch;
    const monLower = monStr.toLowerCase();
    const monthMap: Record<string, string> = {
      jan: "01", januari: "01",
      feb: "02", februari: "02",
      mar: "03", maret: "03",
      apr: "04", april: "04",
      mei: "05", may: "05",
      jun: "06", juni: "06",
      jul: "07", juli: "07",
      agu: "08", agustus: "08", aug: "08",
      sep: "09", september: "09",
      okt: "10", oktober: "10", oct: "10",
      nov: "11", november: "11",
      des: "12", desember: "12", dec: "12",
    };
    const m = monthMap[monLower] || monthMap[monLower.slice(0, 3)];
    if (m) {
      return `${y}-${m}-${d.padStart(2, "0")}`;
    }
  }

  return null;
}

// Helper: Ekstrak Saldo Awal dan Saldo Akhir dari blok ringkasan di luar tabel utama jika ada
function extractBalancesFromSummary(rows: unknown[][]): {
  initialBalance: number | null;
  finalBalance: number | null;
} {
  let initialBalance: number | null = null;
  let finalBalance: number | null = null;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    for (let c = 0; c < row.length; c++) {
      const cellText = String(row[c] ?? "").trim().toLowerCase();
      if (!cellText) continue;

      // Cek Saldo Kas Lalu / Saldo Kas Awal di ringkasan
      if (
        initialBalance === null &&
        /(saldo kas lalu|saldo kas awal|saldo awal|saldo lalu|kas awal)/i.test(cellText) &&
        !/(total|mutasi|rincian)/i.test(cellText)
      ) {
        for (let nextC = c + 1; nextC < row.length; nextC++) {
          const num = parseCleanNumber(row[nextC]);
          if (num > 0) {
            initialBalance = num;
            break;
          }
        }
      }

      // Cek Saldo Kas Akhir / Sisa Kas di ringkasan
      if (
        finalBalance === null &&
        /(saldo kas akhir|saldo akhir|sisa kas|total kas akhir|saldo penutupan)/i.test(cellText)
      ) {
        for (let nextC = c + 1; nextC < row.length; nextC++) {
          const num = parseCleanNumber(row[nextC]);
          if (num > 0) {
            finalBalance = num;
            break;
          }
        }
      }
    }
  }

  return { initialBalance, finalBalance };
}

/**
 * Parsing langsung (deterministik) tabel kas dari baris 2D Excel
 */
export function tryDeterministicParse(rows: unknown[][]): {
  transactions: ExtractedTransaction[];
  initialBalance: number | null;
  finalBalance: number | null;
} | null {
  // Ambil saldo dari blok ringkasan (misal "RINGKASAN FINANSIAL" di header sheet)
  const summaryBalances = extractBalancesFromSummary(rows);
  let initialBalance: number | null = summaryBalances.initialBalance;
  let finalBalance: number | null = summaryBalances.finalBalance;

  let headerRowIdx = -1;
  let noCol = -1;
  let dateCol = -1;
  let typeCol = -1;
  let donorCol = -1;
  let descCol = -1;
  let incomeCol = -1;
  let expenseCol = -1;
  let balanceCol = -1;
  let amountCol = -1;

  // 1. Cari baris header yang memuat kolom-kolom kunci secara eksplisit DALAM SATU BARIS
  for (let r = 0; r < Math.min(rows.length, 50); r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length < 2) continue;

    let tNoCol = -1;
    let tDateCol = -1;
    let tTypeCol = -1;
    let tDonorCol = -1;
    let tDescCol = -1;
    let tIncomeCol = -1;
    let tExpenseCol = -1;
    let tBalanceCol = -1;
    let tAmountCol = -1;

    for (let c = 0; c < row.length; c++) {
      const cellText = String(row[c] ?? "").trim();
      if (!cellText) continue;
      const lower = cellText.toLowerCase();

      // No
      if (/^(no|no\.|nomor|#)$/i.test(lower)) {
        tNoCol = c;
      }
      // Tanggal
      else if (/^(tgl|tanggal|waktu|date|tgl\.|tanggal transaksi)$/i.test(lower)) {
        tDateCol = c;
      }
      // Jenis / Tipe
      else if (/^(jenis|tipe|kategori|jenis transaksi|tipe transaksi|arus)$/i.test(lower)) {
        tTypeCol = c;
      }
      // Donatur / Sumber
      else if (/^(donatur|sumber|donatur\s*[\/\\]\s*sumber|nama donatur|pemberi|muzaqqi|muzakki)$/i.test(lower)) {
        tDonorCol = c;
      }
      // Pemasukan
      else if (
        /^(masuk|pemasukan|debit|debet|terima|penerimaan|kas masuk|pemasukan\s*\(rp\)|debet\s*\(rp\)|masuk\s*\(rp\))$/i.test(lower)
      ) {
        tIncomeCol = c;
      }
      // Pengeluaran
      else if (
        /^(keluar|pengeluaran|kredit|credit|biaya|belanja|kas keluar|pengeluaran\s*\(rp\)|kredit\s*\(rp\)|keluar\s*\(rp\))$/i.test(lower)
      ) {
        tExpenseCol = c;
      }
      // Saldo Berjalan
      else if (/^(saldo|sisa|saldo berjalan|saldo akhir|saldo\s*\(rp\)|saldo berjalan\s*\(rp\))$/i.test(lower)) {
        tBalanceCol = c;
      }
      // Nominal / Jumlah (jika tabel 1 kolom jumlah)
      else if (/^(nominal|jumlah|total transaksi|nilai|jumlah\s*\(rp\)|nominal\s*\(rp\))$/i.test(lower)) {
        tAmountCol = c;
      }
      // Uraian / Keterangan
      else if (
        /^(uraian|keterangan|deskripsi|rincian|perincian|uraian\s*[\/\\]\s*keterangan|rincian transaksi|keterangan transaksi|kegiatan|nama transaksi)$/i.test(lower) ||
        (/^uraian/i.test(lower) && lower.length <= 25) ||
        (/^keterangan/i.test(lower) && lower.length <= 25)
      ) {
        tDescCol = c;
      }
    }

    // Periksa apakah baris ini adalah header yang valid:
    // Kolom-kolom yang terdeteksi harus unik (tidak bertabrakan pada sel yang sama)
    const detected = [
      tNoCol,
      tDateCol,
      tTypeCol,
      tDonorCol,
      tDescCol,
      tIncomeCol,
      tExpenseCol,
      tBalanceCol,
      tAmountCol,
    ].filter((col) => col !== -1);

    const isUnique = new Set(detected).size === detected.length;
    if (!isUnique || detected.length < 2) continue;

    // Syarat header tabel transaksi:
    // Harus ada (kolom deskripsi ATAU jenis) DAN (kolom masuk/keluar/amount)
    const hasDescAndAmount =
      tDescCol !== -1 && (tIncomeCol !== -1 || tExpenseCol !== -1 || tAmountCol !== -1);
    const hasTypeAndAmount =
      tTypeCol !== -1 && (tIncomeCol !== -1 || tExpenseCol !== -1 || tAmountCol !== -1);

    if (hasDescAndAmount || hasTypeAndAmount) {
      headerRowIdx = r;
      noCol = tNoCol;
      dateCol = tDateCol;
      typeCol = tTypeCol;
      donorCol = tDonorCol;
      descCol = tDescCol;
      incomeCol = tIncomeCol;
      expenseCol = tExpenseCol;
      balanceCol = tBalanceCol;
      amountCol = tAmountCol;
      break;
    }
  }

  // Jika tidak ditemukan struktur kolom standar, kembalikan null untuk fallback AI
  if (headerRowIdx === -1) return null;

  let latestRunningBalance: number | null = null;
  const parsedTxList: ExtractedTransaction[] = [];

  // 2. Baca baris-baris data transaksi di bawah header
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    // Periksa apakah baris kosong
    const isRowEmpty = row.every((c) => String(c ?? "").trim() === "");
    if (isRowEmpty) continue;

    const descRaw = descCol !== -1 ? String(row[descCol] ?? "").trim() : "";
    const descLower = descRaw.toLowerCase();
    const typeRaw = typeCol !== -1 ? String(row[typeCol] ?? "").trim() : "";
    const typeLower = typeRaw.toLowerCase();
    const firstColVal = String(row[0] ?? "").trim().toLowerCase();

    // Lewati baris subtotal / total / rekapitulasi
    const isTotalRow =
      /^(total|jumlah|subtotal|grand total|rekapitulasi)/i.test(descLower) ||
      /^(total|jumlah|subtotal|grand total|rekapitulasi)/i.test(firstColVal) ||
      /^(total|jumlah)/i.test(typeLower);

    if (isTotalRow) {
      if (balanceCol !== -1) {
        const candidateBal = parseCleanNumber(row[balanceCol]);
        if (candidateBal > 0) finalBalance = candidateBal;
      }
      continue;
    }

    // Lewati baris tanda tangan / penutup
    if (
      /^(mengetahui|ketua|petugas|bendahara|sekretaris|tanda tangan|\(.*\))/i.test(firstColVal) ||
      /^(mengetahui|ketua|petugas|bendahara|sekretaris|tanda tangan|\(.*\))/i.test(descLower)
    ) {
      continue;
    }

    // Deteksi Saldo Awal di baris data
    const isInitialBalanceRow =
      /saldo\s*(awal|lalu|kemarin|kas awal)/i.test(descLower) ||
      /saldo\s*(awal|lalu)/i.test(typeLower);

    if (isInitialBalanceRow) {
      const candidateBal =
        balanceCol !== -1 && parseCleanNumber(row[balanceCol]) > 0
          ? parseCleanNumber(row[balanceCol])
          : incomeCol !== -1 && parseCleanNumber(row[incomeCol]) > 0
          ? parseCleanNumber(row[incomeCol])
          : amountCol !== -1 && parseCleanNumber(row[amountCol]) > 0
          ? parseCleanNumber(row[amountCol])
          : 0;

      if (candidateBal > 0 && initialBalance === null) {
        initialBalance = candidateBal;
      }
      continue;
    }

    // Deteksi Saldo Akhir di baris data
    const isFinalBalanceRow =
      /saldo\s*(akhir|penutupan|kas akhir)|sisa kas/i.test(descLower) ||
      /saldo\s*akhir/i.test(typeLower);

    if (isFinalBalanceRow) {
      const candidateBal =
        balanceCol !== -1 && parseCleanNumber(row[balanceCol]) > 0
          ? parseCleanNumber(row[balanceCol])
          : 0;

      if (candidateBal > 0) {
        finalBalance = candidateBal;
      }
      continue;
    }

    // Ambil nilai nominal pemasukan dan pengeluaran
    const incomeVal = incomeCol !== -1 ? parseCleanNumber(row[incomeCol]) : 0;
    const expenseVal = expenseCol !== -1 ? parseCleanNumber(row[expenseCol]) : 0;
    const amountVal = amountCol !== -1 ? parseCleanNumber(row[amountCol]) : 0;

    // Jika tidak ada nominal pada baris ini, bukan transaksi
    if (incomeVal === 0 && expenseVal === 0 && amountVal === 0) {
      continue;
    }

    // Tentukan tanggal transaksi
    const dateVal = dateCol !== -1 ? formatExcelDate(row[dateCol]) : null;

    // Tentukan nama donatur jika ada
    let donorNameVal: string | null = null;
    if (donorCol !== -1 && row[donorCol]) {
      const dName = String(row[donorCol]).trim();
      if (dName && !/(hamba allah|anonim|kas masjid|tromol|kotak amal|^[-–—]+$)/i.test(dName)) {
        donorNameVal = dName;
      }
    }

    // Tentukan deskripsi transaksi
    const finalDesc = descRaw || typeRaw || "Transaksi Kas";

    // Catat running balance jika kolom saldo tersedia
    if (balanceCol !== -1) {
      const bVal = parseCleanNumber(row[balanceCol]);
      if (bVal > 0) latestRunningBalance = bVal;
    }

    // Klasifikasikan transaksi
    if (incomeVal > 0) {
      parsedTxList.push({
        type: "pemasukan",
        amount: incomeVal,
        description: finalDesc,
        transactionDate: dateVal,
        donorName: donorNameVal,
      });
    }

    if (expenseVal > 0) {
      parsedTxList.push({
        type: "pengeluaran",
        amount: expenseVal,
        description: finalDesc,
        transactionDate: dateVal,
        donorName: null,
      });
    }

    // Jika menggunakan format satu kolom nominal (amount) dan satu kolom tipe (type)
    if (incomeVal === 0 && expenseVal === 0 && amountVal > 0) {
      const isExpense = /(keluar|pengeluaran|kredit|credit|biaya|belanja)/i.test(typeLower);
      parsedTxList.push({
        type: isExpense ? "pengeluaran" : "pemasukan",
        amount: amountVal,
        description: finalDesc,
        transactionDate: dateVal,
        donorName: isExpense ? null : donorNameVal,
      });
    }
  }

  // Jika finalBalance belum ditemukan tetapi ada running balance terakhir
  if (finalBalance === null && latestRunningBalance !== null) {
    finalBalance = latestRunningBalance;
  }

  // Jika berhasil mengekstrak minimal satu transaksi
  if (parsedTxList.length > 0) {
    return { transactions: parsedTxList, initialBalance, finalBalance };
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
  let cleanText = text.trim();
  if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  const parsed = JSON.parse(cleanText);

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
