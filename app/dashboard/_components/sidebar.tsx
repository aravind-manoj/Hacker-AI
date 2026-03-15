"use client";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { Terminal } from "lucide-react";
import { Sections } from "./sections";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSidebar() {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Sidebar className="overflow-hidden border-r border-red-900/30">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[30%] bg-red-500/5 dark:bg-red-900/30 blur-[80px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[30%] bg-red-500/5 dark:bg-red-900/20 blur-[80px] rounded-full" />
        </div>
        <SidebarHeader className="relative z-10 flex w-full justify-center items-center bg-transparent">
          <Skeleton className="w-[90%] h-16 rounded-2xl" />
        </SidebarHeader>
        <SidebarContent className="relative z-10 bg-transparent">
          <SidebarGroup className="mt-5 w-full flex justify-center items-center bg-transparent">
            <Skeleton className="w-[95%] h-10 rounded-2xl" />
            <Skeleton className="mt-3 w-[95%] h-10 rounded-2xl" />
            <Skeleton className="mt-3 w-[95%] h-10 rounded-2xl" />
            <Skeleton className="mt-3 w-[95%] h-10 rounded-2xl" />
            <Skeleton className="mt-3 w-[95%] h-10 rounded-2xl" />
            <Skeleton className="mt-3 w-[95%] h-10 rounded-2xl" />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="relative z-10 flex justify-center items-center bg-transparent">
          <Skeleton className="my-2 w-[95%] h-12 rounded-2xl" />
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="overflow-hidden border-r border-red-900/30">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[30%] bg-red-500/5 dark:bg-red-900/30 blur-[80px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[30%] bg-red-500/5 dark:bg-red-900/20 blur-[80px] rounded-full" />
      </div>

      <SidebarHeader className="flex w-full items-center justify-center bg-transparent px-0 py-2">
        <Link href="/dashboard" className="flex w-full justify-center">
          <div className="mx-auto flex h-20 w-full items-center justify-center">
            <Image
              src={resolvedTheme === "dark" ? "/logo.svg" : "/logo_black.svg"}
              alt="Hacker.AI Logo"
              width={250}
              height={45}
              priority
            />
          </div>

        </Link>
      </SidebarHeader>
      <SidebarContent className="relative z-10 bg-transparent">
        <SidebarGroup className="mt-5 bg-transparent">
          <SidebarMenu>
            {Sections.map((item) => {
              const active = pathname === `/dashboard${item.href}` || pathname.startsWith(`/dashboard${item.href}/`);
              return (
                <SidebarMenuButton
                  isActive={active}
                  key={item.title}
                  className={cn(
                    "cursor-pointer p-5 mt-1 text-base transition-all duration-200 rounded-md",
                    active
                      ? "font-bold bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border-l-2 border-red-600"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  onClick={() => redirect(`/dashboard/${item.href}`)}
                >
                  {item.icon} {item.title}
                </SidebarMenuButton>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="relative z-10 bg-transparent">
        <Link className="flex justify-center" href={"/docs"} target="_blank">
          <Button className="cursor-pointer my-2 w-[95%] relative">
            <span>Documentation</span>
          </Button>
        </Link>
        <span className="text-center text-sm">© {new Date().getFullYear()} Hacker AI. Co</span>
      </SidebarFooter>
    </Sidebar>
  );
}
