"use client";

import { useState } from "react";
import { Server, Plus, Loader2, Trash2, Shield, TerminalSquare, KeyRound, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "@/trpc/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function SystemsSection() {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        sshHost: "",
        sshPort: "22",
        sshUsername: "",
        sshPassword: "",
        sshKey: "",
    });

    const utils = trpc.useUtils();

    const { data: systems, isLoading } = trpc.systems.getSystems.useQuery();

    const addSystem = trpc.systems.addSystem.useMutation({
        onSuccess: () => {
            toast.success("System added successfully");
            setIsOpen(false);
            setFormData({
                name: "",
                sshHost: "",
                sshPort: "22",
                sshUsername: "",
                sshPassword: "",
                sshKey: "",
            });
            utils.systems.getSystems.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to add system");
        },
    });

    const deleteSystem = trpc.systems.deleteSystem.useMutation({
        onSuccess: () => {
            toast.success("System terminated");
            utils.systems.getSystems.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to terminate system");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.sshHost || !formData.sshUsername) {
            toast.error("Name, Host, and Username are required.");
            return;
        }
        addSystem.mutate(formData);
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl p-6 text-foreground font-mono mx-auto">
            {/* Header section w/ Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-900/30 pb-6">
                <div>
                    <h2 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-3 text-red-500">
                        <Server className="w-8 h-8" />
                        Server Fleet
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Manage your orchestrated sub-agents and active SSH payload targets.
                    </p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded shadow-[0_0_15px_rgba(255,0,0,0.3)] hover:shadow-[0_0_25px_rgba(255,0,0,0.5)] transition-all whitespace-nowrap">
                            <Plus className="w-4 h-4" />
                            Add Target
                        </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl bg-card border border-red-900/50 text-foreground font-mono rounded-lg shadow-2xl shadow-red-900/20 max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold uppercase tracking-tight text-red-500 flex items-center gap-2">
                                <TerminalSquare className="w-5 h-5" />
                                New Target Configuration
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Deploy orchestration keys to a new unmanaged node.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-red-500 font-bold uppercase tracking-wider">Node Alias</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-background border border-red-900/40 rounded px-4 py-3 text-foreground focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-colors"
                                    placeholder="e.g. Production Web DB-01"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="flex flex-col gap-2 sm:col-span-3">
                                    <label className="text-xs text-red-500 font-bold uppercase tracking-wider flex items-center gap-2"><Shield className="w-3 h-3" /> Host / IP</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.sshHost}
                                        onChange={(e) => setFormData({ ...formData, sshHost: e.target.value })}
                                        className="bg-background border border-red-900/40 rounded px-4 py-3 text-foreground focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-colors placeholder:text-muted-foreground/50"
                                        placeholder="192.168.1.100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 sm:col-span-1">
                                    <label className="text-xs text-red-500 font-bold uppercase tracking-wider">Port</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.sshPort}
                                        onChange={(e) => setFormData({ ...formData, sshPort: e.target.value })}
                                        className="bg-background border border-red-900/40 rounded px-4 py-3 text-foreground focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-colors text-center"
                                        placeholder="22"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-red-500 font-bold uppercase tracking-wider">SSH Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.sshUsername}
                                        onChange={(e) => setFormData({ ...formData, sshUsername: e.target.value })}
                                        className="bg-background border border-red-900/40 rounded px-4 py-3 text-foreground focus:outline-none focus:border-red-500 transition-colors placeholder:text-muted-foreground/50"
                                        placeholder="root"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-red-500 font-bold uppercase tracking-wider">SSH Password</label>
                                    <input
                                        type="password"
                                        value={formData.sshPassword}
                                        onChange={(e) => setFormData({ ...formData, sshPassword: e.target.value })}
                                        className="bg-background border border-red-900/40 rounded px-4 py-3 text-foreground focus:outline-none focus:border-red-500 transition-colors placeholder:text-muted-foreground/50"
                                        placeholder="Leave blank if using key"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-red-500 font-bold uppercase tracking-wider flex items-center gap-2"><KeyRound className="w-3 h-3" /> Identity File (RSA/ED25519)</label>
                                <textarea
                                    rows={4}
                                    value={formData.sshKey}
                                    onChange={(e) => setFormData({ ...formData, sshKey: e.target.value })}
                                    className="bg-background border border-red-900/40 rounded px-4 py-3 text-foreground font-mono text-xs focus:outline-none focus:border-red-500 transition-colors resize-none placeholder:text-muted-foreground/50 leading-relaxed"
                                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                                />
                            </div>

                            <DialogFooter className="mt-4 sm:justify-between flex-row">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-muted-foreground hover:text-foreground transition-colors uppercase text-sm font-bold tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addSystem.isPending}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest px-6 py-2 rounded flex items-center gap-2 disabled:opacity-50"
                                >
                                    {addSystem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Agent"}
                                </button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Systems Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                </div>
            ) : systems?.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-dashed border-red-900/30 rounded-lg bg-red-950/5 text-center gap-4">
                    <AlertCircle className="w-12 h-12 text-red-900/60" />
                    <h3 className="text-xl font-bold uppercase text-foreground/90">No Authorized Targets</h3>
                    <p className="text-muted-foreground text-sm max-w-md">You have not deployed Hacker.AI sub-agents to any systems. Click 'Add Target' above to initiate an orchestration tunnel.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {systems?.map((sys) => (
                        <div key={sys.id} className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-900 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                            <div className="relative bg-card py-6 px-6 border border-red-900/40 hover:border-red-500/40 transition-colors rounded-lg flex flex-col gap-4">

                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-950/20 rounded-md border border-red-900/40 flex items-center justify-center">
                                            <Server className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground uppercase text-sm truncate max-w-[150px]">{sys.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                                <span className="text-[10px] uppercase text-red-400 tracking-wider">Connected</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to terminate this connection?')) {
                                                deleteSystem.mutate({ id: sys.id });
                                            }
                                        }}
                                        disabled={deleteSystem.isPending}
                                        className="text-red-600 hover:text-red-400 transition-colors p-1.5 rounded border border-transparent hover:border-red-900/30 hover:bg-red-900/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-red-900/20">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground uppercase">Host</span>
                                        <span className="text-foreground/90 font-bold">{sys.sshHost}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground uppercase">Port</span>
                                        <span className="text-foreground/90 font-bold">{sys.sshPort}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground uppercase">Identity</span>
                                        <span className="text-foreground/90 font-bold truncate max-w-[100px]">{sys.sshUsername}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground uppercase">Added</span>
                                        <span className="text-foreground/90">{new Date(sys.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
