"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Memuat...</span>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <Button variant="default" size="sm" onClick={() => router.push("/login")} className="group rounded-xl transition-all duration-300 hover:shadow-md hover:shadow-primary/20">
        <LogIn className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
        Masuk
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {session.user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.user.image}
          alt={session.user.name ?? "Avatar"}
          className="h-8 w-8 rounded-full"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-xs font-bold">{session.user?.name?.charAt(0) ?? "U"}</span>
        </div>
      )}
      <div className="hidden flex-col md:flex">
        <span className="text-sm font-semibold">{session.user?.name}</span>
        <span className="text-xs text-muted-foreground">{session.user?.email}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={() => signOut()} className="rounded-xl transition-colors hover:bg-destructive/10 hover:text-destructive">
        <LogOut className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Keluar</span>
      </Button>
    </div>
  );
}
