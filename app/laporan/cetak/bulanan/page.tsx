import { prisma } from "@/lib/prisma";
import { PrintActionBar } from "@/components/print-action-bar";

export const dynamic = "force-dynamic";

interface CetakBulananPageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default async function CetakLaporanBulananPage({ searchParams }: CetakBulananPageProps) {
  const { year: qYear, month: qMonth } = await searchParams;
  const now = new Date();
  const year = parseInt(qYear || String(now.getFullYear()), 10);
  const month = parseInt(qMonth || String(now.getMonth() + 1), 10);

  const monthName = MONTH_NAMES[month - 1] || `Bulan ${month}`;
  const periodTitle = `${monthName} ${year}`;

  const reports = await prisma.report.findMany({
    where: {
      year,
      month,
    },
    orderBy: { reportDate: "asc" },
    include: {
      attachments: {
        include: {
          transactions: {
            where: { isVerified: true },
            include: {
              donor: { select: { name: true } },
            },
            orderBy: [
              { transactionDate: "asc" },
              { id: "asc" },
            ],
          },
        },
      },
    },
  });

  const allTransactions: {
    id: string;
    date: Date | null;
    type: string;
    amount: number;
    description: string;
    donor: string;
  }[] = [];

  let initialBalance = 0;
  if (reports.length > 0 && reports[0].initialBalance !== null) {
    initialBalance = parseFloat(reports[0].initialBalance.toString());
  }

  for (const rep of reports) {
    for (const att of rep.attachments) {
      for (const tx of att.transactions) {
        allTransactions.push({
          id: tx.id,
          date: tx.transactionDate || rep.reportDate,
          type: tx.type,
          amount: parseFloat(tx.amount.toString()),
          description: tx.description || "-",
          donor: tx.donor?.name || tx.donorNameRaw || (tx.type === "pemasukan" ? "Infaq Anonim / Kotak Amal" : "-"),
        });
      }
    }
  }

  const totalMasuk = allTransactions
    .filter((t) => t.type === "pemasukan")
    .reduce((s, t) => s + t.amount, 0);

  const totalKeluar = allTransactions
    .filter((t) => t.type === "pengeluaran")
    .reduce((s, t) => s + t.amount, 0);

  const finalBalance = initialBalance + totalMasuk - totalKeluar;

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  let runningBalance = initialBalance;

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white text-neutral-900 font-sans">
      <PrintActionBar
        backUrl="/dashboard"
        pdfDownloadUrl={`/api/reports/export/monthly/pdf?year=${year}&month=${month}`}
        excelDownloadUrl={`/api/reports/export/monthly/excel?year=${year}&month=${month}`}
        title={`Kas Bulanan (${periodTitle})`}
      />

      <main className="mx-auto my-6 print:my-0 max-w-[850px] print:max-w-none print:w-full bg-white p-8 sm:p-12 print:p-0 shadow-lg print:shadow-none border print:border-none border-neutral-200">
        {/* KOP SURAT */}
        <header className="border-b-4 border-double border-neutral-900 pb-3 print:pb-2 text-center">
          <div className="flex items-center justify-center gap-3">
            <svg
              className="h-10 w-10 print:h-8 print:w-8 text-emerald-800"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15 8 21 9 17 14 18 20 12 17 6 20 7 14 3 9 9 8 12 2" />
            </svg>
            <div>
              <h1 className="text-xl sm:text-2xl print:text-base font-black uppercase tracking-wider text-neutral-900">
                Dewan Kemakmuran Masjid (DKM) Al-Luqman
              </h1>
              <p className="text-xs sm:text-sm print:text-[11px] font-medium text-neutral-700">
                Jl. Mayjen Sutoyo, Kelurahan Soklat, Kecamatan Subang, Kabupaten Subang - Jawa Barat
              </p>
            </div>
          </div>
        </header>

