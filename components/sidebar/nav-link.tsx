"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BriefcaseBusiness, Home, Package2, Settings2, ShoppingBag, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/dashboard/crm", icon: BriefcaseBusiness, label: "CRM" },
  { href: "#", icon: ShoppingBag, label: "Pedidos" },
  { href: "#", icon: Package2, label: "Produtos" },
  { href: "#", icon: Users, label: "Clientes" },
  { href: "#", icon: Settings2, label: "Configurações" },
];

const ITEM_SIZE = 36; // h-9 in px
const ITEM_GAP = 16;  // gap-4 in px

export function SidebarNavLinks() {
  const pathname = usePathname();
  const activeIndex = navItems.findIndex((item) => item.href === pathname);

  return (
    <TooltipProvider>
      <div className="relative flex flex-col gap-4">
        {activeIndex >= 0 && (
          <motion.span
            className="absolute left-0 h-9 w-9 rounded-full bg-primary pointer-events-none"
            animate={{ y: activeIndex * (ITEM_SIZE + ITEM_GAP) }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center"
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  />
                  <span className="sr-only">{label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
