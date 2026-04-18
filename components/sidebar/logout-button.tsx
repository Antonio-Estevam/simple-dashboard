"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  return (
    <SidebarMenuButton
      onClick={handleLogout}
      tooltip="Sair"
      className="text-red-400 hover:text-red-500 hover:bg-transparent"
    >
      <LogOut />
      <span>Sair</span>
    </SidebarMenuButton>
  );
}
