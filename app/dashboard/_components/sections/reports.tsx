"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/trpc/client";
import {
    FileText,
    Plus,
    Trash2,
    ExternalLink,
    Search,
    Calendar,
    TrendingUp,
    Database,
    X,
    Loader2,
    ShieldAlert,
    Clock,
    ChevronRight,
    AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function timeAgo(dateStr: string) {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: React.ElementType;
    label: string;
    value: number | string;
    sub?: string;
    accent?: string;
}) {
    return (
        <div
            className="relative group overflow-hidden rounded-lg border border-red-900/40 bg-card"
        >
            {/* Glow blob */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-red-600/10 rounded-full blur-2xl group-hover:bg-red-600/20 transition-all duration-500" />
            <div className="relative p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div
                        className={`p-2 rounded-md border border-red-900/40 bg-red-950/30 ${accent ?? ""}`}
                    >
                        <Icon className="w-4 h-4 text-red-500" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-900/60 group-hover:text-red-500 transition-colors" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
                    {sub && <p className="text-xs text-red-500/70 mt-1">{sub}</p>}
                </div>
            </div>
            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />
        </div>
    );
}

// ─── Report Row ──────────────────────────────────────────────────────────────

function ReportRow({
    rep,
    index,
    onDelete,
}: {
    rep: {
        id: string;
        name: string | null;
        description: string | null;
        url: string | null;
        createdAt: string;
        userId: string | null;
    };
    index: number;
    onDelete: (id: string, name: string) => void;
}) {
    return (
        <tr
            className="group border-b border-red-900/20 hover:bg-red-950/10 transition-colors"
        >
            {/* Name + description */}
            <td className="px-4 py-3">
                <div className="flex items-start gap-2">
                    <div className="mt-0.5 p-1.5 rounded border border-red-900/30 bg-red-950/20 flex-shrink-0">
                        <FileText className="w-3 h-3 text-red-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate max-w-xs">
                            {rep.name ?? "Untitled Report"}
                        </p>
                        {rep.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                                {rep.description}
                            </p>
                        )}
                    </div>
                </div>
            </td>

            {/* URL */}
            <td className="px-4 py-3 hidden md:table-cell">
                {rep.url ? (
                    <a
                        href={rep.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors truncate max-w-[200px]"
                    >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{rep.url.replace(/^https?:\/\//, "")}</span>
                    </a>
                ) : (
                    <span className="text-xs text-muted-foreground/40 italic">No URL</span>
                )}
            </td>

            {/* Date */}
            <td className="px-4 py-3 hidden lg:table-cell">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 text-red-900" />
                    <span>{formatDate(rep.createdAt)}</span>
                    <span className="text-red-900/60">·</span>
                    <span className="text-red-500/70">{timeAgo(rep.createdAt)}</span>
                </div>
            </td>

            {/* Actions */}
            <td className="px-4 py-3 text-right">
                <button
                    onClick={() => onDelete(rep.id, rep.name ?? "Untitled Report")}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded border border-red-900/30 hover:bg-red-900/30 hover:border-red-600/50 text-red-600 hover:text-red-400"
                    title="Delete report"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </td>
        </tr>
    );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [url, setUrl] = useState("");

    const createMutation = trpc.reports.createReport.useMutation({
        onSuccess: () => {
            toast.success("Report created successfully.");
            onCreated();
            onClose();
            setName("");
            setDescription("");
            setUrl("");
        },
        onError: (err) => {
            toast.error(err.message || "Failed to create report.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        createMutation.mutate({ name: name.trim(), description: description.trim(), url: url.trim() });
    };

    return (
        <>
            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        key="backdrop"
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div
                        key="modal"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="pointer-events-auto w-full max-w-md bg-card border border-red-900/50 rounded-lg shadow-2xl shadow-red-900/20 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-red-900/30">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded border border-red-900/40 bg-red-950/30">
                                        <Plus className="w-4 h-4 text-red-500" />
                                    </div>
                                    <h2 className="font-bold text-base text-foreground uppercase tracking-wider">
                                        New Report
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded hover:bg-red-900/20 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-red-500">
                                        Report Name <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        autoFocus
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. SQLi vulnerability on target.com"
                                        className="bg-background border border-red-900/40 rounded px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-colors"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-red-500">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe the vulnerability or findings..."
                                        rows={3}
                                        className="bg-background border border-red-900/40 rounded px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-colors resize-none"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-red-500">
                                        Target URL
                                    </label>
                                    <input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://target.com"
                                        type="url"
                                        className="bg-background border border-red-900/40 rounded px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-colors"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm border border-red-900/30 rounded text-muted-foreground hover:text-foreground hover:border-red-900/60 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || !name.trim()}
                                        className="px-5 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase tracking-wider"
                                    >
                                        {createMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-3.5 h-3.5" />
                                                Create
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
    target,
    onClose,
    onDeleted,
}: {
    target: { id: string; name: string } | null;
    onClose: () => void;
    onDeleted: () => void;
}) {
    const deleteMutation = trpc.reports.deleteReport.useMutation({
        onSuccess: () => {
            toast.success("Report deleted.");
            onDeleted();
            onClose();
        },
        onError: (err) => {
            toast.error(err.message || "Failed to delete report.");
        },
    });

    return (
        <>
            {target && (
                <>
                    <div
                        key="del-backdrop"
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                    />
                    <div
                        key="del-modal"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="pointer-events-auto w-full max-w-sm bg-card border border-red-900/50 rounded-lg shadow-2xl shadow-red-900/20 overflow-hidden">
                            <div className="p-6 flex flex-col items-center gap-4 text-center">
                                <div className="p-3 rounded-full border border-red-900/40 bg-red-950/30">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-base text-foreground uppercase tracking-wider">
                                        Delete Report
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Are you sure you want to permanently delete{" "}
                                        <span className="text-red-400 font-semibold">"{target.name}"</span>?
                                        This action cannot be undone.
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2 text-sm border border-red-900/30 rounded text-muted-foreground hover:text-foreground hover:border-red-900/60 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => deleteMutation.mutate({ id: target.id })}
                                        disabled={deleteMutation.isPending}
                                        className="flex-1 px-4 py-2 text-sm font-bold bg-red-700 hover:bg-red-800 text-white rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 uppercase tracking-wider"
                                    >
                                        {deleteMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportsSection() {
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const { data: reports, isLoading: reportsLoading, refetch: refetchReports } =
        trpc.reports.getMyReports.useQuery();

    const { data: stats, isLoading: statsLoading, refetch: refetchStats } =
        trpc.reports.getStats.useQuery();

    const refetch = () => {
        refetchReports();
        refetchStats();
    };

    const filtered = useMemo(() => {
        if (!reports) return [];
        const q = search.toLowerCase().trim();
        if (!q) return reports;
        return reports.filter(
            (r) =>
                r.name?.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q) ||
                r.url?.toLowerCase().includes(q)
        );
    }, [reports, search]);

    return (
        <div className="flex flex-col gap-6 p-6 w-full min-h-[calc(100vh-56px)] font-mono">
            {/* ── Page Header ─────────────────────────────────────────── */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 rounded border border-red-900/40 bg-red-950/20">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">
                            Reports
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground pl-10">
                        Track and manage your security findings and pentest reports.
                    </p>
                </div>

                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase tracking-wider rounded shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:shadow-[0_0_25px_rgba(220,38,38,0.45)] transition-all self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    New Report
                </button>
            </div>

            {/* ── Stat Cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    icon={Database}
                    label="Total Reports"
                    value={statsLoading ? "—" : (stats?.total ?? 0)}
                    sub="All time"
                />
                <StatCard
                    icon={TrendingUp}
                    label="This Month"
                    value={statsLoading ? "—" : (stats?.thisMonth ?? 0)}
                    sub="Monthly activity"
                />
                <StatCard
                    icon={Calendar}
                    label="This Week"
                    value={statsLoading ? "—" : (stats?.thisWeek ?? 0)}
                    sub="7-day window"
                />
            </div>

            {/* ── Reports Table Card ───────────────────────────────────── */}
            <div
                className="flex-1 border border-red-900/40 rounded-lg bg-card overflow-hidden flex flex-col"
            >
                {/* Table toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-red-900/30 bg-red-950/5">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                            All Reports
                        </span>
                        {!reportsLoading && (
                            <span className="text-xs px-2 py-0.5 rounded border border-red-900/30 bg-red-950/20 text-red-400 tabular-nums">
                                {filtered.length}
                            </span>
                        )}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search reports..."
                            className="pl-8 pr-3 py-1.5 text-sm bg-background border border-red-900/30 rounded focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40 transition-colors placeholder:text-muted-foreground/40 w-56"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    {reportsLoading ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                            <Loader2 className="w-8 h-8 text-red-600/60 animate-spin" />
                            <span className="text-sm uppercase tracking-wider">Loading reports...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                            <div className="p-4 rounded-full border border-red-900/30 bg-red-950/10">
                                <FileText className="w-8 h-8 text-red-900/60" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold uppercase tracking-wider">
                                    {search ? "No matching reports" : "No reports yet"}
                                </p>
                                <p className="text-xs mt-1 text-muted-foreground/60">
                                    {search
                                        ? "Try a different search query."
                                        : "Create your first security report to get started."}
                                </p>
                            </div>
                            {!search && (
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="flex items-center gap-1.5 text-xs px-4 py-2 border border-red-900/40 rounded text-red-500 hover:bg-red-950/20 transition-colors uppercase tracking-wider"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Create First Report
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-red-900/20 bg-red-950/5">
                                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-red-500/80">
                                        Report
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-red-500/80 hidden md:table-cell">
                                        Target URL
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-red-500/80 hidden lg:table-cell">
                                        Date
                                    </th>
                                    <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-red-500/80">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((rep, i) => (
                                    <ReportRow
                                        key={rep.id}
                                        rep={rep}
                                        index={i}
                                        onDelete={(id, name) => setDeleteTarget({ id, name })}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Table footer */}
                {!reportsLoading && filtered.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-red-900/20 flex items-center justify-between text-xs text-muted-foreground/60 bg-red-950/5">
                        <span>
                            Showing <span className="text-red-400">{filtered.length}</span> of{" "}
                            <span className="text-red-400">{reports?.length ?? 0}</span> reports
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            Live
                        </span>
                    </div>
                )}
            </div>

            {/* ── Modals ──────────────────────────────────────────────── */}
            <CreateModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={refetch}
            />

            <DeleteModal
                target={deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onDeleted={refetch}
            />
        </div>
    );
}
