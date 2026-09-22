import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";
import { GET as getTrend } from "../app/api/dashboard/trend/route";
import { GET as getDonors } from "../app/api/donors/route";
import { GET as getDonorById } from "../app/api/donors/[id]/route";

async function main() {
  console.log("===================================================================");
  console.log("   UJI FUNGSIONAL AKURASI & INTEGRITAS ENDPOINT V5 (Issue #050)");
  console.log("===================================================================\n");

  // 0. Rekam kondisi awal database
  const initialCounts = {
    donors: await prisma.donor.count(),
    transactions: await prisma.transaction.count(),
    reports: await prisma.report.count(),
    users: await prisma.user.count(),
  };
  console.log("[Baseline DB]", initialCounts);

  const FIXTURE_PREFIX = `__FIXTURE_V5_${Date.now()}__`;
  let fixtureUser: { id: string } | null = null;
  let fixtureReport: { id: string } | null = null;
  let fixtureAttachment: { id: string } | null = null;
  let donorA: { id: string } | null = null;
  let donorB: { id: string } | null = null;

  try {
    // 1. Setup Fixture Data
    console.log("\n[Setup Fixture] Menyiapkan data uji sementara...");

    fixtureUser = await prisma.user.create({
      data: {
        email: `${FIXTURE_PREFIX}user@example.com`,
        name: `${FIXTURE_PREFIX} User`,
      },
    });

    // Laporan kas bertanggal Jumat 18 September 2026 (minggu yang sama dengan transaksi uji)
    fixtureReport = await prisma.report.create({
      data: {
        reportDate: new Date("2026-09-18T00:00:00.000Z"),
        year: 2026,
        month: 9,
        weekOfMonth: 3,
        uploadedById: fixtureUser.id,
      },
    });

    fixtureAttachment = await prisma.attachment.create({
      data: {
        reportId: fixtureReport.id,
        fileUrl: `https://storage.example.com/${FIXTURE_PREFIX}.jpg`,
        fileType: "image",
        originalFileName: "fixture.jpg",
        fileSizeBytes: 1024,
      },
    });

    // Buat 2 Donor dengan nama yang menguji tie-breaker alfabetis (B vs I)
    donorA = await prisma.donor.create({
      data: {
        name: `${FIXTURE_PREFIX} Bapak Zainal`,
        normalizedName: `${FIXTURE_PREFIX.toLowerCase()}zainal`,
      },
    });

    donorB = await prisma.donor.create({
      data: {
        name: `${FIXTURE_PREFIX} Ibu Aisyah`,
        normalizedName: `${FIXTURE_PREFIX.toLowerCase()}aisyah`,
      },
    });

    // Siapkan 7 Transaksi dengan skenario lengkap
    // 1. Pemasukan verified donor A (normal date) = Rp 300.000
    await prisma.transaction.create({
      data: {
        attachmentId: fixtureAttachment.id,
        reportId: fixtureReport.id,
        type: "pemasukan",
        amount: 300000,
        description: `${FIXTURE_PREFIX} Infaq A1`,
        transactionDate: new Date("2026-09-15T00:00:00.000Z"),
        isVerified: true,
        donorId: donorA.id,
      },
    });

    // 2. Pemasukan verified donor A (normal date) = Rp 200.000
    await prisma.transaction.create({
      data: {
        attachmentId: fixtureAttachment.id,
        reportId: fixtureReport.id,
        type: "pemasukan",
        amount: 200000,
        description: `${FIXTURE_PREFIX} Infaq A2`,
        transactionDate: new Date("2026-09-16T00:00:00.000Z"),
        isVerified: true,
        donorId: donorA.id,
      },
    });

    // 3. Pemasukan verified donor B (normal date) = Rp 500.000 (total sama dengan donor A!)
    await prisma.transaction.create({
      data: {
        attachmentId: fixtureAttachment.id,
        reportId: fixtureReport.id,
        type: "pemasukan",
        amount: 500000,
        description: `${FIXTURE_PREFIX} Infaq B`,
        transactionDate: new Date("2026-09-17T00:00:00.000Z"),
        isVerified: true,
        donorId: donorB.id,
      },
    });

    // 4. Pengeluaran verified = Rp 150.000 (harus masuk trend pengeluaran, tidak boleh masuk donor)
    await prisma.transaction.create({
      data: {
        attachmentId: fixtureAttachment.id,
        reportId: fixtureReport.id,
        type: "pengeluaran",
        amount: 150000,
        description: `${FIXTURE_PREFIX} Operasional`,
        transactionDate: new Date("2026-09-16T00:00:00.000Z"),
        isVerified: true,
        donorId: donorA.id, // Sengaja diisi donorId untuk menguji isolasi tipe
      },
    });

    // 5. Pemasukan UNVERIFIED = Rp 1.000.000 (JANGAN SAMPAI BOCOR ke trend maupun donor!)
    await prisma.transaction.create({
      data: {
        attachmentId: fixtureAttachment.id,
        reportId: fixtureReport.id,
        type: "pemasukan",
        amount: 1000000,
        description: `${FIXTURE_PREFIX} Unverified Draft`,
        transactionDate: new Date("2026-09-16T00:00:00.000Z"),
        isVerified: false,
        donorId: donorA.id,
      },
    });

    // 6. Pemasukan verified Anonim (donorId: null) = Rp 250.000
    await prisma.transaction.create({
      data: {
        attachmentId: fixtureAttachment.id,
        reportId: fixtureReport.id,
        type: "pemasukan",
        amount: 250000,
        description: `${FIXTURE_PREFIX} Hamba Allah`,
        transactionDate: new Date("2026-09-18T00:00:00.000Z"),
        isVerified: true,
        donorId: null,
      },
    });

    // 7. Pemasukan verified TANPA transactionDate (harus fallback ke reportDate: 2026-09-18) = Rp 400.000
    await prisma.transaction.create({
      data: {
        attachmentId: fixtureAttachment.id,
        reportId: fixtureReport.id,
        type: "pemasukan",
        amount: 400000,
        description: `${FIXTURE_PREFIX} Fallback Test`,
        transactionDate: null,
        isVerified: true,
        donorId: null,
      },
    });

    console.log("  => 7 transaksi fixture berhasil dibuat.");

    // ===================================================================
    // TEST A: TREND (Weekly & Monthly)
    // ===================================================================
    console.log("\n--- [TEST A] GET /api/dashboard/trend ---");

    // A1. Weekly (12 periods default)
    const reqWeekly = new NextRequest("http://localhost:3000/api/dashboard/trend?granularity=weekly&periods=12");
    const resWeekly = await getTrend(reqWeekly);
    assert.strictEqual(resWeekly.status, 200, "Status weekly harus 200");
    const bodyWeekly = await resWeekly.json();

    assert.strictEqual(bodyWeekly.data.granularity, "weekly");
    assert.strictEqual(bodyWeekly.data.points.length, 12, "Jumlah points harus tepat 12");

    // Cari point minggu 2026-09-14 (Senin minggu tempat transaksi fixture berada)
    const targetWeek = bodyWeekly.data.points.find((p: { period: string }) => p.period === "2026-09-14");
    assert.ok(targetWeek, "Point periode minggu 2026-09-14 harus ada");

    // Expected pemasukan: 300k + 200k + 500k + 250k + 400k (fallback) = 1.650.000 (1.000.000 unverified TIDAK ikut)
    // Expected pengeluaran: 150.000
    console.log(`  [Weekly 2026-09-14] Expected Pemasukan: 1650000, Actual: ${targetWeek.pemasukan}`);
    console.log(`  [Weekly 2026-09-14] Expected Pengeluaran: 150000, Actual: ${targetWeek.pengeluaran}`);
    assert.strictEqual(targetWeek.pemasukan, 1650000, "Pemasukan weekly harus 1.650.000 (termasuk fallback, tanpa unverified)");
    assert.strictEqual(targetWeek.pengeluaran, 150000, "Pengeluaran weekly harus 150.000");

    // Pastikan periode kosong memiliki gap = 0
    const emptyWeek = bodyWeekly.data.points.find((p: { period: string }) => p.period !== "2026-09-14");
    if (emptyWeek) {
      assert.strictEqual(emptyWeek.pemasukan, 0, "Periode kosong harus memiliki pemasukan 0");
      assert.strictEqual(emptyWeek.pengeluaran, 0, "Periode kosong harus memiliki pengeluaran 0");
    }
    console.log("  => LULUS: Weekly trend (kalkulasi, unverified filtering, fallback, gap-filling).");

    // A2. Monthly
    const reqMonthly = new NextRequest("http://localhost:3000/api/dashboard/trend?granularity=monthly&periods=6");
    const resMonthly = await getTrend(reqMonthly);
    assert.strictEqual(resMonthly.status, 200, "Status monthly harus 200");
    const bodyMonthly = await resMonthly.json();

    assert.strictEqual(bodyMonthly.data.granularity, "monthly");
    assert.strictEqual(bodyMonthly.data.points.length, 6, "Jumlah points monthly harus tepat 6");

    const targetMonth = bodyMonthly.data.points.find((p: { period: string }) => p.period === "2026-09-01");
    assert.ok(targetMonth, "Point bulan 2026-09-01 harus ada");
    console.log(`  [Monthly 2026-09-01] Expected Pemasukan: 1650000, Actual: ${targetMonth.pemasukan}`);
    console.log(`  [Monthly 2026-09-01] Expected Pengeluaran: 150000, Actual: ${targetMonth.pengeluaran}`);
    assert.strictEqual(targetMonth.pemasukan, 1650000);
    assert.strictEqual(targetMonth.pengeluaran, 150000);
    console.log("  => LULUS: Monthly trend.");

    // ===================================================================
    // TEST B: DONORS LIST
    // ===================================================================
    console.log("\n--- [TEST B] GET /api/donors ---");
    const resDonors = await getDonors();
    assert.strictEqual(resDonors.status, 200);
    const bodyDonors = await resDonors.json();

    // Filter donatur fixture
    const fixtureDonors = bodyDonors.data.donors.filter((d: { name: string }) =>
      d.name.startsWith(FIXTURE_PREFIX)
    );

    assert.strictEqual(fixtureDonors.length, 2, "Harus ada 2 donatur fixture yang terdaftar");

    // Donor A: 300k + 200k = 500k, count = 2 (pengeluaran 150k dan unverified 1jt tidak dihitung!)
    const dA = fixtureDonors.find((d: { id: string }) => d.id === donorA!.id);
    assert.ok(dA);
    console.log(`  [Donor A] Expected Total: 500000, Actual: ${dA.totalContribution}`);
    console.log(`  [Donor A] Expected Count: 2, Actual: ${dA.donationCount}`);
    assert.strictEqual(dA.totalContribution, 500000);
    assert.strictEqual(dA.donationCount, 2);

    // Donor B: 500k, count = 1
    const dB = fixtureDonors.find((d: { id: string }) => d.id === donorB!.id);
    assert.ok(dB);
    console.log(`  [Donor B] Expected Total: 500000, Actual: ${dB.totalContribution}`);
    console.log(`  [Donor B] Expected Count: 1, Actual: ${dB.donationCount}`);
    assert.strictEqual(dB.totalContribution, 500000);
    assert.strictEqual(dB.donationCount, 1);

    // Test Deterministic Sorting Tie-Breaker:
    // Kedua donatur sama-sama memiliki totalContribution 500.000.
    // "Bapak Zainal" ('B') vs "Ibu Aisyah" ('I'). Urutan name ASC: 'B' harus mendahului 'I'.
    const idxA = fixtureDonors.indexOf(dA);
    const idxB = fixtureDonors.indexOf(dB);
    console.log(`  [Tie-breaker Sort] Index Bapak Zainal: ${idxA}, Index Ibu Aisyah: ${idxB}`);
    assert.ok(idxA < idxB, "Bapak Zainal harus muncul sebelum Ibu Aisyah karena name ASC");

    // Anonymous aggregate: 250k (txn 6) + 400k (txn 7) = 650.000, count = 2
    console.log(`  [Anonymous] Expected Total: 650000, Actual: ${bodyDonors.data.anonymous.totalContribution}`);
    console.log(`  [Anonymous] Expected Count: 2, Actual: ${bodyDonors.data.anonymous.donationCount}`);
    assert.strictEqual(bodyDonors.data.anonymous.totalContribution, 650000);
    assert.strictEqual(bodyDonors.data.anonymous.donationCount, 2);
    console.log("  => LULUS: Agregasi donatur, tie-breaker sorting, dan anonim.");

    // ===================================================================
    // TEST C: DONOR DETAIL
    // ===================================================================
    console.log("\n--- [TEST C] GET /api/donors/:id ---");
    const reqDetailA = new NextRequest(`http://localhost:3000/api/donors/${donorA!.id}`);
    const resDetailA = await getDonorById(reqDetailA, {
      params: Promise.resolve({ id: donorA!.id }),
    });
    assert.strictEqual(resDetailA.status, 200);
    const bodyDetailA = await resDetailA.json();

    assert.strictEqual(bodyDetailA.data.donor.id, donorA!.id);
    assert.strictEqual(bodyDetailA.data.donor.totalContribution, 500000);
    assert.strictEqual(bodyDetailA.data.history.length, 2, "Riwayat hanya berisi 2 transaksi pemasukan verified");

    // Urutan riwayat harus descending berdasarkan transactionDate (2026-09-16 sebelum 2026-09-15)
    console.log(`  [History 0] Date: ${bodyDetailA.data.history[0].transactionDate}, Amount: ${bodyDetailA.data.history[0].amount}`);
    console.log(`  [History 1] Date: ${bodyDetailA.data.history[1].transactionDate}, Amount: ${bodyDetailA.data.history[1].amount}`);
    assert.strictEqual(bodyDetailA.data.history[0].transactionDate, "2026-09-16");
    assert.strictEqual(bodyDetailA.data.history[0].amount, 200000);
    assert.strictEqual(bodyDetailA.data.history[1].transactionDate, "2026-09-15");
    assert.strictEqual(bodyDetailA.data.history[1].amount, 300000);
    console.log("  => LULUS: Detail donatur & urutan riwayat descending.");

    // ===================================================================
    // TEST D: VALIDATION & ERROR HANDLING
    // ===================================================================
    console.log("\n--- [TEST D] Validation & HTTP Error Codes ---");

    // D1. Invalid granularity -> 400
    const resBadGran = await getTrend(new NextRequest("http://localhost:3000/api/dashboard/trend?granularity=hourly"));
    assert.strictEqual(resBadGran.status, 400);
    const bodyBadGran = await resBadGran.json();
    console.log(`  [Invalid Granularity] Status 400, Error: "${bodyBadGran.error}"`);

    // D2. Invalid periods (negatif/desimal/huruf) -> 400
    const resBadPeriods = await getTrend(new NextRequest("http://localhost:3000/api/dashboard/trend?periods=-5"));
    assert.strictEqual(resBadPeriods.status, 400);
    const bodyBadPeriods = await resBadPeriods.json();
    console.log(`  [Invalid Periods] Status 400, Error: "${bodyBadPeriods.error}"`);

    // D3. Periods melebihi batas -> 400
    const resOverPeriods = await getTrend(new NextRequest("http://localhost:3000/api/dashboard/trend?periods=999"));
    assert.strictEqual(resOverPeriods.status, 400);
    const bodyOverPeriods = await resOverPeriods.json();
    console.log(`  [Over Periods] Status 400, Error: "${bodyOverPeriods.error}"`);

    // D4. Donor ID tidak ditemukan -> 404
    const resNotFound = await getDonorById(new NextRequest("http://localhost:3000/api/donors/clxyz_not_found"), {
      params: Promise.resolve({ id: "clxyz_not_found" }),
    });
    assert.strictEqual(resNotFound.status, 404);
    const bodyNotFound = await resNotFound.json();
    console.log(`  [Donor Not Found] Status 404, Error: "${bodyNotFound.error}"`);
    console.log("  => LULUS: Seluruh skenario validasi & error HTTP.");

  } finally {
    // 2. CLEANUP FIXTURE DATA (Wajib bersih 100%)
    console.log("\n[Cleanup] Membersihkan data uji fixture...");

    if (fixtureReport) {
      await prisma.transaction.deleteMany({
        where: { reportId: fixtureReport.id },
      });
      await prisma.attachment.deleteMany({
        where: { reportId: fixtureReport.id },
      });
      await prisma.report.delete({
        where: { id: fixtureReport.id },
      });
    }

    if (donorA) {
      await prisma.donor.delete({ where: { id: donorA.id } });
    }
    if (donorB) {
      await prisma.donor.delete({ where: { id: donorB.id } });
    }

    if (fixtureUser) {
      await prisma.user.delete({ where: { id: fixtureUser.id } });
    }

    // Verifikasi kondisi DB kembali persis ke baseline
    const finalCounts = {
      donors: await prisma.donor.count(),
      transactions: await prisma.transaction.count(),
      reports: await prisma.report.count(),
      users: await prisma.user.count(),
    };
    console.log("[Final DB]", finalCounts);
    assert.deepStrictEqual(
      finalCounts,
      initialCounts,
      "Database harus kembali bersih 100% ke kondisi awal!"
    );
    console.log("=> LULUS CLEANUP: Database kembali ke kondisi awal 100%.");
  }

  console.log("\n===================================================================");
  console.log("   SELURUH PENGUJIAN FUNGSIONAL V5 LULUS SECARA SEMPURNA!          ");
  console.log("===================================================================");
}

main()
  .catch((err) => {
    console.error("Uji fungsional gagal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
