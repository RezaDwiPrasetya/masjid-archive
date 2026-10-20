import { isStaff } from "../lib/auth-guard";
import type { Session } from "next-auth";

const sessionAnon: Session | null = null;

const sessionGuest: Session = {
  user: { id: "guest", name: "Jamaah", email: "jamaah@gmail.com", role: null },
  expires: "2099-01-01",
};

const sessionBendahara: Session = {
  user: { id: "bendahara", name: "Ahmad", email: "bendahara@masjid.id", role: "BENDAHARA" },
  expires: "2099-01-01",
};

const sessionAdmin: Session = {
  user: { id: "admin", name: "Ketua", email: "admin@masjid.id", role: "ADMIN" },
  expires: "2099-01-01",
};

// Simulasi konstruksi navItems seperti di components/app-shell.tsx
function getNavItems(session: Session | null) {
  const isUserStaff = isStaff(session);
  const items: Array<{ href: string; label: string }> = [];

  if (isUserStaff) {
    items.push({ href: "/unggah", label: "Unggah" });
  }

  items.push(
    { href: "/", label: "Laporan" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/donatur", label: "Donatur" },
    { href: "/pengeluaran", label: "Pengeluaran" },
    { href: "/cari", label: "Cari" },
  );

  return items;
}

// Simulasi logika smart redirect pasca login (app/auth/post-login/route.ts)
function getPostLoginRedirect(session: Session | null, targetUrl?: string | null) {
  if (targetUrl && targetUrl !== "/" && !targetUrl.startsWith("/login") && !targetUrl.startsWith("/auth/post-login")) {
    return targetUrl;
  }
  if (isStaff(session)) {
    return "/unggah";
  }
  return "/";
}

let passed = 0;
let failed = 0;

function assert(desc: string, cond: boolean) {
  if (cond) {
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
    failed++;
  }
}

console.log("=================================================================");
console.log("TEST SUITE: Urutan Menu Sidebar & Smart Redirect Pasca-Login");
console.log("=================================================================");

// 1. Uji Sidebar Staf
const bendaharaNav = getNavItems(sessionBendahara);
assert("Bendahara: Menu pertama (#1) adalah '/unggah'", bendaharaNav[0].href === "/unggah");
assert("Bendahara: Menu kedua (#2) adalah '/laporan'", bendaharaNav[1].href === "/");

const adminNav = getNavItems(sessionAdmin);
assert("Admin: Menu pertama (#1) adalah '/unggah'", adminNav[0].href === "/unggah");

// 2. Uji Sidebar Publik / Jamaah
const guestNav = getNavItems(sessionGuest);
assert("Guest/Jamaah: Menu '/unggah' TIDAK muncul di daftar menu", !guestNav.some((n) => n.href === "/unggah"));
assert("Guest/Jamaah: Menu pertama (#1) adalah '/laporan' (/) ", guestNav[0].href === "/");

const anonNav = getNavItems(sessionAnon);
assert("Anon: Menu '/unggah' TIDAK muncul di daftar menu", !anonNav.some((n) => n.href === "/unggah"));
assert("Anon: Menu pertama (#1) adalah '/laporan' (/) ", anonNav[0].href === "/");

// 3. Uji Smart Redirect
console.log("\n--- Uji Smart Redirect Pasca Login ---");
assert(
  "Bendahara login (tanpa target eksplisit) -> diarahkan ke '/unggah'",
  getPostLoginRedirect(sessionBendahara, null) === "/unggah"
);
assert(
  "Admin login (tanpa target eksplisit) -> diarahkan ke '/unggah'",
  getPostLoginRedirect(sessionAdmin, null) === "/unggah"
);
assert(
  "Bendahara login dengan target spesifik '/laporan/abc' -> diarahkan ke '/laporan/abc'",
  getPostLoginRedirect(sessionBendahara, "/laporan/abc") === "/laporan/abc"
);
assert(
  "Jamaah/Guest login -> diarahkan ke beranda publik '/'",
  getPostLoginRedirect(sessionGuest, null) === "/"
);
assert(
  "Jamaah/Guest login dengan target spesifik '/cari' -> diarahkan ke '/cari'",
  getPostLoginRedirect(sessionGuest, "/cari") === "/cari"
);

console.log("=================================================================");
console.log(`HASIL: ${passed} Passed, ${failed} Failed`);
console.log("=================================================================");

if (failed > 0) process.exit(1);
