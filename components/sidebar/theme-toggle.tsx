"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <SidebarMenuButton
      onClick={toggleTheme}
      tooltip={isDark ? "Modo claro" : "Modo escuro"}
      className="text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
    >
      {isDark
        ? <Sun className="transition-transform duration-300 rotate-0 scale-100" />
        : <Moon className="transition-transform duration-300 rotate-0 scale-100" />
      }
      <span>{isDark ? "Modo claro" : "Modo escuro"}</span>
    </SidebarMenuButton>
  );
}
