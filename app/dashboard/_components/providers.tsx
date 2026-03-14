"use client";

import { TRPCProvider } from "@/trpc/client";

export default function DashboardProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