        {/* JUDUL */}
        <section className="my-6 print:my-2 text-center">
          <h2 className="text-base sm:text-lg print:text-sm font-bold uppercase underline decoration-2 underline-offset-4 tracking-wide text-neutral-900">
            Rekapitulasi Pembukuan Kas Bulanan
          </h2>
          <p className="text-xs sm:text-sm print:text-xs text-neutral-600 mt-1 print:mt-0.5">
            Periode: <strong className="text-neutral-900">{periodTitle}</strong> ({reports.length} Laporan Pekanan Terdata)
          </p>
        </section>

        {/* KARTU RINGKASAN */}
        <section className="mb-6 print:mb-2.5 grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-2 text-xs">
          <div className="border border-neutral-300 p-2.5 print:p-1.5 rounded bg-neutral-50 print:bg-neutral-50/50">
            <span className="text-neutral-600 block text-[11px] print:text-[10px]">Saldo Awal Bulan:</span>
            <span className="font-bold text-neutral-900 text-sm print:text-xs tabular-nums">
              {fmt(initialBalance)}
            </span>
          </div>
          <div className="border border-neutral-300 p-2.5 print:p-1.5 rounded bg-neutral-50 print:bg-neutral-50/50">
            <span className="text-neutral-600 block text-[11px] print:text-[10px]">Total Pemasukan:</span>
            <span className="font-bold text-emerald-700 text-sm print:text-xs tabular-nums">
              + {fmt(totalMasuk)}
            </span>
          </div>
          <div className="border border-neutral-300 p-2.5 print:p-1.5 rounded bg-neutral-50 print:bg-neutral-50/50">
            <span className="text-neutral-600 block text-[11px] print:text-[10px]">Total Pengeluaran:</span>
            <span className="font-bold text-rose-700 text-sm print:text-xs tabular-nums">
              - {fmt(totalKeluar)}
            </span>
          </div>
          <div className="border border-neutral-900 p-2.5 print:p-1.5 rounded bg-neutral-100 print:bg-neutral-100/50">
            <span className="text-neutral-700 font-semibold block text-[11px] print:text-[10px]">Saldo Akhir Bulan:</span>
            <span className="font-extrabold text-neutral-900 text-sm print:text-xs tabular-nums">
              {fmt(finalBalance)}
            </span>
          </div>
        </section>

        {/* TABEL MUTASI TRANSAKSI */}
        <section className="mb-6 print:mb-2">
          <table className="w-full border-collapse border border-neutral-400 text-xs print:text-[10px]">
            <thead className="print:[&>tr]:break-inside-avoid">
              <tr className="bg-neutral-100 print:bg-neutral-200 text-neutral-900 font-bold border-b border-neutral-400">
                <th className="border border-neutral-400 p-2 print:py-1 print:px-1 text-center w-10 print:w-8">No</th>
                <th className="border border-neutral-400 p-2 print:py-1 print:px-1.5 text-left w-24 print:w-20">Tanggal</th>
                <th className="border border-neutral-400 p-2 print:py-1 print:px-1.5 text-left">Uraian / Keterangan</th>
                <th className="border border-neutral-400 p-2 print:py-1 print:px-1.5 text-left w-36 print:w-32">Sumber / Donatur</th>
                <th className="border border-neutral-400 p-2 print:py-1 print:px-1.5 text-right w-28 print:w-24">Pemasukan</th>
                <th className="border border-neutral-400 p-2 print:py-1 print:px-1.5 text-right w-28 print:w-24">Pengeluaran</th>
                <th className="border border-neutral-400 p-2 print:py-1 print:px-1.5 text-right w-28 print:w-24">Saldo Kas</th>
              </tr>
            </thead>
            <tbody>
              {/* Saldo Awal */}
              <tr className="border-b border-neutral-300 bg-neutral-50/50 italic print:break-inside-avoid">
                <td className="border border-neutral-300 p-2 print:py-1 print:px-1 text-center text-neutral-500">-</td>
                <td className="border border-neutral-300 p-2 print:py-1 print:px-1.5 text-neutral-500">-</td>
                <td className="border border-neutral-300 p-2 print:py-1 print:px-1.5 font-medium" colSpan={2}>
                  Saldo Awal per 1 {periodTitle}
                </td>
                <td className="border border-neutral-300 p-2 print:py-1 print:px-1.5 text-right text-neutral-400">-</td>
                <td className="border border-neutral-300 p-2 print:py-1 print:px-1.5 text-right text-neutral-400">-</td>
                <td className="border border-neutral-300 p-2 print:py-1 print:px-1.5 text-right font-semibold tabular-nums">
                  {fmt(runningBalance)}
                </td>
              </tr>

