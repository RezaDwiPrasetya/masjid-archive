import * as XLSX from "xlsx";

export interface TransactionExportItem {
  no: number;
  date: string;
  type: string;
  donorName: string;
  description: string;
  income: number | "";
  expense: number | "";
  balance: number;
}

export interface WeeklyReportExportData {
  reportDate: Date;
  uploadedByName: string;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  finalBalance: number;
  transactions: {
    transactionDate: Date | null;
    type: string;
    amount: number;
    description: string;
    donorNameRaw: string | null;
    donorNameCanonical?: string | null;
  }[];
}

export interface MonthlyReportExportData {
  year: number;
  month: number;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  finalBalance: number;
  transactions: {
    transactionDate: Date | null;
    type: string;
    amount: number;
    description: string;
    donorNameRaw: string | null;
    donorNameCanonical?: string | null;
    reportDate: Date;
  }[];
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Membuat buffer Excel (.xlsx) untuk laporan kas mingguan
 */
export function generateWeeklyReportExcel(data: WeeklyReportExportData): Buffer {
  const wb = XLSX.utils.book_new();

  const formattedDate = data.reportDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Susun baris sheet secara terstruktur
  const wsData: (string | number)[][] = [
    ["DEWAN KEMAKMURAN MASJID (DKM) AL-LUQMAN"],
    ["Jl. Mayjen Sutoyo, Kel. Soklat, Kec. Subang, Kab. Subang - Jawa Barat"],
    ["REKAPITULASI BUKU KAS MINGGUAN"],
    [],
    ["Tanggal Laporan:", formattedDate],
    ["Petugas Pencatat:", data.uploadedByName],
    [],
    ["RINGKASAN FINANSIAL"],
    ["Saldo Kas Lalu:", data.initialBalance],
    ["Total Pemasukan Pekan Ini:", data.totalIncome],
    ["Total Pengeluaran Pekan Ini:", data.totalExpense],
    ["Saldo Kas Akhir:", data.finalBalance],
    [],
    ["RINCIAN MUTASI TRANSAKSI KAS"],
    ["No", "Tanggal", "Jenis", "Donatur / Sumber", "Uraian / Keterangan", "Pemasukan (Rp)", "Pengeluaran (Rp)", "Saldo Berjalan (Rp)"],
  ];

  let currentBalance = data.initialBalance;

  // Baris saldo awal
  wsData.push([
    "-",
    "-",
    "Saldo Awal",
    "-",
    "Saldo kas awal periode",
    "",
    "",
    currentBalance,
  ]);

  data.transactions.forEach((tx, idx) => {
    const isIncome = tx.type === "pemasukan";
    const amount = tx.amount;
    if (isIncome) {
      currentBalance += amount;
    } else {
      currentBalance -= amount;
    }

    const txDateStr = tx.transactionDate
      ? tx.transactionDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

    const donor = tx.donorNameCanonical || tx.donorNameRaw || (isIncome ? "Infaq Anonim / Tromol" : "-");

    wsData.push([
      idx + 1,
      txDateStr,
      isIncome ? "Pemasukan" : "Pengeluaran",
      donor,
      tx.description,
      isIncome ? amount : "",
      !isIncome ? amount : "",
      currentBalance,
    ]);
  });

  // Baris total
  wsData.push([]);
  wsData.push([
    "TOTAL",
    "",
    "",
    "",
    "",
    data.totalIncome,
    data.totalExpense,
    data.finalBalance,
  ]);

  // Pengesahan tanda tangan
  wsData.push([]);
  wsData.push([]);
  wsData.push(["", "", "", "", "Subang, " + formattedDate]);
  wsData.push(["", "Mengetahui,", "", "", "Petugas Bendahara,"]);
  wsData.push(["", "Ketua DKM Al-Luqman", "", "", "Bendahara DKM"]);
  wsData.push([]);
  wsData.push([]);
  wsData.push(["", "( .................................... )", "", "", "( .................................... )"]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set lebar kolom agar rapi
  ws["!cols"] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 14 }, // Jenis
    { wch: 26 }, // Donatur
    { wch: 38 }, // Keterangan
    { wch: 18 }, // Masuk
    { wch: 18 }, // Keluar
    { wch: 20 }, // Saldo
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Kas Mingguan");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

/**
 * Membuat buffer Excel (.xlsx) untuk laporan kas bulanan
 */
export function generateMonthlyReportExcel(data: MonthlyReportExportData): Buffer {
  const wb = XLSX.utils.book_new();

  const monthName = MONTH_NAMES[data.month - 1] || `Bulan ${data.month}`;
  const periodTitle = `${monthName} ${data.year}`;

  const wsData: (string | number)[][] = [
    ["DEWAN KEMAKMURAN MASJID (DKM) AL-LUQMAN"],
    ["Jl. Mayjen Sutoyo, Kel. Soklat, Kec. Subang, Kab. Subang - Jawa Barat"],
    [`REKAPITULASI BUKU KAS BULANAN — ${periodTitle.toUpperCase()}`],
    [],
    ["Periode:", periodTitle],
    ["Jumlah Transaksi Terverifikasi:", data.transactions.length],
    [],
    ["RINGKASAN FINANSIAL BULAN INI"],
    ["Saldo Awal Bulan:", data.initialBalance],
    ["Total Pemasukan Bulan Ini:", data.totalIncome],
    ["Total Pengeluaran Bulan Ini:", data.totalExpense],
    ["Saldo Akhir Bulan:", data.finalBalance],
    [],
    ["MUTASI KAS SELURUH BULAN"],
    ["No", "Tanggal", "Jenis", "Donatur / Sumber", "Uraian / Keterangan", "Pemasukan (Rp)", "Pengeluaran (Rp)", "Saldo Berjalan (Rp)"],
  ];

  let currentBalance = data.initialBalance;

  // Baris saldo awal
  wsData.push([
    "-",
    "-",
    "Saldo Awal",
    "-",
    `Saldo awal per 1 ${periodTitle}`,
    "",
    "",
    currentBalance,
  ]);

  data.transactions.forEach((tx, idx) => {
    const isIncome = tx.type === "pemasukan";
    const amount = tx.amount;
    if (isIncome) {
      currentBalance += amount;
    } else {
      currentBalance -= amount;
    }

    const txDateStr = tx.transactionDate
      ? tx.transactionDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : tx.reportDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

    const donor = tx.donorNameCanonical || tx.donorNameRaw || (isIncome ? "Infaq Anonim / Tromol" : "-");

    wsData.push([
      idx + 1,
      txDateStr,
      isIncome ? "Pemasukan" : "Pengeluaran",
      donor,
      tx.description,
      isIncome ? amount : "",
      !isIncome ? amount : "",
      currentBalance,
    ]);
  });

  // Baris total
  wsData.push([]);
  wsData.push([
    "TOTAL",
    "",
    "",
    "",
    "",
    data.totalIncome,
    data.totalExpense,
    data.finalBalance,
  ]);

  // Pengesahan
  wsData.push([]);
  wsData.push([]);
  wsData.push(["", "", "", "", `Subang, Akhir ${periodTitle}`]);
  wsData.push(["", "Mengetahui,", "", "", "Petugas Bendahara,"]);
  wsData.push(["", "Ketua DKM Al-Luqman", "", "", "Bendahara DKM"]);
  wsData.push([]);
  wsData.push([]);
  wsData.push(["", "( .................................... )", "", "", "( .................................... )"]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 14 },
    { wch: 26 },
    { wch: 38 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Kas ${monthName}`);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
