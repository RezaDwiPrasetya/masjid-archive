"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-on-surface-variant">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-xs font-medium">Memeriksa sesi...</span>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => signIn("google")}
        className="gap-2 rounded-lg border-outline-variant bg-surface-container hover:bg-surface-container-high hover:border-primary/40 text-on-surface font-medium transition-all shadow-xs"
      >
        <GoogleIcon className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Masuk dengan Google</span>
        <span className="sm:hidden">Masuk</span>
      </Button>
    );
  }

  const role = session.user?.role;

  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {session.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name ?? "Avatar"}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-outline-variant object-cover"
          />
        ) : (
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs">
            {session.user?.name?.charAt(0) ?? "U"}
          </div>
        )}
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-on-surface leading-tight truncate max-w-[140px]">
            {session.user?.name}
          </span>
          {role && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
              {role}
            </span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="xs"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
        title="Keluar dari akun"
      >
        <LogOut className="h-3.5 w-3.5 sm:mr-1" />
        <span className="hidden sm:inline text-xs">Keluar</span>
      </Button>
    </div>
  );
}
