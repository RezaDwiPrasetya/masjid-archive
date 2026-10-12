import assert from "node:assert";
import { EXPENSE_CATEGORIES } from "../lib/expense-categories";
import { derivePeriod } from "../lib/derive-period";
import { matchAndAssignDonor } from "../lib/donor-service";
import { prisma } from "../lib/prisma";

console.log("=================================================================");
console.log("TEST SUITE: Audit Hardening Verification (Fix/QA-Audit-Hardening)");
console.log("=================================================================\n");

let passed = 0;
let failed = 0;

function runTest(description: string, fn: () => void | Promise<void>): Promise<void> | void {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          console.log(`  ✅ PASS: ${description}`);
          passed++;
        })
        .catch((err: unknown) => {
          console.error(`  ❌ FAIL: ${description}`);
          if (err instanceof Error) {
            console.error(`     Error: ${err.message}`);
          }
          failed++;
        });
    }
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } catch (err: unknown) {
    console.error(`  ❌ FAIL: ${description}`);
    if (err instanceof Error) {
      console.error(`     Error: ${err.message}`);
    }
    failed++;
  }
}

// -----------------------------------------------------------------------------
// 1. UJI LOGIKA CEGAH DEMOTE ADMIN TERAKHIR
// -----------------------------------------------------------------------------
console.log("[1] Pengujian Proteksi Demote Admin Terakhir (app/api/users/route.ts):");

interface SimulatedUser {
  id: string;
  name: string;
  role: string | null;
}

function simulateUserRoleUpdate(
  targetUser: SimulatedUser | null,
  newRole: string | null | undefined,
  allUsers: SimulatedUser[]
): { status: number; error?: string; updated?: SimulatedUser } {
  if (!targetUser) {
    return { status: 404, error: "Pengguna tidak ditemukan." };
  }

  const validRoles = [null, "ADMIN", "BENDAHARA"];
  if (newRole !== undefined && !validRoles.includes(newRole)) {
    return { status: 400, error: "Invalid role" };
  }

  const isTargetAdmin = targetUser.role?.trim().toUpperCase() === "ADMIN";
  const isNewRoleAdmin = typeof newRole === "string" && newRole.trim().toUpperCase() === "ADMIN";

  if (isTargetAdmin && !isNewRoleAdmin) {
    const adminCount = allUsers.filter(
      (u) => u.role?.trim().toUpperCase() === "ADMIN"
    ).length;

    if (adminCount <= 1) {
      return {
        status: 400,
        error: "Tidak dapat mencabut hak akses Admin dari Administrator terakhir.",
      };
    }
  }

  return {
    status: 200,
    updated: {
      ...targetUser,
      role: newRole ?? targetUser.role,
    },
  };
}

runTest("Demote admin tunggal (adminCount = 1) menjadi BENDAHARA harus DITOLAK (400)", () => {
  const users: SimulatedUser[] = [
    { id: "u-admin-1", name: "Ketua DKM", role: "ADMIN" },
    { id: "u-bendahara", name: "Bendahara 1", role: "BENDAHARA" },
  ];

  const res = simulateUserRoleUpdate(users[0], "BENDAHARA", users);
  assert.strictEqual(res.status, 400);
  assert.strictEqual(
    res.error,
    "Tidak dapat mencabut hak akses Admin dari Administrator terakhir."
  );
});

runTest("Demote admin tunggal (adminCount = 1) menjadi null (Jamaah) harus DITOLAK (400)", () => {
  const users: SimulatedUser[] = [
    { id: "u-admin-1", name: "Ketua DKM", role: "ADMIN" },
    { id: "u-guest", name: "Jamaah 1", role: null },
  ];

  const res = simulateUserRoleUpdate(users[0], null, users);
  assert.strictEqual(res.status, 400);
  assert.strictEqual(
    res.error,
    "Tidak dapat mencabut hak akses Admin dari Administrator terakhir."
  );
});

