"use client";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Sections } from "./sections";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSidebar() {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { path } = useParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Sidebar>
        <SidebarHeader className="flex w-full justify-center items-center">
          <Skeleton className="w-[90%] h-16 rounded-2xl" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="mt-5 w-full flex justify-center items-center">
            <Skeleton className="w-[95%] h-10 rounded-2xl" />
            <Skeleton className="mt-3 w-[95%] h-10 rounded-2xl" />
            <Skeleton className="mt-3 w-[95%] h-10 rounded-2xl" />
            <Skeleton className="mt-3 w-[95%] h-10 rounded-2xl" />
            <Skeleton className="mt-3 w-[95%] h-10 rounded-2xl" />
            <Skeleton className="mt-3 w-[95%] h-10 rounded-2xl" />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="flex justify-center items-center">
          <Skeleton className="my-2 w-[95%] h-12 rounded-2xl" />
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link className="flex w-full justify-center items-center cursor-pointer" href={"/dashboard"}>
          <Image src={resolvedTheme === "dark" ? "/logo_white.svg" : "/logo_black.svg"} alt="logo" className="w-16 h-auto" width={100} height={100} priority />
          <h1 className="text-2xl font-bold">Hacker.AI</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="mt-5">
          <SidebarMenu>
            {Sections.map((item) => {
              const active = item.href === "/" + path;
              return (
                <SidebarMenuButton
                  isActive={active}
                  key={item.title}
                  className={cn("cursor-pointer p-5 mt-1 text-base" + (active ? " font-bold" : ""))}
                  onClick={() => redirect(`/dashboard/${item.href}`)}
                >
                  {item.icon} {item.title}
                </SidebarMenuButton>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Link className="flex justify-center" href={"/docs"} target="_blank">
          <Button className="cursor-pointer my-2 w-[95%]">
            <span>Documentation</span>
          </Button>
        </Link>
        <span className="text-center text-sm">© {new Date().getFullYear()} Hacker AI. Co</span>
      </SidebarFooter>
    </Sidebar>
  );
}
