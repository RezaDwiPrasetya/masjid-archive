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