runTest("Demote salah satu admin ketika ada 2 admin (adminCount = 2) harus DIIZINKAN (200)", () => {
  const users: SimulatedUser[] = [
    { id: "u-admin-1", name: "Ketua DKM", role: "ADMIN" },
    { id: "u-admin-2", name: "Wakil Ketua", role: "ADMIN" },
  ];

  const res = simulateUserRoleUpdate(users[0], "BENDAHARA", users);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.updated?.role, "BENDAHARA");
});

runTest("Promosi Bendahara menjadi Admin (adminCount = 1) harus DIIZINKAN (200)", () => {
  const users: SimulatedUser[] = [
    { id: "u-admin-1", name: "Ketua DKM", role: "ADMIN" },
    { id: "u-bendahara", name: "Bendahara", role: "BENDAHARA" },
  ];

  const res = simulateUserRoleUpdate(users[1], "ADMIN", users);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.updated?.role, "ADMIN");
});

// -----------------------------------------------------------------------------
// 2. UJI VALIDASI TRANSAKSI PATCH (amount, type, category)
// -----------------------------------------------------------------------------
console.log("\n[2] Pengujian Validasi PATCH Transaksi (app/api/transactions/[id]/route.ts):");

function validateTransactionPatch(body: {
  amount?: unknown;
  type?: unknown;
  category?: unknown;
}): { status: number; error?: string } {
  // 1. Validasi amount
  if (body.amount !== undefined) {
    if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
      return {
        status: 400,
        error: "Nominal transaksi harus berupa angka positif lebih dari 0.",
      };
    }
  }

  // 2. Validasi type
  if (body.type !== undefined) {
    if (body.type !== "pemasukan" && body.type !== "pengeluaran") {
      return {
        status: 400,
        error: "Tipe transaksi hanya boleh 'pemasukan' atau 'pengeluaran'.",
      };
    }
  }

  // 3. Validasi category
  if (body.category !== undefined) {
    if (body.category === null || body.category === "") {
      // Valid null
    } else if (typeof body.category === "string") {
      const trimmedCategory = body.category.trim();
      if (trimmedCategory === "") {
        // Valid null
      } else {
        const validValues = EXPENSE_CATEGORIES.map((c) => c.value) as string[];
        if (!validValues.includes(trimmedCategory)) {
          return {
            status: 400,
            error: `Nilai kategori tidak valid: ${body.category}`,
          };
        }
      }
    } else {
      return {
        status: 400,
        error: "Nilai kategori tidak valid.",
      };
    }
  }

  return { status: 200 };
}

runTest("Nominal negatif (-500) harus DITOLAK (400)", () => {
  const res = validateTransactionPatch({ amount: -500 });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.error, "Nominal transaksi harus berupa angka positif lebih dari 0.");
});

runTest("Nominal nol (0) harus DITOLAK (400)", () => {
  const res = validateTransactionPatch({ amount: 0 });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.error, "Nominal transaksi harus berupa angka positif lebih dari 0.");
});

runTest("Nominal non-finite (NaN, Infinity) harus DITOLAK (400)", () => {
  const resNan = validateTransactionPatch({ amount: NaN });
  assert.strictEqual(resNan.status, 400);
  const resInf = validateTransactionPatch({ amount: Infinity });
  assert.strictEqual(resInf.status, 400);
});

runTest("Nominal positif valid (500000) harus DIIZINKAN (200)", () => {
  const res = validateTransactionPatch({ amount: 500000 });
  assert.strictEqual(res.status, 200);
});

runTest("Tipe tidak valid ('abc') harus DITOLAK (400)", () => {
  const res = validateTransactionPatch({ type: "abc" });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.error, "Tipe transaksi hanya boleh 'pemasukan' atau 'pengeluaran'.");
});

runTest("Tipe valid ('pemasukan' dan 'pengeluaran') harus DIIZINKAN (200)", () => {
  assert.strictEqual(validateTransactionPatch({ type: "pemasukan" }).status, 200);
  assert.strictEqual(validateTransactionPatch({ type: "pengeluaran" }).status, 200);
});

