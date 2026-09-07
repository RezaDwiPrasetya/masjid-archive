import Link from "next/link";
import { Archive, ImagePlus, Search } from "lucide-react";

const navItems = [
  { href: "/", label: "Laporan", icon: Archive },
  { href: "/unggah", label: "Unggah", icon: ImagePlus },
  { href: "/cari", label: "Cari", icon: Search },
];

export function AppShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "/" | "/unggah" | "/cari";
}) {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col border-r bg-sidebar py-6">
        <div className="mb-8 px-6">
          <span className="text-xl font-bold text-primary">Masjid Archive</span>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-end border-b bg-background/90 px-6 backdrop-blur">
          <div className="text-right">
            <p className="text-sm font-medium">Bendahara</p>
            <p className="text-xs text-muted-foreground">DKM Masjid Al-Luqman</p>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-8 pb-24">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 flex h-16 items-center justify-around border-t bg-background lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-xs ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}