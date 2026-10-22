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
    items.push(
      { href: "/dashboard", label: "Dashboard" },
      { href: "/unggah", label: "Unggah" },
      { href: "/keuangan", label: "Keuangan" }
    );
  } else {
    items.push({ href: "/", label: "Beranda" });
  }

  items.push(
    { href: "/donatur", label: "Donatur" },
    { href: "/pengeluaran", label: "Pengeluaran" },
    { href: "/cari", label: "Cari" }
  );

  if (session?.user?.role === "ADMIN") {
    items.push({ href: "/pengguna", label: "Pengguna" });
  }

  return items;
}

// Simulasi logika smart redirect pasca login (app/auth/post-login/route.ts)
function getPostLoginRedirect(session: Session | null, targetUrl?: string | null) {
  if (targetUrl && targetUrl !== "/" && !targetUrl.startsWith("/login") && !targetUrl.startsWith("/auth/post-login")) {
    return targetUrl;
  }
  if (isStaff(session)) {
    return "/dashboard";
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
assert("Bendahara: Menu pertama (#1) adalah 'Dashboard' (/dashboard)", bendaharaNav[0].href === "/dashboard" && bendaharaNav[0].label === "Dashboard");
assert("Bendahara: Menu kedua (#2) adalah 'Unggah' (/unggah)", bendaharaNav[1].href === "/unggah");
assert("Bendahara: Menu ketiga (#3) adalah 'Keuangan' (/keuangan)", bendaharaNav[2].href === "/keuangan");
assert("Bendahara: Menu 'Beranda' (/) TIDAK ADA di menu utama (ada di footer link)", !bendaharaNav.some((n) => n.href === "/"));
assert("Bendahara: Menu 'Pengguna' TIDAK ADA", !bendaharaNav.some((n) => n.href === "/pengguna"));

const adminNav = getNavItems(sessionAdmin);
assert("Admin: Menu pertama (#1) adalah 'Dashboard' (/dashboard)", adminNav[0].href === "/dashboard");
assert("Admin: Menu 'Pengguna' (/pengguna) ADA", adminNav.some((n) => n.href === "/pengguna"));
assert("Admin: Menu 'Beranda' (/) TIDAK ADA di menu utama", !adminNav.some((n) => n.href === "/"));

// 2. Uji Sidebar Publik / Jamaah
const guestNav = getNavItems(sessionGuest);
assert("Guest/Jamaah: Menu pertama (#1) adalah 'Beranda' (/)", guestNav[0].href === "/" && guestNav[0].label === "Beranda");
assert("Guest/Jamaah: Menu '/dashboard' TIDAK ADA", !guestNav.some((n) => n.href === "/dashboard"));
assert("Guest/Jamaah: Menu '/unggah' TIDAK ADA", !guestNav.some((n) => n.href === "/unggah"));
assert("Guest/Jamaah: Menu '/keuangan' TIDAK ADA", !guestNav.some((n) => n.href === "/keuangan"));
assert("Guest/Jamaah: Menu '/pengguna' TIDAK ADA", !guestNav.some((n) => n.href === "/pengguna"));

const anonNav = getNavItems(sessionAnon);
assert("Anon: Menu pertama (#1) adalah 'Beranda' (/)", anonNav[0].href === "/" && anonNav[0].label === "Beranda");
assert("Anon: Menu '/dashboard' TIDAK ADA", !anonNav.some((n) => n.href === "/dashboard"));
assert("Anon: Menu '/unggah' TIDAK ADA", !anonNav.some((n) => n.href === "/unggah"));

// 3. Uji Smart Redirect
console.log("\n--- Uji Smart Redirect Pasca Login ---");
assert(
  "Bendahara login (tanpa target eksplisit) -> diarahkan ke '/dashboard'",
  getPostLoginRedirect(sessionBendahara, null) === "/dashboard"
);
assert(
  "Admin login (tanpa target eksplisit) -> diarahkan ke '/dashboard'",
  getPostLoginRedirect(sessionAdmin, null) === "/dashboard"
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
