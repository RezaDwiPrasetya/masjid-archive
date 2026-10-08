import { isAdmin, isStaff } from "../lib/auth-guard";
import type { Session } from "next-auth";

// Definisi mock session untuk pengujian
const sessionAnon: Session | null = null;

const sessionGuest: Session = {
  user: {
    id: "guest-user-1",
    name: "Jamaah Google",
    email: "jamaah@example.com",
    role: null,
  },
  expires: "2099-01-01",
};

const sessionBendahara: Session = {
  user: {
    id: "bendahara-user-1",
    name: "Ahmad Bendahara",
    email: "bendahara@masjid.id",
    role: "BENDAHARA",
  },
  expires: "2099-01-01",
};

const sessionBendaharaLowerCase: Session = {
  user: {
    id: "bendahara-user-2",
    name: "Budi Bendahara",
    email: "budi@masjid.id",
    role: " bendahara ",
  },
  expires: "2099-01-01",
};

const sessionAdmin: Session = {
  user: {
    id: "admin-user-1",
    name: "Ketua DKM Admin",
    email: "ketua@masjid.id",
    role: "ADMIN",
  },
  expires: "2099-01-01",
};

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failed++;
  }
}

console.log("=================================================================");
console.log("TEST SUITE 1: Helper isStaff & isAdmin");
console.log("=================================================================");

// Test Anon
assert("Anon session: isAdmin is false", isAdmin(sessionAnon) === false);
assert("Anon session: isStaff is false", isStaff(sessionAnon) === false);

// Test Guest / Google Role null
assert("Guest (role: null): isAdmin is false", isAdmin(sessionGuest) === false);
assert("Guest (role: null): isStaff is false", isStaff(sessionGuest) === false);

// Test Bendahara
assert("Bendahara: isAdmin is false", isAdmin(sessionBendahara) === false);
assert("Bendahara: isStaff is true", isStaff(sessionBendahara) === true);

// Test Case Insensitivity & Trim
assert("Bendahara (' bendahara '): isStaff is true", isStaff(sessionBendaharaLowerCase) === true);
assert("Bendahara (' bendahara '): isAdmin is false", isAdmin(sessionBendaharaLowerCase) === false);

// Test Admin
assert("Admin: isAdmin is true", isAdmin(sessionAdmin) === true);
assert("Admin: isStaff is true", isStaff(sessionAdmin) === true);

console.log("\n=================================================================");
console.log("TEST SUITE 2: Simulasi Guard Akses Endpoint Finansial");
console.log("=================================================================");

// Simulasi helper untuk guard endpoint
function checkEndpointAccess(
  endpoint: string,
  method: string,
  session: Session | null,
  requiredRole: "STAFF" | "ADMIN"
) {
  if (!session) return { status: 401, message: "Unauthorized" };
  if (requiredRole === "ADMIN" && !isAdmin(session)) {
    return { status: 403, message: "Forbidden: Hanya Admin" };
  }
  if (requiredRole === "STAFF" && !isStaff(session)) {
    return { status: 403, message: "Forbidden: Hanya Staf (Admin/Bendahara)" };
  }
  return { status: 200, message: "OK" };
}

// Simulasi filter query draf transaksi
function getTransactionWhereClause(session: Session | null, reportId: string) {
  return {
    reportId,
    ...(isStaff(session) ? {} : { isVerified: true }),
  };
}

const endpointsToTest: Array<{ path: string; method: string; guard: "STAFF" | "ADMIN" }> = [
  { path: "/api/reports", method: "POST", guard: "STAFF" },
  { path: "/api/reports/:id", method: "DELETE", guard: "ADMIN" },
  { path: "/api/reports/:id/attachments", method: "POST", guard: "STAFF" },
  { path: "/api/attachments/:id", method: "DELETE", guard: "STAFF" },
  { path: "/api/attachments/:id/extract", method: "POST", guard: "STAFF" },
  { path: "/api/transactions/:id", method: "PATCH", guard: "STAFF" },
  { path: "/api/transactions/:id", method: "DELETE", guard: "STAFF" },
  { path: "/api/transactions/:id/confirm", method: "POST", guard: "STAFF" },
  { path: "/api/transactions/:id/unverify", method: "POST", guard: "STAFF" },
  { path: "/api/transactions/:id/donor", method: "PATCH", guard: "STAFF" },
  { path: "/api/transactions/:id/category", method: "PATCH", guard: "STAFF" },
  { path: "/api/users", method: "GET", guard: "ADMIN" },
  { path: "/api/users", method: "PATCH", guard: "ADMIN" },
  { path: "/api/users", method: "DELETE", guard: "ADMIN" },
];

console.log("\n--- Skenario 1: Role null (Guest Google) ---");
for (const ep of endpointsToTest) {
  const res = checkEndpointAccess(ep.path, ep.method, sessionGuest, ep.guard);
  assert(`Guest -> ${ep.method} ${ep.path} HARUS 403 Forbidden`, res.status === 403);
}

// Cek draf untuk guest
const guestWhere = getTransactionWhereClause(sessionGuest, "rep-1");
assert(
  "Guest -> GET /api/reports/:id/transactions HARUS filter isVerified: true (draf disembunyikan)",
  guestWhere.isVerified === true
);

console.log("\n--- Skenario 2: Role BENDAHARA ---");
for (const ep of endpointsToTest) {
  const res = checkEndpointAccess(ep.path, ep.method, sessionBendahara, ep.guard);
  if (ep.guard === "ADMIN") {
    assert(`Bendahara -> ${ep.method} ${ep.path} HARUS 403 Forbidden (Hanya Admin)`, res.status === 403);
  } else {
    assert(`Bendahara -> ${ep.method} ${ep.path} HARUS 200 OK (Akses Staf diizinkan)`, res.status === 200);
  }
}

// Cek draf untuk bendahara
const bendaharaWhere = getTransactionWhereClause(sessionBendahara, "rep-1");
assert(
  "Bendahara -> GET /api/reports/:id/transactions TIDAK filter isVerified (draf dapat dilihat)",
  !("isVerified" in bendaharaWhere)
);

console.log("\n--- Skenario 3: Role ADMIN ---");
for (const ep of endpointsToTest) {
  const res = checkEndpointAccess(ep.path, ep.method, sessionAdmin, ep.guard);
  assert(`Admin -> ${ep.method} ${ep.path} HARUS 200 OK (Semua diizinkan)`, res.status === 200);
}

// Cek draf untuk admin
const adminWhere = getTransactionWhereClause(sessionAdmin, "rep-1");
assert(
  "Admin -> GET /api/reports/:id/transactions TIDAK filter isVerified (draf dapat dilihat)",
  !("isVerified" in adminWhere)
);

console.log("\n=================================================================");
console.log(`HASIL AKHIR: ${passed} Passed, ${failed} Failed`);
console.log("=================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("Semua pengujian otorisasi berhasil 100%!");
}
