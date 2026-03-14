import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "./_components/sidebar";
import SectionHeader from "./_components/section-header";
import { ThemeProvider } from "next-themes";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { deleteSessionCookie } from "@/lib/client/session";
import { Toaster } from "react-hot-toast";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (!data) {
    await deleteSessionCookie();
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SidebarProvider>
        <Toaster />
        <DashboardSidebar />
        <main className="w-full">
          <SectionHeader />
          {children}
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}
