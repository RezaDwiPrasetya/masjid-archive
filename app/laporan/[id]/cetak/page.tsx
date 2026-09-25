import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintActionBar } from "@/components/print-action-bar";

export const dynamic = "force-dynamic";

interface CetakPageProps {
  params: Promise<{ id: string }>;
}

export default async function CetakLaporanMingguanPage({ params }: CetakPageProps) {
  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      uploadedBy: {
        select: { name: true },
      },
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

  if (!report) {
    notFound();
  }

  const transactions = report.attachments.flatMap((a) =>
    a.transactions.map((tx) => ({
      id: tx.id,
      date: tx.transactionDate,
      type: tx.type,
      amount: parseFloat(tx.amount.toString()),
      description: tx.description || "-",
      donor: tx.donor?.name || tx.donorNameRaw || (tx.type === "pemasukan" ? "Infaq Anonim / Kotak Amal" : "-"),
    }))
  );

  const initialBalance = report.initialBalance
    ? parseFloat(report.initialBalance.toString())
    : 0;

  const totalMasuk = transactions
    .filter((t) => t.type === "pemasukan")
    .reduce((s, t) => s + t.amount, 0);

  const totalKeluar = transactions
    .filter((t) => t.type === "pengeluaran")
    .reduce((s, t) => s + t.amount, 0);

  const finalBalance =
    report.finalBalance !== null
      ? parseFloat(report.finalBalance.toString())
      : initialBalance + totalMasuk - totalKeluar;

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  const reportDateFormatted = new Date(report.reportDate).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let runningBalance = initialBalance;

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white text-neutral-900 font-sans">
      <PrintActionBar
        backUrl={`/laporan/${report.id}`}
        excelDownloadUrl={`/api/reports/${report.id}/export/excel`}
        title={`Kas Mingguan (${reportDateFormatted})`}
      />

      {/* Kontainer Lembar Cetak A4 */}
      <main className="mx-auto my-6 print:my-0 max-w-[850px] bg-white p-8 sm:p-12 print:p-0 shadow-lg print:shadow-none border print:border-none border-neutral-200">
        {/* KOP SURAT RESMI DKM */}
        <header className="border-b-4 border-double border-neutral-900 pb-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <svg
              className="h-10 w-10 text-emerald-800 print:text-neutral-900"
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
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-neutral-900">
                Dewan Kemakmuran Masjid (DKM) Al-Luqman
              </h1>
              <p className="text-xs sm:text-sm font-medium text-neutral-700">
                Jl. Mayjen Sutoyo, Kelurahan Soklat, Kecamatan Subang, Kabupaten Subang - Jawa Barat
              </p>
            </div>
          </div>
        </header>

        {/* JUDUL LAPORAN */}
        <section className="my-6 text-center">
          <h2 className="text-base sm:text-lg font-bold uppercase underline decoration-2 underline-offset-4 tracking-wide text-neutral-900">
            Rekapitulasi Pembukuan Kas Mingguan
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Hari, Tanggal: <strong className="text-neutral-900">{reportDateFormatted}</strong>
          </p>
        </section>

        {/* KARTU RINGKASAN SALDO */}
        <section className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="border border-neutral-300 p-2.5 rounded bg-neutral-50 print:bg-white">
            <span className="text-neutral-600 block text-[11px]">Saldo Awal Kas:</span>
            <span className="font-bold text-neutral-900 text-sm tabular-nums">
              {fmt(initialBalance)}
            </span>
          </div>
          <div className="border border-neutral-300 p-2.5 rounded bg-neutral-50 print:bg-white">
            <span className="text-neutral-600 block text-[11px]">Total Pemasukan:</span>
            <span className="font-bold text-emerald-700 print:text-neutral-900 text-sm tabular-nums">
              + {fmt(totalMasuk)}
            </span>
          </div>
          <div className="border border-neutral-300 p-2.5 rounded bg-neutral-50 print:bg-white">
            <span className="text-neutral-600 block text-[11px]">Total Pengeluaran:</span>
            <span className="font-bold text-rose-700 print:text-neutral-900 text-sm tabular-nums">
              - {fmt(totalKeluar)}
            </span>
          </div>
          <div className="border border-neutral-900 p-2.5 rounded bg-neutral-100 print:bg-white">
            <span className="text-neutral-700 font-semibold block text-[11px]">Saldo Kas Akhir:</span>
            <span className="font-extrabold text-neutral-900 text-sm tabular-nums">
              {fmt(finalBalance)}
            </span>
          </div>
        </section>

        {/* TABEL MUTASI TRANSAKSI */}
        <section className="mb-8">
          <table className="w-full border-collapse border border-neutral-400 text-xs">
            <thead>
              <tr className="bg-neutral-100 print:bg-neutral-200 text-neutral-900 font-bold border-b border-neutral-400">
                <th className="border border-neutral-400 p-2 text-center w-10">No</th>
                <th className="border border-neutral-400 p-2 text-left w-24">Tanggal</th>
                <th className="border border-neutral-400 p-2 text-left">Uraian / Keterangan</th>
                <th className="border border-neutral-400 p-2 text-left w-36">Sumber / Donatur</th>
                <th className="border border-neutral-400 p-2 text-right w-28">Pemasukan</th>
                <th className="border border-neutral-400 p-2 text-right w-28">Pengeluaran</th>
                <th className="border border-neutral-400 p-2 text-right w-28">Saldo Kas</th>
              </tr>
            </thead>
            <tbody>
              {/* Baris Saldo Awal */}
              <tr className="border-b border-neutral-300 bg-neutral-50/50 print:bg-white italic">
                <td className="border border-neutral-300 p-2 text-center text-neutral-500">-</td>
                <td className="border border-neutral-300 p-2 text-neutral-500">-</td>
                <td className="border border-neutral-300 p-2 font-medium" colSpan={2}>
                  Saldo Kas Awal Periode
                </td>
                <td className="border border-neutral-300 p-2 text-right text-neutral-400">-</td>
                <td className="border border-neutral-300 p-2 text-right text-neutral-400">-</td>
                <td className="border border-neutral-300 p-2 text-right font-semibold tabular-nums">
                  {fmt(runningBalance)}
                </td>
              </tr>

              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-neutral-300 p-4 text-center text-neutral-500">
                    Tidak ada mutasi transaksi terverifikasi pada periode ini.
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => {
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
                      className="border-b border-neutral-300 hover:bg-neutral-50 print:hover:bg-white"
                    >
                      <td className="border border-neutral-300 p-2 text-center tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="border border-neutral-300 p-2 text-neutral-700 whitespace-nowrap">
                        {txDateFormatted}
                      </td>
                      <td className="border border-neutral-300 p-2 font-medium text-neutral-900">
                        {tx.description}
                      </td>
                      <td className="border border-neutral-300 p-2 text-neutral-700">
                        {tx.donor}
                      </td>
                      <td className="border border-neutral-300 p-2 text-right tabular-nums font-semibold text-emerald-800 print:text-neutral-900">
                        {isIncome ? fmt(tx.amount) : "-"}
                      </td>
                      <td className="border border-neutral-300 p-2 text-right tabular-nums font-semibold text-rose-800 print:text-neutral-900">
                        {!isIncome ? fmt(tx.amount) : "-"}
                      </td>
                      <td className="border border-neutral-300 p-2 text-right tabular-nums font-semibold text-neutral-900">
                        {fmt(runningBalance)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-100 print:bg-neutral-200 font-bold border-t-2 border-neutral-400">
                <td colSpan={4} className="border border-neutral-400 p-2 text-center uppercase tracking-wider">
                  Total
                </td>
                <td className="border border-neutral-400 p-2 text-right tabular-nums text-emerald-900 print:text-neutral-900">
                  {fmt(totalMasuk)}
                </td>
                <td className="border border-neutral-400 p-2 text-right tabular-nums text-rose-900 print:text-neutral-900">
                  {fmt(totalKeluar)}
                </td>
                <td className="border border-neutral-400 p-2 text-right tabular-nums text-neutral-900 font-black">
                  {fmt(finalBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* LEMBAR PENGESAHAN TANDA TANGAN */}
        <section className="pt-4 text-xs">
          <div className="flex justify-end mb-2">
            <p className="text-neutral-700">Subang, {reportDateFormatted}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-center pt-2">
            <div>
              <p className="font-semibold text-neutral-700">Mengetahui,</p>
              <p className="font-bold text-neutral-900">Ketua DKM Al-Luqman</p>
              <div className="h-20 sm:h-24" />
              <p className="font-bold underline text-neutral-900">
                ( .................................................... )
              </p>
            </div>
            <div>
              <p className="font-semibold text-neutral-700">Petugas Pembukuan,</p>
              <p className="font-bold text-neutral-900">Bendahara DKM</p>
              <div className="h-20 sm:h-24" />
              <p className="font-bold underline text-neutral-900">
                ( {report.uploadedBy?.name || "Pengurus DKM"} )
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
