"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  BicepsFlexed,
  BriefcaseBusiness,
  ChevronDown,
  Home,
  Package2,
  Settings2,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

export function AppSidebar() {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();

  const isCrmActive = pathname.startsWith("/dashboard/crm");
  const isCoachingActive = pathname.startsWith("/dashboard/coaching");

  const [crmOpen, setCrmOpen] = useState(isCrmActive);  
  const [coachingOpen, setCoachingOpen] = useState(isCoachingActive);

  const containerRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLButtonElement>(null);
  const crmRef = useRef<HTMLButtonElement>(null);
  const coachingRef = useRef<HTMLButtonElement>(null);
  const [pill, setPill] = useState<{ y: number; h: number } | null>(null);

  useEffect(() => {
    if (isCrmActive) setCrmOpen(true);
  }, [isCrmActive]);
  
  useEffect(() => {
    if (isCoachingActive) setCoachingOpen(true);
  }, [isCoachingActive]);

  useEffect(() => {
    const container = containerRef.current;
    const activeEl =
      pathname === "/dashboard" ? homeRef.current :
      isCrmActive ? crmRef.current :
      null;

    if (!container || !activeEl) { setPill(null); return; }

    const measure = () => {
      const c = container.getBoundingClientRect();
      const b = activeEl.getBoundingClientRect();
      setPill({ y: b.top - c.top, h: b.height });
    };

    measure();
    // re-measure after sidebar expand/collapse transition
    const t = setTimeout(measure, 320);
    return () => clearTimeout(t);
  }, [pathname, isCrmActive, open]);

  function handleCrmClick() {
    if (!open) {
      setOpen(true);
      setCrmOpen(true);
    } else {
      setCrmOpen((p) => !p);
    }
  }

  function handleCoachingClick() {
    if (!open) {
      setOpen(true);
      setCoachingOpen(true);
    } else {
      setCoachingOpen((p) => !p);
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div ref={containerRef} className="relative">
              {pill && (
                <motion.div
                  className="absolute inset-x-1 rounded-md bg-sidebar-accent pointer-events-none"
                  initial={false}
                  animate={{ y: pill.y, height: pill.h }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    ref={homeRef}
                    asChild
                    isActive={pathname === "/dashboard"}
                    tooltip="Início"
                    className="relative z-10 data-[active=true]:bg-transparent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium hover:bg-transparent"
                  >
                    <Link href="/dashboard">
                      <Home />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                
                <Collapsible open={coachingOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      ref={coachingRef}
                      isActive={isCoachingActive}
                      tooltip="Coaching"
                      className="relative z-10 data-[active=true]:bg-transparent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium hover:bg-transparent"
                      onClick={handleCoachingClick}
                    >
                      <BicepsFlexed />
                      <span>Coaching</span>
                      <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/coaching"}>
                            <Link href="/dashboard/crm">Resumo</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                <Collapsible open={crmOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      ref={crmRef}
                      isActive={isCrmActive}
                      tooltip="CRM"
                      className="relative z-10 data-[active=true]:bg-transparent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium hover:bg-transparent"
                      onClick={handleCrmClick}
                    >
                      <BriefcaseBusiness />
                      <span>CRM</span>
                      <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/crm"}>
                            <Link href="/dashboard/crm">Resumo</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/crm/clients"}>
                            <Link href="/dashboard/crm/clients">Clientes Ativos</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/crm/inactive-clients"}>
                            <Link href="/dashboard/crm/inactive-clients">Clientes Inativos</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/crm/leads"}>
                            <Link href="/dashboard/crm/leads">Leads</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/crm/follow-up"}>
                            <Link href="/dashboard/crm/follow-up">Follow-up</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/crm/financial"}>
                            <Link href="/dashboard/crm/financial">Financeiro</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
                
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Configurações" className="relative z-10 hover:bg-sidebar-accent">
                    <Link href="#"><Settings2 /><span>Configurações</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

              </SidebarMenu>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <LogoutButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
