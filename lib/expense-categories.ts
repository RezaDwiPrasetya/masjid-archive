/**
 * Konstanta kategori pengeluaran kas masjid (V7 — F-023 & V18 — F-043)
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

/**
 * Kamus kata kunci untuk auto-kategorisasi pengeluaran kas masjid (F-043).
 * Dikelompokkan per kategori pengeluaran baku untuk pencocokan cepat dan akurat.
 */
export const CATEGORY_KEYWORDS: Record<Exclude<ExpenseCategoryValue, null>, string[]> = {
  konsumsi: [
    "konsumsi", "makan", "nasi box", "nasi kotak", "snack", "kue", "air minum",
    "aqua", "air mineral", "galon", "teh", "kopi", "gula", "sarapan", "makan siang",
    "buka puasa", "takjil", "sahur", "gorengan", "buah", "catering"
  ],
  honor: [
    "honor", "khotib", "khatib", "penceramah", "khutbah", "imam", "muadzin",
    "bilal", "ustadz", "ustadzah", "kiai", "kyai", "kultum", "ceramah",
    "guru ngaji", "tpa", "pembicara", "insentif", "bisyarah"
  ],
  administrasi: [
    "kertas", "hvs", "fotokopi", "foto copy", "cetak", "print", "spidol", "whiteboard",
    "map", "amplop", "stempel", "tinta", "kwitansi", "nota", "binder", "atk",
    "buku kas", "buku agenda", "pulpen", "surat", "legalisir", "materai"
  ],
  sosial: [
    "santunan", "anak yatim", "yatim piatu", "dhuafa", "fakir", "takziah",
    "uang duka", "bantuan", "sembako", "beras", "warga sakit", "kematian",
    "bencana", "kaum dhuafa", "sedekah sosial", "peduli"
  ],
  operasional: [
    "listrik", "pln", "token", "pdam", "air pam", "wifi", "indihome", "internet",
    "kebersihan", "sapu", "alat pel", "sabun", "pembersih", "wpc", "soklin", "karbol",
    "marbot", "penjaga masjid",
    "genset", "solar", "bensin", "oli genset", "lampu", "bohlam", "led", "philips",
    "sampah", "retribusi sampah", "sedot wc", "taman", "rumput", "mesin rumput",
    "operasional"
  ],
  pembangunan: [
    "semen", "pasir", "cat", "keramik", "renovasi", "perbaikan ac", "servis ac", "service ac",
    "cuci ac", "tukang", "ongkos tukang", "batu", "bata", "besi", "pipa", "paralon",
    "talang", "genteng", "kusen", "pintu", "jendela", "kubah", "menara",
    "sound system", "mic", "microphone", "speaker", "kabel", "instalasi",
    "rehab", "pembangunan", "material", "toko bangunan", "baut", "mur", "lem"
  ],
  lainnya: [
    "administrasi bank", "pajak", "biaya transfer", "bunga bank", "tak terduga", "lain-lain"
  ],
};

/**
 * Merekomendasikan kategori pengeluaran kas masjid secara cerdas berdasarkan deskripsi transaksi (F-043).
 * Menggunakan normalisasi teks dan pencocokan kata batas kata (word boundary) untuk mencegah false positive.
 */
export function suggestExpenseCategory(description: string | null | undefined): ExpenseCategoryValue | null {
  if (!description || typeof description !== "string") return null;

  const clean = description
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return null;

  // Cek kata kunci per kategori sesuai urutan prioritas spesifik
  const priorityOrder: Exclude<ExpenseCategoryValue, null>[] = [
    "konsumsi",
    "honor",
    "administrasi",
    "sosial",
    "operasional",
    "pembangunan",
    "lainnya",
  ];

  for (const cat of priorityOrder) {
    const keywords = CATEGORY_KEYWORDS[cat];
    for (const kw of keywords) {
      // Gunakan regex batas kata (word boundary) agar tidak match substring keliru (mis. 'cat' tidak match 'catatan')
      const escapedKw = kw.replace(/\s+/g, "\\s+");
      const pattern = new RegExp(`(^|\\s)${escapedKw}($|\\s)`, "i");
      if (pattern.test(clean)) {
        return cat;
      }
    }
  }

  return null;
}
