"use client";

import { Activity, Server, Swords, Zap, Bug, ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { trpc } from "@/trpc/client";

const STAT_CARDS = [
    {
        key: "totalSystems",
        label: "Total Systems",
        icon: Server,
        description: "Connected targets in your fleet",
    },
    {
        key: "totalAttacks",
        label: "Total Attacks",
        icon: Swords,
        description: "All penetration tests launched",
    },
    {
        key: "activeAttacks",
        label: "Active Attacks",
        icon: Zap,
        pulse: true,
        description: "Currently running operations",
    },
    {
        key: "totalVulnerabilities",
        label: "Total Vulnerabilities",
        icon: Bug,
        description: "Discovered across all systems",
    },
    {
        key: "patchedVulnerabilities",
        label: "Patched Vulns",
        icon: ShieldCheck,
        description: "Successfully remediated",
    },
    {
        key: "unpatchedVulnerabilities",
        label: "Unpatched Vulns",
        icon: ShieldOff,
        description: "Awaiting remediation",
    },
] as const;

type StatKey = (typeof STAT_CARDS)[number]["key"];

export default function OverviewSection() {
    const { data: stats, isLoading } = trpc.overview.getStats.useQuery();

    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl p-6 text-foreground font-mono mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-1 border-b border-red-900/30 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded border border-red-900/40 bg-red-950/20">
                        <Activity className="w-5 h-5 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-bold uppercase tracking-tight text-red-500">
                        Overview
                    </h2>
                </div>
                <p className="text-muted-foreground mt-2 text-sm pl-12">
                    Real-time intelligence dashboard — system fleet, attack operations, and vulnerability posture.
                </p>
            </div>

            {/* Stats Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {STAT_CARDS.map((card) => {
                        const Icon = card.icon;
                        const value = stats?.[card.key as StatKey] ?? 0;

                        return (
                            <div key={card.key} className="relative group">
                                {/* Hover glow */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-900 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-500" />

                                <div className="relative bg-card py-6 px-6 border border-red-900/40 hover:border-red-500/40 transition-colors rounded-lg flex flex-col gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-red-950/20 rounded-md border border-red-900/40 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-red-500" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                {card.label}
                                            </span>
                                        </div>

                                        {"pulse" in card && card.pulse && value > 0 && (
                                            <span className="relative flex h-2.5 w-2.5 mt-1">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1 mt-1">
                                        <span className="text-3xl font-bold text-foreground tabular-nums tracking-tight">
                                            {value}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">
                                            {card.description}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
