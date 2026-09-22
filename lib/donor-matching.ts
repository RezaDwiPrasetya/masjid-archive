/**
 * Modul Fuzzy Matching & Normalisasi Donatur (V5)
 * Sesuai spesifikasi teknis di docs/12-Technical-Specification.md & docs/13-Data-Model.md
 */

/**
 * Daftar prefix gelar umum yang dihapus saat normalisasi nama donatur.
 * Gelar ini umum dipakai di buku kas masjid.
 */
export const DONOR_PREFIXES = [
  "bpk",
  "bapak",
  "ibu",
  "sdr",
  "sdri",
  "mas",
  "mbak",
  "h.",
  "hj.",
  "ust",
  "ustadz",
  "ustadzah",
] as const;

/**
 * Daftar pola nama donatur anonim.
 * Donasi yang cocok dengan pola ini TIDAK dibuatkan entitas Donor,
 * melainkan donorId tetap null dan dihitung sebagai agregat Infaq Anonim.
 *
 * Catatan ejaan: Varian "hamba alloh" dimasukkan secara eksplisit
 * karena di catatan buku kas fisik riil sering tertulis dengan ejaan "Alloh".
 */
export const ANONYMOUS_PATTERNS = [
  "hamba allah",
  "hamba alloh",
  "anonim",
  "tanpa nama",
] as const;

// Siapkan basis prefix tanpa tanda titik di akhir, diurutkan dari yang terpanjang
// agar pencocokan awalan lebih spesifik (misal: "ustadzah" sebelum "ustadz" sebelum "ust")
const PREFIX_BASES = Array.from(
  new Set(DONOR_PREFIXES.map((p) => p.replace(/\.$/, "").toLowerCase()))
).sort((a, b) => b.length - a.length);

/**
 * Meng-escape karakter metacharacter regex agar aman saat dimasukkan ke new RegExp()
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Membersihkan dan menormalisasi nama donatur:
 * 1. Trim spasi depan/belakang
 * 2. Lowercase
 * 3. Rapikan multiple whitespace menjadi satu spasi
 * 4. Hapus prefix gelar di awal teks secara berulang (misal "Bpk. H. Kosasih" -> "kosasih")
 */
export function normalizeDonorName(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") {
    return "";
  }

  let normalized = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) {
    return "";
  }

  // Hapus prefix gelar di awal string secara berantai
  let stripped = true;
  while (stripped) {
    stripped = false;
    for (const base of PREFIX_BASES) {
      // Pola: diawali base prefix (escaped), diikuti tanda titik opsional, lalu minimal satu spasi
      const pattern = new RegExp(`^${escapeRegex(base)}\\.?\\s+`, "i");
      if (pattern.test(normalized)) {
        normalized = normalized.replace(pattern, "").trim();
        stripped = true;
        break; // Ulangi dari prefix terpanjang lagi
      }
    }
  }

  return normalized.trim();
}

/**
 * Mengecek apakah nama ternormalisasi tergolong donatur anonim
 * ("hamba allah", "hamba alloh", "anonim", "tanpa nama").
 */
export function isAnonymousDonor(normalized: string | null | undefined): boolean {
  if (!normalized || typeof normalized !== "string") {
    return false;
  }

  const clean = normalized.trim().toLowerCase();
  if (!clean) {
    return false;
  }

  return ANONYMOUS_PATTERNS.some((pattern) => clean.includes(pattern));
}
