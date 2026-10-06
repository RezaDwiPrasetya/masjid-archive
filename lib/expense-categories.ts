/**
 * Konstanta kategori pengeluaran kas masjid (V7 — F-023)
 *
 * Set kategori bersifat tetap (enum di aplikasi, bukan tabel database).
 * Nilai null = "Tidak Dikategorikan" — transaksi lama tanpa kategori tetap valid.
 */

export const EXPENSE_CATEGORIES = [
  { value: "operasional", label: "Operasional" },
  { value: "honor", label: "Honor" },
  { value: "sosial", label: "Sosial" },
  { value: "pembangunan", label: "Pembangunan" },
  { value: "konsumsi", label: "Konsumsi" },
  { value: "administrasi", label: "Administrasi" },
  { value: "lainnya", label: "Lainnya" },
] as const;

export type ExpenseCategoryValue =
  | (typeof EXPENSE_CATEGORIES)[number]["value"]
  | null;

/**
 * Mengembalikan label tampilan untuk nilai kategori.
 * Nilai null dikembalikan sebagai "Tidak Dikategorikan".
 */
export function getCategoryLabel(value: string | null): string {
  if (!value) return "Tidak Dikategorikan";
  return (
    EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ??
    "Tidak Dikategorikan"
  );
}

/**
 * Warna badge per kategori (untuk konsistensi visual di seluruh app).
 */
export const CATEGORY_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  operasional: {
    bg: "bg-blue-500/10",
    border: "border-blue-300",
    text: "text-blue-800",
  },
  honor: {
    bg: "bg-violet-500/10",
    border: "border-violet-300",
    text: "text-violet-800",
  },
  sosial: {
    bg: "bg-rose-500/10",
    border: "border-rose-300",
    text: "text-rose-800",
  },
  pembangunan: {
    bg: "bg-amber-500/10",
    border: "border-amber-300",
    text: "text-amber-800",
  },
  konsumsi: {
    bg: "bg-orange-500/10",
    border: "border-orange-300",
    text: "text-orange-800",
  },
  administrasi: {
    bg: "bg-slate-500/10",
    border: "border-slate-300",
    text: "text-slate-700",
  },
  lainnya: {
    bg: "bg-stone-500/10",
    border: "border-stone-300",
    text: "text-stone-700",
  },
};

export function getCategoryColor(
  value: string | null
): { bg: string; border: string; text: string } {
  if (!value) {
    return {
      bg: "bg-surface-container-high",
      border: "border-outline-variant",
      text: "text-on-surface-variant",
    };
  }
  return (
    CATEGORY_COLORS[value] ?? {
      bg: "bg-surface-container-high",
      border: "border-outline-variant",
      text: "text-on-surface-variant",
    }
  );
}
