import { ChevronRight, ShieldAlert, Cpu } from "lucide-react";
import RedParticles from "./ui/RedParticles";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
            <RedParticles />

            <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col gap-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-500 text-sm font-mono w-fit">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        System Online. Awaiting Target.
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-white font-mono uppercase bg-clip-text">
                        Autonomous <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">
                            Agentic Penetration
                        </span> Testing
                    </h1>

                    <p className="text-lg text-gray-400 font-mono max-w-xl leading-relaxed">
                        Beyond linear automation. Orchestrate offensive security with LangChain-powered autonomous sub-agents and iterative feedback loops.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 font-mono">
                        <button className="flex items-center justify-center gap-2 px-8 py-4 bg-red-600 text-white font-bold hover:bg-red-700 hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-all duration-300">
                            Deploy Agent
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button className="flex items-center justify-center gap-2 px-8 py-4 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all duration-300">
                            Read Technical Specs
                        </button>
                    </div>
                </div>

                {/* Dashboard Mockup */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-lg blur opacity-30 animate-pulse"></div>
                    <div className="relative bg-[#0a0a0a] border border-red-900/50 rounded-lg shadow-2xl overflow-hidden font-mono text-sm h-[500px] flex flex-col">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-red-900/50 bg-[#050505]">
                            <div className="w-3 h-3 rounded-full bg-red-600/50" />
                            <div className="w-3 h-3 rounded-full bg-red-600/50" />
                            <div className="w-3 h-3 rounded-full bg-red-600/50" />
                            <span className="ml-4 text-xs text-red-500/70">hacker-ai_agent_console // v2.4.1</span>
                        </div>

                        <div className="p-4 flex-1 grid grid-rows-2 gap-4">
                            {/* Agent Logs */}
                            <div className="glass-panel p-4 rounded-md flex flex-col">
                                <div className="flex items-center justify-between mb-4 border-b border-red-900/30 pb-2">
                                    <div className="flex items-center gap-2 text-red-500">
                                        <Cpu className="w-4 h-4" />
                                        <span className="font-bold uppercase">Agent Logs</span>
                                    </div>
                                    <span className="text-xs text-red-500/50">LIVE</span>
                                </div>
                                <div className="flex-1 overflow-hidden space-y-2 text-xs text-gray-400">
                                    <div className="flex gap-2"><span className="text-red-600">[10:42:01]</span><span>Inngest Task received. Offloading to Celery/RabbitMQ...</span></div>
                                    <div className="flex gap-2"><span className="text-red-600">[10:42:05]</span><span>Main AI Agent initialized. Analyzing target...</span></div>
                                    <div className="flex gap-2"><span className="text-red-600">[10:42:15]</span><span>Spawning Docker sub-agent [Alpha] for recon.</span></div>
                                    <div className="flex gap-2"><span className="text-red-600">[10:42:22]</span><span className="text-white">Realtime Anomaly Detected: Port 443 scanning...</span></div>
                                    <div className="flex gap-2"><span className="text-red-600">[10:42:25]</span><span>Feedback loop active. Adjusting payload...</span></div>
                                </div>
                            </div>

                            {/* Payload Status */}
                            <div className="glass-panel p-4 rounded-md flex flex-col">
                                <div className="flex items-center justify-between mb-4 border-b border-red-900/30 pb-2">
                                    <div className="flex items-center gap-2 text-red-500">
                                        <ShieldAlert className="w-4 h-4" />
                                        <span className="font-bold uppercase">Payload Status</span>
                                    </div>
                                    <span className="text-xs text-red-500/50 text-right">ISOLATED THREAD</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-4">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1 text-gray-400">
                                            <span>Exploit Compilation</span>
                                            <span className="text-red-500">100%</span>
                                        </div>
                                        <div className="h-1 bg-red-900/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-600 w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1 text-gray-400">
                                            <span>Bypass Evaluation</span>
                                            <span className="text-red-500">84%</span>
                                        </div>
                                        <div className="h-1 bg-red-900/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-600 w-[84%] animate-pulse" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1 text-gray-400">
                                            <span>Docker Sandbox Integrity</span>
                                            <span className="text-red-500">SECURE</span>
                                        </div>
                                        <div className="h-1 bg-red-900/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-600 w-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