              {allTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-neutral-300 p-4 text-center text-neutral-500">
                    Tidak ada mutasi transaksi kas terverifikasi pada bulan ini.
                  </td>
                </tr>
              ) : (
                allTransactions.map((tx, idx) => {
                  const isIncome = tx.type === "pemasukan";
                  if (isIncome) {
                    runningBalance += tx.amount;
                  } else {
                    runningBalance -= tx.amount;
                  }

                  const txDateFormatted = tx.date
                    ? new Date(tx.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "-";

                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-neutral-300 hover:bg-neutral-50 print:hover:bg-transparent print:break-inside-avoid"
                    >
                      <td className="border border-neutral-300 p-2 print:py-1 print:px-1 text-center tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="border border-neutral-300 p-2 print:py-1 print:px-1.5 text-neutral-700 whitespace-nowrap">
                        {txDateFormatted}
                      </td>
                      <td className="border border-neutral-300 p-2 print:py-1 print:px-1.5 font-medium text-neutral-900">
                        {tx.description}
                      </td>
                      <td className="border border-neutral-300 p-2 print:py-1 print:px-1.5 text-neutral-700">
                        {tx.donor}
                      </td>
                      <td className="border border-neutral-300 p-2 print:py-1 print:px-1.5 text-right tabular-nums font-semibold text-emerald-700">
                        {isIncome ? fmt(tx.amount) : "-"}
                      </td>
                      <td className="border border-neutral-300 p-2 print:py-1 print:px-1.5 text-right tabular-nums font-semibold text-rose-700">
                        {!isIncome ? fmt(tx.amount) : "-"}
                      </td>
                      <td className="border border-neutral-300 p-2 print:py-1 print:px-1.5 text-right tabular-nums font-semibold text-neutral-900">
                        {fmt(runningBalance)}
                      </td>
                    </tr>
                  );
                })
              )}
              <tr className="bg-neutral-100 print:bg-neutral-200 font-bold border-t-2 border-neutral-400 print:break-inside-avoid">
                <td colSpan={4} className="border border-neutral-400 p-2 print:py-1 print:px-1.5 text-center uppercase tracking-wider">
                  Total Mutasi Bulan Ini
                </td>
                <td className="border border-neutral-400 p-2 print:py-1 print:px-1.5 text-right tabular-nums text-emerald-800">
                  {fmt(totalMasuk)}
                </td>
                <td className="border border-neutral-400 p-2 print:py-1 print:px-1.5 text-right tabular-nums text-rose-800">
                  {fmt(totalKeluar)}
                </td>
                <td className="border border-neutral-400 p-2 print:py-1 print:px-1.5 text-right tabular-nums text-neutral-900 font-black">
                  {fmt(finalBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* PENGESAHAN */}
        <section className="pt-3 print:pt-1 text-xs print:text-[10.5px] print:break-inside-avoid">
          <div className="flex justify-end mb-1.5 print:mb-0.5">
            <p className="text-neutral-700">Subang, Akhir {periodTitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-center pt-1 print:pt-0.5">
            <div>
              <p className="font-semibold text-neutral-700">Mengetahui,</p>
              <p className="font-bold text-neutral-900">Ketua DKM Al-Luqman</p>
              <div className="h-20 sm:h-24 print:h-12" />
              <p className="font-bold underline text-neutral-900">
                ( .................................................... )
              </p>
            </div>
            <div>
              <p className="font-semibold text-neutral-700">Petugas Pembukuan,</p>
              <p className="font-bold text-neutral-900">Bendahara DKM</p>
              <div className="h-20 sm:h-24 print:h-12" />
              <p className="font-bold underline text-neutral-900">
                ( .................................................... )
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
