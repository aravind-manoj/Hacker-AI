"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ShieldAlert, TerminalSquare, AlertCircle, X, ShieldCheck, Search, Filter, SortDesc, BoxIcon } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "@/trpc/client";
import "xterm/css/xterm.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function RealtimeVulnsSection() {
  const [activeTab, setActiveTab] = useState<"unfixed" | "fixed">("unfixed");

  // Filters & Pagination for Unfixed
  const [unfixedPage, setUnfixedPage] = useState(1);
  const [unfixedSearch, setUnfixedSearch] = useState("");
  const [unfixedSearchInput, setUnfixedSearchInput] = useState("");
  const [unfixedSeverity, setUnfixedSeverity] = useState("");
  const [unfixedSortBy, setUnfixedSortBy] = useState<"createdAt" | "severity" | "title">("createdAt");

  // Filters & Pagination for Fixed
  const [fixedPage, setFixedPage] = useState(1);
  const [fixedSearch, setFixedSearch] = useState("");
  const [fixedSearchInput, setFixedSearchInput] = useState("");
  const [fixedSeverity, setFixedSeverity] = useState("");
  const [fixedSortBy, setFixedSortBy] = useState<"createdAt" | "severity" | "title">("createdAt");

  const [pollingVulnId, setPollingVulnId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: unfixedData, isLoading: isLoadingUnfixed } = trpc.vulnerabilities.getVulnerabilities.useQuery({
    page: unfixedPage,
    pageSize: 10,
    search: unfixedSearch || undefined,
    severity: unfixedSeverity || undefined,
    sortBy: unfixedSortBy,
    isFixed: false,
  });

  const { data: fixedData, isLoading: isLoadingFixed } = trpc.vulnerabilities.getVulnerabilities.useQuery({
    page: fixedPage,
    pageSize: 10,
    search: fixedSearch || undefined,
    severity: fixedSeverity || undefined,
    sortBy: fixedSortBy,
    isFixed: true,
  });

  const { data: pollingVuln } = trpc.vulnerabilities.getVulnerability.useQuery(
    { id: pollingVulnId! },
    {
      enabled: !!pollingVulnId,
      refetchInterval: (query) => {
        if (query.state.data?.isFixed || activeTab === "fixed") return false;
        return 3000;
      },
    }
  );

  const fixVulnMutation = trpc.vulnerabilities.fixVulnerability.useMutation({
    onSuccess: () => {
      toast.success("Fix agent engaged.");
      utils.vulnerabilities.getVulnerabilities.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start fix agent");
    }
  });

  const stopFixMutation = trpc.vulnerabilities.stopFixVulnerability.useMutation({
    onSuccess: () => {
      toast.success("Fix agent stopped.");
      utils.vulnerabilities.getVulnerabilities.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to stop fix agent");
    }
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<any>(null); // To store the Terminal instance
  const fitAddonInstance = useRef<any>(null); // To store the FitAddon instance

  // Terminal initialization and log writing
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let initialized = false;

    if (pollingVulnId && terminalRef.current) {
      if (!xtermInstance.current) {
        // Initialize terminal (dynamic import to avoid SSR issues)
        Promise.all([
          import("xterm"),
          import("xterm-addon-fit")
        ]).then(([{ Terminal }, { FitAddon }]) => {
          if (!terminalRef.current) return; // Unmounted before loaded
          
          const term = new Terminal({
            theme: {
              background: '#0a0a0a',
              foreground: '#4ade80', // green-400
              cursor: '#4ade80',
            },
            fontFamily: 'monospace',
            fontSize: 12,
            disableStdin: true,
            cursorBlink: !pollingVuln?.isFixed && activeTab !== 'fixed',
            convertEol: true,
          });

          const fitAddon = new FitAddon();
          term.loadAddon(fitAddon);
          term.open(terminalRef.current);
          fitAddon.fit();

          xtermInstance.current = term;
          fitAddonInstance.current = fitAddon;
          initialized = true;

          // Write initial buffer if any
          const initialLog = pollingVuln?.fixLogBuffer || (activeTab === 'fixed' ? "No logs available.\n" : "Initializing automated repair agent...\nConnecting to target...\n");
          term.write(initialLog);

          // Handle Resize
          resizeObserver = new ResizeObserver(() => {
             fitAddon.fit();
          });
          resizeObserver.observe(terminalRef.current);
        });
      }
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [pollingVulnId]);

  // Terminal buffer watcher
  useEffect(() => {
    if (xtermInstance.current && pollingVuln?.fixLogBuffer) {
      // Clear the terminal and write the entire buffer when polled
      // In a real optimized system we would only write the delta, 
      // but polling returns the whole string.
      xtermInstance.current.clear();
      xtermInstance.current.write(pollingVuln.fixLogBuffer);
      
      // Update cursor blink state based on completion
      xtermInstance.current.options.cursorBlink = !pollingVuln.isFixed && activeTab !== 'fixed';
    }
  }, [pollingVuln?.fixLogBuffer, pollingVuln?.isFixed, activeTab]);

  const handleFixNow = (vulnId: string) => {
    setPollingVulnId(vulnId);
    fixVulnMutation.mutate({ id: vulnId });
  };

  const handleStopFix = (vulnId: string) => {
    stopFixMutation.mutate({ id: vulnId });
  };

  const closeDialog = () => {
    setPollingVulnId(null);
    if (xtermInstance.current) {
      xtermInstance.current.dispose();
      xtermInstance.current = null;
      fitAddonInstance.current = null;
    }
    utils.vulnerabilities.getVulnerabilities.invalidate();
  };

  const currentTabIsLoading = activeTab === "unfixed" ? isLoadingUnfixed : isLoadingFixed;
  const currentData = activeTab === "unfixed" ? unfixedData : fixedData;
  const currentPage = activeTab === "unfixed" ? unfixedPage : fixedPage;
  const setCurrentPage = activeTab === "unfixed" ? setUnfixedPage : setFixedPage;
  const currentSearchInput = activeTab === "unfixed" ? unfixedSearchInput : fixedSearchInput;
  const setCurrentSearchInput = activeTab === "unfixed" ? setUnfixedSearchInput : setFixedSearchInput;
  const triggerSearch = () => {
    if (activeTab === "unfixed") {
      setUnfixedSearch(unfixedSearchInput);
      setUnfixedPage(1);
    } else {
      setFixedSearch(fixedSearchInput);
      setFixedPage(1);
    }
  };

  const currentSeverity = activeTab === "unfixed" ? unfixedSeverity : fixedSeverity;
  const setCurrentSeverity = (val: string) => {
    if (activeTab === "unfixed") {
      setUnfixedSeverity(val);
      setUnfixedPage(1);
    } else {
      setFixedSeverity(val);
      setFixedPage(1);
    }
  };

  const currentSortBy = activeTab === "unfixed" ? unfixedSortBy : fixedSortBy;
  const setCurrentSortBy = (val: any) => {
    if (activeTab === "unfixed") {
      setUnfixedSortBy(val);
      setUnfixedPage(1);
    } else {
      setFixedSortBy(val);
      setFixedPage(1);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl p-6 text-foreground font-mono mx-auto">
      <div className="flex flex-col border-b border-red-900/30 pb-6">
        <h2 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-3 text-red-500">
          <ShieldAlert className="w-8 h-8" />
          Realtime Vulnerabilities
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Live streaming vulnerability reports from orchestrated sub-agents and automated fix deployment.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveTab("unfixed")}
          className={`px-4 py-2 font-bold uppercase tracking-wider text-sm transition-colors border-b-2 ${
            activeTab === "unfixed" ? "border-red-500 text-red-500" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Threats
        </button>
        <button
          onClick={() => setActiveTab("fixed")}
          className={`px-4 py-2 font-bold uppercase tracking-wider text-sm transition-colors border-b-2 ${
            activeTab === "fixed" ? "border-green-500 text-green-500" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Patched Integrations
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded border border-red-900/20">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search vulnerabilities..."
              value={currentSearchInput}
              onChange={(e) => setCurrentSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
              className="bg-background border border-red-900/40 rounded pl-9 pr-4 py-2 w-full text-sm text-foreground focus:outline-none focus:border-red-500 transition-colors placeholder:text-muted-foreground/50"
            />
          </div>
          <button onClick={triggerSearch} className="bg-red-950/20 hover:bg-red-900/40 border border-red-900/40 text-red-400 px-3 py-2 rounded transition-colors">
            Search
          </button>
        </div>

        <div className="flex gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              title="Severity"
              value={currentSeverity}
              onChange={(e) => setCurrentSeverity(e.target.value)}
              className="bg-background border border-red-900/40 rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-red-500 appearance-none"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <SortDesc className="w-4 h-4 text-muted-foreground" />
            <select
              title="Sort By"
              value={currentSortBy}
              onChange={(e) => setCurrentSortBy(e.target.value as any)}
              className="bg-background border border-red-900/40 rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-red-500 appearance-none"
            >
              <option value="createdAt">Date Discovered</option>
              <option value="severity">Severity</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {currentTabIsLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="w-10 h-10 animate-spin text-red-600" />
          </div>
        ) : currentData?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 border border-dashed border-red-900/30 rounded-lg bg-red-950/5 text-center gap-4">
            <BoxIcon className="w-12 h-12 text-red-900/60" />
            <h3 className="text-xl font-bold uppercase text-foreground/90">No Vulnerabilities Found</h3>
            <p className="text-muted-foreground text-sm max-w-md">No records matching the current filters.</p>
          </div>
        ) : (
          <div className="border border-red-900/30 rounded-lg overflow-hidden bg-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-red-950/20 border-b border-red-900/30">
                  <th className="p-4 font-bold uppercase text-xs text-red-500 tracking-wider">Vulnerability</th>
                  <th className="p-4 font-bold uppercase text-xs text-red-500 tracking-wider">Severity</th>
                  <th className="p-4 font-bold uppercase text-xs text-red-500 tracking-wider">Discovered</th>
                  <th className="p-4 font-bold uppercase text-xs text-red-500 tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-900/10">
                {currentData?.items.map((vuln) => (
                  <tr key={vuln.id} className="hover:bg-red-950/10 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-sm text-foreground/90">{vuln.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 max-w-lg truncate" title={vuln.description || ""}>{vuln.description}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 uppercase">VULN-ID: {vuln.vulnId}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${
                        vuln.severity?.toLowerCase() === 'critical' ? 'bg-red-950/50 border-red-500/50 text-red-400' :
                        vuln.severity?.toLowerCase() === 'high' ? 'bg-orange-950/50 border-orange-500/50 text-orange-400' :
                        vuln.severity?.toLowerCase() === 'medium' ? 'bg-yellow-950/50 border-yellow-500/50 text-yellow-400' :
                        'bg-blue-950/50 border-blue-500/50 text-blue-400'
                      }`}>
                        {vuln.severity}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(vuln.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {activeTab === "unfixed" ? (
                        <div className="flex justify-end gap-2">
                          {vuln.status === "fixing" ? (
                            <button
                              onClick={() => setPollingVulnId(vuln.id)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded shadow-[0_0_10px_rgba(255,200,0,0.2)] hover:shadow-[0_0_15px_rgba(255,200,0,0.4)] transition-all flex items-center gap-2"
                            >
                              <TerminalSquare className="w-3 h-3" /> View Progress
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFixNow(vuln.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded shadow-[0_0_10px_rgba(255,0,0,0.2)] hover:shadow-[0_0_15px_rgba(255,0,0,0.4)] transition-all flex items-center gap-2"
                            >
                              <TerminalSquare className="w-3 h-3" /> Fix Now
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setPollingVulnId(vuln.id)}
                          className="bg-green-600/20 hover:bg-green-600/40 border border-green-600/50 text-green-400 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition-all flex items-center gap-2 ml-auto"
                        >
                          <ShieldCheck className="w-3 h-3" /> View Logs
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {currentData && currentData.totalPages > 1 && (
               <div className="flex items-center justify-between p-4 border-t border-red-900/30 bg-background/50">
                 <span className="text-xs text-muted-foreground uppercase">
                   Page {currentPage} of {currentData.totalPages}
                 </span>
                 <div className="flex items-center gap-2">
                   <button
                     disabled={currentPage === 1}
                     onClick={() => setCurrentPage(currentPage - 1)}
                     className="px-3 py-1 bg-red-950/20 hover:bg-red-900/40 border border-red-900/40 text-red-400 text-xs font-bold uppercase rounded disabled:opacity-50 transition-colors"
                   >
                     Prev
                   </button>
                   <button
                     disabled={currentPage === currentData.totalPages}
                     onClick={() => setCurrentPage(currentPage + 1)}
                     className="px-3 py-1 bg-red-950/20 hover:bg-red-900/40 border border-red-900/40 text-red-400 text-xs font-bold uppercase rounded disabled:opacity-50 transition-colors"
                   >
                     Next
                   </button>
                 </div>
               </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!pollingVulnId} onOpenChange={(open) => {
        if (!open) closeDialog();
      }}>
        <DialogContent className={`sm:max-w-3xl bg-card border ${activeTab === 'fixed' || pollingVuln?.isFixed ? 'border-green-900/50 shadow-green-900/20' : 'border-red-900/50 shadow-red-900/20'} text-foreground font-mono rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex flex-col h-[70vh] gap-4">
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className={`text-xl font-bold uppercase tracking-tight ${activeTab === 'fixed' || pollingVuln?.isFixed ? 'text-green-500' : 'text-red-500'} flex items-center gap-2`}>
                      <TerminalSquare className="w-5 h-5" />
                      {activeTab === 'fixed' ? 'Patch Report' : 'Automated Fix Agent'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground mt-1">
                      Status: <span className={`${activeTab === 'fixed' || pollingVuln?.isFixed ? 'text-green-400' : 'text-red-400'} font-bold uppercase tracking-widest`}>
                        {activeTab === 'fixed' ? 'PATCHED' : pollingVuln?.isFixed ? 'COMPLETED' : pollingVuln?.status ? pollingVuln.status.toUpperCase() : 'IN_PROGRESS'}
                      </span>
                    </DialogDescription>
                  </div>
                  <button
                    onClick={closeDialog}
                    className="text-muted-foreground hover:text-foreground transition-colors p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </DialogHeader>

              <div className="flex-1 bg-black rounded-lg border border-red-900/30 font-mono text-xs overflow-hidden p-2 text-green-400 shadow-inner flex flex-col relative">
                <div ref={terminalRef} className="absolute inset-2" />
              </div>

              {(activeTab === 'fixed' || pollingVuln?.isFixed) && pollingVuln?.fixAgentReport && (
                <div className="bg-background border border-green-900/30 rounded-lg p-4 mt-2">
                  <h4 className="text-green-500 font-bold uppercase text-xs mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Agent Report</h4>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{pollingVuln.fixAgentReport}</p>
                </div>
              )}

              <div className="flex justify-end mt-2 gap-4">
                {(activeTab === 'unfixed' && pollingVuln?.status === "fixing" && !pollingVuln?.isFixed) && (
                  <button
                    onClick={() => handleStopFix(pollingVulnId!)}
                    disabled={stopFixMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold tracking-widest px-6 py-2 rounded flex items-center gap-2 transition-all uppercase text-sm disabled:opacity-50"
                  >
                    Stop Fix
                  </button>
                )}
                <button
                  onClick={closeDialog}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest px-6 py-2 rounded flex items-center gap-2 transition-all uppercase text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
