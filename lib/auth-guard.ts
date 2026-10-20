import { Session } from "next-auth";

/**
 * Memeriksa apakah sesi pengguna memiliki peran Administrator (ADMIN).
 * Administrator memiliki wewenang tertinggi: manajemen pengguna, hapus laporan, dan seluruh hak staf.
 */
export function isAdmin(session: Session | null | undefined): boolean {
  const role = session?.user?.role?.trim().toUpperCase();
  return role === "ADMIN";
}

/**
 * Memeriksa apakah sesi pengguna adalah staf operasional DKM (ADMIN atau BENDAHARA).
 * Staf memiliki hak untuk mengunggah berkas, mengekstrak via AI, mengonfirmasi/membatalkan
 * verifikasi transaksi kas, dan mengubah kategori pengeluaran.
 *
 * Pengguna dengan role null (Jamaah / Guest) akan menghasilkan false.
 */
export function isStaff(session: Session | null | undefined): boolean {
  const role = session?.user?.role?.trim().toUpperCase();
  return role === "ADMIN" || role === "BENDAHARA";
}

/**
 * Memeriksa apakah pengguna memiliki hak akses untuk menghapus laporan kas:
 * 1. Administrator (ADMIN) memiliki wewenang penuh untuk menghapus laporan apapun (termasuk yang sudah diverifikasi).
 * 2. Staf operasional DKM (BENDAHARA) dapat menghapus laporan HANYA JIKA laporan masih berstatus draf / kosong
 *    (belum memiliki transaksi yang diverifikasi / sah masuk kas).
 */
export function canDeleteReport({
  session,
  reportUploadedById,
  verifiedTransactionsCount,
}: {
  session: Session | null | undefined;
  reportUploadedById?: string | null;
  verifiedTransactionsCount: number;
}): boolean {
  if (isAdmin(session)) return true;
  if (!isStaff(session)) return false;

  const isDraft = verifiedTransactionsCount === 0;

  return isDraft;
}


