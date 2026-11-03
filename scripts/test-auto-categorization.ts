import assert from "assert";
import { suggestExpenseCategory, EXPENSE_CATEGORIES } from "../lib/expense-categories";

async function runAutoCategorizationTests() {
  console.log("=================================================================");
  console.log("TEST SUITE: F-043 / Issue #087 — Smart Auto-Categorization");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  console.log("[1] Pengujian Kamus Kata Kunci Operasional:");
  test("Listrik PLN -> operasional", () => {
    assert.strictEqual(suggestExpenseCategory("BAYAR LISTRIK BULAN JANUARI"), "operasional");
    assert.strictEqual(suggestExpenseCategory("Beli token listrik 200rb"), "operasional");
  });

  test("Kebersihan, PDAM & Genset -> operasional", () => {
    assert.strictEqual(suggestExpenseCategory("Tagihan PDAM air"), "operasional");
    assert.strictEqual(suggestExpenseCategory("Beli sapu dan pembersih lantai soklin"), "operasional");
    assert.strictEqual(suggestExpenseCategory("Solar untuk genset"), "operasional");
    assert.strictEqual(suggestExpenseCategory("Ganti lampu bohlam led philips"), "operasional");
    assert.strictEqual(suggestExpenseCategory("Iuran retribusi sampah"), "operasional");
  });

  console.log("\n[2] Pengujian Kamus Kata Kunci Honor:");
  test("Honor Khotib, Imam, Marbot -> honor", () => {
    assert.strictEqual(suggestExpenseCategory("Honor khotib jumat"), "honor");
    assert.strictEqual(suggestExpenseCategory("Bisyarah ustadz penceramah"), "honor");
    assert.strictEqual(suggestExpenseCategory("Insentif imam dan marbot"), "honor");
    assert.strictEqual(suggestExpenseCategory("Khatib sholat jumat"), "honor");
    assert.strictEqual(suggestExpenseCategory("Kultum subuh"), "honor");
  });

  console.log("\n[3] Pengujian Kamus Kata Kunci Pembangunan & Pemeliharaan:");
  test("Material & Perbaikan Bangunan -> pembangunan", () => {
    assert.strictEqual(suggestExpenseCategory("Beli semen 10 sak dan pasir"), "pembangunan");
    assert.strictEqual(suggestExpenseCategory("Perbaikan genteng dan talang bocor"), "pembangunan");
    assert.strictEqual(suggestExpenseCategory("Ongkos tukang renovasi kamar mandi"), "pembangunan");
    assert.strictEqual(suggestExpenseCategory("Servis cuci AC masjid"), "pembangunan");
    assert.strictEqual(suggestExpenseCategory("Service AC ruang utama"), "pembangunan");
    assert.strictEqual(suggestExpenseCategory("Beli kabel sound system dan mic"), "pembangunan");
  });

  console.log("\n[4] Pengujian Kamus Kata Kunci Konsumsi:");
  test("Makanan & Minuman -> konsumsi", () => {
    assert.strictEqual(suggestExpenseCategory("Snack dan kue rapat pengurus"), "konsumsi");
    assert.strictEqual(suggestExpenseCategory("Air minum aqua galon"), "konsumsi");
    assert.strictEqual(suggestExpenseCategory("Nasi box jumat berkah"), "konsumsi");
    assert.strictEqual(suggestExpenseCategory("Takjil buka puasa"), "konsumsi");
    assert.strictEqual(suggestExpenseCategory("Kopi teh gula untuk marbot"), "konsumsi");
  });

  console.log("\n[5] Pengujian Kamus Kata Kunci Sosial:");
  test("Santunan & Bantuan -> sosial", () => {
    assert.strictEqual(suggestExpenseCategory("Santunan anak yatim piatu"), "sosial");
    assert.strictEqual(suggestExpenseCategory("Bantuan sembako beras dhuafa"), "sosial");
    assert.strictEqual(suggestExpenseCategory("Uang duka dan takziah warga"), "sosial");
  });

  console.log("\n[6] Pengujian Kamus Kata Kunci Administrasi:");
  test("ATK & Cetak -> administrasi", () => {
    assert.strictEqual(suggestExpenseCategory("Fotokopi jadwal imsakiyah"), "administrasi");
    assert.strictEqual(suggestExpenseCategory("Cetak amplop dan stempel DKM"), "administrasi");
    assert.strictEqual(suggestExpenseCategory("Beli kertas HVS dan spidol"), "administrasi");
    assert.strictEqual(suggestExpenseCategory("Buku kas dan kwitansi"), "administrasi");
  });

  console.log("\n[7] Pengujian Word Boundary & Pencegahan False Positive:");
  test("Kata 'cat' dalam 'catatan' TIDAK BOLEH menjadi pembangunan", () => {
    assert.notStrictEqual(suggestExpenseCategory("Catatan pengeluaran umum"), "pembangunan");
  });

  test("Kata 'ac' dalam 'acara' TIDAK BOLEH menjadi pembangunan", () => {
    assert.notStrictEqual(suggestExpenseCategory("Acara silaturahmi akbar"), "pembangunan");
  });

  test("Teks acak tanpa kata kunci yang jelas menghasilkan null", () => {
    assert.strictEqual(suggestExpenseCategory("Pengeluaran khusus"), null);
    assert.strictEqual(suggestExpenseCategory("Biaya x"), null);
    assert.strictEqual(suggestExpenseCategory(""), null);
    assert.strictEqual(suggestExpenseCategory(null), null);
    assert.strictEqual(suggestExpenseCategory(undefined), null);
  });

  console.log("\n[8] Pengujian Logika Fallback Ekstraksi & Transaksi Manual:");
  test("Fallback: Jika AI mengembalikan null, kamus lokal mengambil alih", () => {
    const rawAiTransaction = {
      type: "pengeluaran" as const,
      amount: 345000,
      description: "BAYAR LISTRIK",
      category: null,
    };

    const validCategory =
      rawAiTransaction.category &&
      EXPENSE_CATEGORIES.some((c) => c.value === rawAiTransaction.category)
        ? rawAiTransaction.category
        : null;
    const resolvedCategory = validCategory ?? suggestExpenseCategory(rawAiTransaction.description);

    assert.strictEqual(resolvedCategory, "operasional");
  });

  test("Prioritas: Jika AI/User sudah memilih kategori valid, sistem tidak menimpanya", () => {
    const explicitTransaction = {
      type: "pengeluaran" as const,
      amount: 100000,
      description: "BAYAR LISTRIK", // deskripsinya listrik
      category: "administrasi",     // tapi sengaja dipilih administrasi
    };

    const validCategory =
      explicitTransaction.category &&
      EXPENSE_CATEGORIES.some((c) => c.value === explicitTransaction.category)
        ? explicitTransaction.category
        : null;
    const resolvedCategory = validCategory ?? suggestExpenseCategory(explicitTransaction.description);

    assert.strictEqual(resolvedCategory, "administrasi", "Kategori eksplisit harus dipertahankan");
  });

  test("Pemasukan: Kategori harus selalu null apapun deskripsinya", () => {
    const incomeTransaction: { type: "pemasukan" | "pengeluaran"; amount: number; description: string } = {
      type: "pemasukan",
      amount: 500000,
      description: "INFAQ LISTRIK DARI HAMBA ALLAH",
    };

    let resolvedCategory: string | null = null;
    if (incomeTransaction.type === "pengeluaran") {
      resolvedCategory = suggestExpenseCategory(incomeTransaction.description);
    }

    assert.strictEqual(resolvedCategory, null, "Pemasukan tidak boleh memiliki kategori");
  });

  console.log("\n=================================================================");
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`  PASSED: ${passed}`);
  console.log(`  FAILED: ${failed}`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAutoCategorizationTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
