"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?: "icon" | "full";
}

export function LogoutButton({ variant = "icon" }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  if (variant === "full") {
    return (
      <button
        onClick={handleLogout}
        className="flex items-center gap-4 px-2.5 text-red-400 hover:text-red-500"
      >
        <LogOut className="h-5 w-5 transition-all" />
        Sair
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOut className="h-5 w-5 text-red-500" />
      <span className="sr-only">Sair</span>
    </button>
  );
}
