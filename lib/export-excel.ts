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

export interface YearlyMonthSummary {
  month: number;
  monthName: string;
  reportCount: number;
  income: number;
  expense: number;
  net: number;
  closingBalance: number;
}

export interface YearlyReportExportData {
  year: number;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  finalBalance: number;
  monthSummaries: YearlyMonthSummary[];
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

/**
 * Membuat buffer Excel (.xlsx) untuk laporan kas tahunan penuh
 */
export function generateYearlyReportExcel(data: YearlyReportExportData): Buffer {
  const wb = XLSX.utils.book_new();

  // === SHEET 1: REKAPITULASI 12 BULAN TAHUNAN ===
  const totalReportsCount = data.monthSummaries.reduce((acc, m) => acc + m.reportCount, 0);

  const wsSummaryData: (string | number)[][] = [
    ["DEWAN KEMAKMURAN MASJID (DKM) AL-LUQMAN"],
    ["Jl. Mayjen Sutoyo, Kel. Soklat, Kec. Subang, Kab. Subang - Jawa Barat"],
    [`REKAPITULASI BUKU KAS TAHUNAN — TAHUN ${data.year}`],
    [],
    ["Periode Fiskal:", `Tahun ${data.year} (Januari - Desember)`],
    ["Total Laporan Pekanan:", totalReportsCount],
    ["Total Transaksi Terverifikasi:", data.transactions.length],
    [],
    ["RINGKASAN FINANSIAL TAHUNAN"],
    ["Saldo Awal Tahun:", data.initialBalance],
    ["Total Pemasukan Tahunan:", data.totalIncome],
    ["Total Pengeluaran Tahunan:", data.totalExpense],
    ["Arus Kas Bersih (Surplus/Defisit):", data.totalIncome - data.totalExpense],
    ["Saldo Akhir Kas Tahun Ini:", data.finalBalance],
    [],
    ["REKAPITULASI KAS PER BULAN"],
    ["No", "Bulan", "Jumlah Laporan", "Pemasukan (Rp)", "Pengeluaran (Rp)", "Surplus/Defisit (Rp)", "Saldo Akhir Bulan (Rp)"],
  ];

  data.monthSummaries.forEach((ms) => {
    wsSummaryData.push([
      ms.month,
      ms.monthName,
      ms.reportCount,
      ms.income,
      ms.expense,
      ms.net,
      ms.closingBalance,
    ]);
  });

  // Baris Total Akumulasi
  wsSummaryData.push([]);
  wsSummaryData.push([
    "TOTAL",
    "",
    totalReportsCount,
    data.totalIncome,
    data.totalExpense,
    data.totalIncome - data.totalExpense,
    data.finalBalance,
  ]);

  // Kolom Tanda Tangan
  wsSummaryData.push([]);
  wsSummaryData.push([]);
  wsSummaryData.push(["", "", "", "", `Subang, 31 Desember ${data.year}`]);
  wsSummaryData.push(["", "Mengetahui,", "", "", "Petugas Bendahara,"]);
  wsSummaryData.push(["", "Ketua DKM Al-Luqman", "", "", "Bendahara DKM"]);
  wsSummaryData.push([]);
  wsSummaryData.push([]);
  wsSummaryData.push(["", "( .................................... )", "", "", "( .................................... )"]);

  const wsSummary = XLSX.utils.aoa_to_sheet(wsSummaryData);
  wsSummary["!cols"] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, `Rekap Tahunan ${data.year}`);

  // === SHEET 2: DAFTAR TRANSAKSI MUTASI TAHUNAN ===
  const wsTxData: (string | number)[][] = [
    ["DEWAN KEMAKMURAN MASJID (DKM) AL-LUQMAN"],
    [`MUTASI TRANSAKSI KAS TAHUNAN — TAHUN ${data.year}`],
    [],
    ["No", "Tanggal", "Bulan", "Jenis", "Donatur / Sumber", "Uraian / Keterangan", "Pemasukan (Rp)", "Pengeluaran (Rp)", "Saldo Berjalan (Rp)"],
  ];

  let currentBalance = data.initialBalance;

  // Baris Saldo Awal
  wsTxData.push([
    "-",
    "-",
    "-",
    "Saldo Awal",
    "-",
    `Saldo awal kas per 1 Januari ${data.year}`,
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

    const txDate = tx.transactionDate
      ? new Date(tx.transactionDate).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : new Date(tx.reportDate).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

    const mIndex = tx.transactionDate
      ? new Date(tx.transactionDate).getMonth()
      : new Date(tx.reportDate).getMonth();
    const monthLabel = MONTH_NAMES[mIndex] || "-";

    const donor = tx.donorNameCanonical || tx.donorNameRaw || (isIncome ? "Hamba Allah (Anonim)" : "-");

    wsTxData.push([
      idx + 1,
      txDate,
      monthLabel,
      isIncome ? "Pemasukan" : "Pengeluaran",
      donor,
      tx.description,
      isIncome ? amount : "",
      !isIncome ? amount : "",
      currentBalance,
    ]);
  });

  wsTxData.push([]);
  wsTxData.push([
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    data.totalIncome,
    data.totalExpense,
    data.finalBalance,
  ]);

  const wsTx = XLSX.utils.aoa_to_sheet(wsTxData);
  wsTx["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 26 },
    { wch: 38 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, `Mutasi Transaksi ${data.year}`);

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
