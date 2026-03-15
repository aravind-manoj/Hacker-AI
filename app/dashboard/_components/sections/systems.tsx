"use client";

import { useState, useEffect, useRef } from "react";
import { Server, Plus, Loader2, Trash2, Shield, TerminalSquare, KeyRound, AlertCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SystemsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [deployingSystemId, setDeployingSystemId] = useState<string | null>(null);
  const [deployingSecretKey, setDeployingSecretKey] = useState<string | null>(null);
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

  const { data: deployingSystem } = trpc.systems.getSystem.useQuery(
    { id: deployingSystemId! },
    {
      enabled: !!deployingSystemId,
      refetchInterval: (query) => {
        // Stop polling if status is connected or failed
        if (query.state.data?.status === "connected" || query.state.data?.status === "failed") {
          return false;
        }
        return 1000; // Poll every 1s
      },
    }
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (deployingSystemId && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [deployingSystemId]);

  const addSystem = trpc.systems.addSystem.useMutation({
    onSuccess: (data) => {
      toast.success("Deployment initiated");
      setDeployingSystemId(data.id);
      setDeployingSecretKey(data.secretKey);
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

  const closeDialog = () => {
    setIsOpen(false);
    setDeployingSystemId(null);
    setDeployingSecretKey(null);
    setFormData({
      name: "",
      sshHost: "",
      sshPort: "22",
      sshUsername: "",
      sshPassword: "",
      sshKey: "",
    });
    utils.systems.getSystems.invalidate();
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

        <Dialog open={isOpen} onOpenChange={(open) => {
          if (!open) closeDialog();
          else setIsOpen(true);
        }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded shadow-[0_0_15px_rgba(255,0,0,0.3)] hover:shadow-[0_0_25px_rgba(255,0,0,0.5)] transition-all whitespace-nowrap">
              <Plus className="w-4 h-4" />
              Add Target
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl bg-card border border-red-900/50 text-foreground font-mono rounded-lg shadow-2xl shadow-red-900/20 max-h-[90vh] overflow-y-auto">
            {!deployingSystemId ? (
              <>
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

                  <div className="mt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={closeDialog}
                      className="text-muted-foreground hover:text-foreground transition-colors uppercase text-sm font-bold tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addSystem.isPending}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest px-6 py-2 rounded flex items-center gap-2 disabled:opacity-50"
                    >
                      {addSystem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col gap-6 py-4 w-full overflow-hidden">
                <DialogHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <DialogTitle className="text-xl font-bold uppercase tracking-tight text-red-500 flex items-center gap-2">
                        <TerminalSquare className="w-5 h-5" />
                        Deploy Agent
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground mt-1">
                        Status: <span className={deployingSystem?.status === 'connected' ? "text-green-400 font-bold uppercase" : "text-yellow-400 font-bold uppercase"}>{deployingSystem?.status || "pending"}</span>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {deployingSystem?.status === "connected" ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-black rounded-lg border border-green-900/40 text-center gap-4 w-full">
                    <div className="w-16 h-16 rounded-full bg-green-950/40 flex items-center justify-center border border-green-500/50">
                      <Shield className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-green-400 uppercase tracking-widest">Agent Connected</h3>
                    <p className="text-sm text-green-500/70 max-w-sm">
                      The node has successfully authenticated with the orchestration server. It is now ready to receive operational tasks.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 w-full overflow-hidden">
                    <p className="text-sm text-muted-foreground">
                      Run the following command on your target server to download and install the agent. Ensure you run this as root or with sudo privileges.
                    </p>
                    <div className="relative">
                      <div className="bg-black rounded-lg border border-red-900/30 font-mono text-xs p-4 text-green-400 shadow-inner overflow-x-auto whitespace-nowrap">
                        <code className="select-all block pr-12">
                          curl -sSL https://raw.githubusercontent.com/aravind-manoj/Hacker-AI/refs/heads/main/toolkit/install.sh | sudo bash -s -- {deployingSystemId} {deployingSecretKey} {process.env.NEXT_PUBLIC_API_URL}
                        </code>
                      </div>
                      <button
                        onClick={() => {
                          const cmd = `curl -sSL https://raw.githubusercontent.com/aravind-manoj/Hacker-AI/refs/heads/main/toolkit/install.sh | sudo bash -s -- ${deployingSystemId} ${deployingSecretKey} ${process.env.NEXT_PUBLIC_API_URL}`;
                          navigator.clipboard.writeText(cmd);
                          toast.success("Command copied to clipboard");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-950/50 hover:bg-red-900 border border-red-900/50 text-red-500 hover:text-red-300 p-2 rounded transition-colors"
                        title="Copy to clipboard"
                      >
                        <TerminalSquare className="w-4 h-4 cursor-pointer" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-yellow-500/80 bg-yellow-950/20 p-3 rounded border border-yellow-900/30">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <p>Waiting for the agent to connect. Once the script finishes, this screen will update automatically.</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-2 pt-4 border-t border-red-900/30">
                  <button
                    onClick={closeDialog}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest px-6 py-2 rounded flex items-center gap-2 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
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
              <div
                className={`relative bg-card py-6 px-6 border transition-colors rounded-lg flex flex-col gap-4 ${sys.status === 'connected' ? 'border-red-900/40 hover:border-red-500/40' : 'border-yellow-900/40 hover:border-yellow-500/40 cursor-pointer'}`}
                onClick={() => {
                  setDeployingSystemId(sys.id);
                  setDeployingSecretKey(sys.secretKey);
                  setIsOpen(true);
                }}
              >

                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-950/20 rounded-md border border-red-900/40 flex items-center justify-center">
                      <Server className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground uppercase text-sm truncate max-w-[150px]">{sys.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="relative flex h-2 w-2">
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${sys.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider ${sys.status === 'connected' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {sys.status === 'connected' ? 'Connected' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
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
