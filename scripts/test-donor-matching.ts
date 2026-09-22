import assert from "node:assert";
import {
  normalizeDonorName,
  isAnonymousDonor,
} from "../lib/donor-matching";

console.log("=== Menjalankan Test Case Donor Matching (Issue #049) ===\n");

// 1. Uji Normalisasi Prefix Gelar Dasar & Konsistensi
console.log("[Test 1] Kasus Bapak Kosasih vs Bpk Kosasih:");
const n1 = normalizeDonorName("Bapak Kosasih");
const n2 = normalizeDonorName("Bpk Kosasih");
const n3 = normalizeDonorName("Bpk. Kosasih");
console.log(`  'Bapak Kosasih' -> '${n1}'`);
console.log(`  'Bpk Kosasih'   -> '${n2}'`);
console.log(`  'Bpk. Kosasih'  -> '${n3}'`);
assert.strictEqual(n1, "kosasih");
assert.strictEqual(n2, "kosasih");
assert.strictEqual(n3, "kosasih");
assert.strictEqual(n1, n2, "Bapak Kosasih dan Bpk Kosasih harus identik");
console.log("  => LULUS: Hasil normalisasi sama persis ('kosasih')\n");

// 2. Uji Prefix Lain & Multi-prefix
console.log("[Test 2] Uji Prefix Lengkap & Multi-prefix:");
const multi1 = normalizeDonorName("Bpk. H. Kosasih");
const multi2 = normalizeDonorName("Bapak H. Kosasih");
assert.strictEqual(multi1, multi2);
const h1 = normalizeDonorName("H. Kosasih");
const h2 = normalizeDonorName("H Kosasih");
const hj1 = normalizeDonorName("Hj. Siti");
const hj2 = normalizeDonorName("Hj Siti");
const ust1 = normalizeDonorName("Ust. Ahmad");
const ust2 = normalizeDonorName("Ustadz Ahmad");
const ust3 = normalizeDonorName("Ustadzah Fatimah");
const mas = normalizeDonorName("Mas Joko");
const mbak = normalizeDonorName("Mbak Rina");
const sdr = normalizeDonorName("Sdr. Budi");
const sdri = normalizeDonorName("Sdri. Ani");
const ibu = normalizeDonorName("Ibu Siti");

console.log(`  'Bpk. H. Kosasih'   -> '${multi1}'`);
console.log(`  'H. Kosasih'        -> '${h1}'`);
console.log(`  'H Kosasih'         -> '${h2}'`);
console.log(`  'Hj. Siti'          -> '${hj1}'`);
console.log(`  'Ust. Ahmad'        -> '${ust1}'`);
console.log(`  'Ustadz Ahmad'      -> '${ust2}'`);
console.log(`  'Ustadzah Fatimah'  -> '${ust3}'`);

assert.strictEqual(multi1, "kosasih");
assert.strictEqual(h1, "kosasih");
assert.strictEqual(h2, "kosasih");
assert.strictEqual(hj1, "siti");
assert.strictEqual(hj2, "siti");
assert.strictEqual(ust1, "ahmad");
assert.strictEqual(ust2, "ahmad");
assert.strictEqual(ust3, "fatimah");
assert.strictEqual(mas, "joko");
assert.strictEqual(mbak, "rina");
assert.strictEqual(sdr, "budi");
assert.strictEqual(sdri, "ani");
assert.strictEqual(ibu, "siti");
console.log("  => LULUS: Seluruh daftar prefix berhasil dinormalisasi\n");

// 2b. Uji Nama yang diawali karakter mirip prefix tapi BUKAN prefix (misal 'Hasan Basri' vs 'H. Hasan')
console.log("[Test 2b] Uji Nama diawali huruf 'H' tapi BUKAN prefix 'H.' (Hasan Basri):");
const hasan1 = normalizeDonorName("Hasan Basri");
const hasan2 = normalizeDonorName("H. Hasan Basri");
const hasan3 = normalizeDonorName("H Hasan Basri");
console.log(`  'Hasan Basri'    -> '${hasan1}'`);
console.log(`  'H. Hasan Basri' -> '${hasan2}'`);
console.log(`  'H Hasan Basri'  -> '${hasan3}'`);
assert.strictEqual(
  hasan1,
  "hasan basri",
  "'Hasan Basri' TIDAK boleh terpotong menjadi 'asan basri'"
);
assert.strictEqual(
  hasan2,
  "hasan basri",
  "'H. Hasan Basri' harus terpotong prefix 'H.'-nya menjadi 'hasan basri'"
);
assert.strictEqual(
  hasan3,
  "hasan basri",
  "'H Hasan Basri' harus terpotong prefix 'H'-nya menjadi 'hasan basri'"
);
console.log("  => LULUS: 'Hasan Basri' tetap 'hasan basri', tidak terpotong menjadi 'asan basri'\n");

// 3. Uji Pola Anonim (Termasuk variasi ejaan Alloh / Allah)
console.log("[Test 3] Uji Pola Donatur Anonim (Allah vs Alloh):");
const anonCases = [
  "Hamba Allah",
  "hamba allah",
  "HAMBA ALLOH",
  "hamba alloh",
  "Hamba Alloh",
  "INFAK HAMBA ALLOH",
  "Anonim",
  "anonim",
  "Tanpa Nama",
  "tanpa nama",
];

for (const raw of anonCases) {
  const norm = normalizeDonorName(raw);
  const isAnon = isAnonymousDonor(norm);
  console.log(`  '${raw}' -> norm: '${norm}', isAnon: ${isAnon}`);
  assert.strictEqual(
    isAnon,
    true,
    `'${raw}' seharusnya terdeteksi sebagai donatur anonim`
  );
}

// Donatur nyata tidak boleh terdeteksi anonim
const nonAnonCases = ["Bapak Kosasih", "Ahmad Fauzi", "Siti Aminah"];
for (const raw of nonAnonCases) {
  const norm = normalizeDonorName(raw);
  const isAnon = isAnonymousDonor(norm);
  assert.strictEqual(
    isAnon,
    false,
    `'${raw}' tidak boleh terdeteksi sebagai donatur anonim`
  );
}
console.log("  => LULUS: Varian 'Alloh' dan 'Allah' keduanya sukses dikenali sebagai anonim\n");

// 4. Uji Nilai Kosong, Null, Undefined, Whitespace
console.log("[Test 4] Uji Input Kosong/Null/Undefined/Whitespace:");
assert.strictEqual(normalizeDonorName(null), "");
assert.strictEqual(normalizeDonorName(undefined), "");
assert.strictEqual(normalizeDonorName(""), "");
assert.strictEqual(normalizeDonorName("   "), "");
assert.strictEqual(isAnonymousDonor(null), false);
assert.strictEqual(isAnonymousDonor(undefined), false);
assert.strictEqual(isAnonymousDonor(""), false);
assert.strictEqual(isAnonymousDonor("   "), false);
console.log("  => LULUS: Nilai kosong/null aman tanpa exception/error\n");

console.log("=========================================");
console.log("SEMUA PENGUJIAN DONOR MATCHING BERHASIL! ");
console.log("=========================================");