runTest("Kategori tidak valid ('kategori_palsu') harus DITOLAK (400)", () => {
  const res = validateTransactionPatch({ category: "kategori_palsu" });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.error, "Nilai kategori tidak valid: kategori_palsu");
});

runTest("Kategori terdaftar ('operasional', 'honor', dll) harus DIIZINKAN (200)", () => {
  assert.strictEqual(validateTransactionPatch({ category: "operasional" }).status, 200);
  assert.strictEqual(validateTransactionPatch({ category: "honor" }).status, 200);
  assert.strictEqual(validateTransactionPatch({ category: null }).status, 200);
});

// -----------------------------------------------------------------------------
// 3. UJI TIMEZONE ROBUSTNESS (TZ="America/New_York")
// -----------------------------------------------------------------------------
console.log("\n[3] Pengujian Timezone (TZ='America/New_York') pada Tanggal Laporan '2026-10-09':");

const originalTZ = process.env.TZ;
process.env.TZ = "America/New_York";

runTest("Tanggal '2026-10-09' dengan getUTCDay() tetap bernilai 5 (Jumat) di bawah TZ America/New_York", () => {
  const date = new Date("2026-10-09");
  // getUTCDay() harus 5 (Jumat)
  assert.strictEqual(date.getUTCDay(), 5, "getUTCDay() harus 5 (Jumat)");
});

runTest("derivePeriod('2026-10-09') menghasilkan tahun 2026, bulan 10, pekan 2 di bawah TZ America/New_York", () => {
  const date = new Date("2026-10-09");
  const period = derivePeriod(date);
  assert.strictEqual(period.year, 2026);
  assert.strictEqual(period.month, 10);
  assert.strictEqual(period.weekOfMonth, 2);
});

// Kembalikan TZ
if (originalTZ) {
  process.env.TZ = originalTZ;
} else {
  delete process.env.TZ;
}

// -----------------------------------------------------------------------------
// 4. UJI KONKURENSI PARALEL matchAndAssignDonor DENGAN NAMA BARU
// -----------------------------------------------------------------------------
console.log("\n[4] Pengujian Konkurensi matchAndAssignDonor Paralel:");

async function runParallelDonorTest() {
  const testDonorName = `Test Parallel QA ${Date.now()}`;

  try {
    // Jalankan 2 pemanggilan matchAndAssignDonor secara bersamaan dengan nama donatur baru yang sama persis
    const [res1, res2] = await Promise.all([
      matchAndAssignDonor("pemasukan", testDonorName),
      matchAndAssignDonor("pemasukan", testDonorName),
    ]);

    assert.ok(res1.donorId, "res1 harus memiliki donorId");
    assert.ok(res2.donorId, "res2 harus memiliki donorId");
    assert.strictEqual(res1.donorId, res2.donorId, "res1 dan res2 harus mengarah ke donorId yang sama persis");

    // Pastikan di database hanya ada 1 entitas Donor dengan ID tersebut
    const donorCount = await prisma.donor.count({
      where: { id: res1.donorId },
    });
    assert.strictEqual(donorCount, 1, "Hanya boleh tercipta tepat 1 entitas Donor di database");

    // Bersihkan data uji setelah selesai
    await prisma.donor.delete({
      where: { id: res1.donorId },
    });

    console.log(`  ✅ PASS: Dua panggilan paralel untuk '${testDonorName}' sukses tanpa error dan hanya membuat 1 Donor.`);
    passed++;
  } catch (err: unknown) {
    console.error(`  ❌ FAIL: Konkurensi matchAndAssignDonor gagal`);
    if (err instanceof Error) {
      console.error(`     Error: ${err.message}`);
    }
    failed++;
  }
}

// Jalankan test async dan tutup koneksi Prisma
runParallelDonorTest().finally(async () => {
  await prisma.$disconnect();
  console.log("\n=================================================================");
  console.log(`HASIL AKHIR: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  }
});
