import Navbar from "@/components/navbar";
import {
    Shield,
    Cpu,
    Zap,
    Radar,
    Activity,
    ServerCog,
    Network,
    Bot,
    RefreshCcw,
    Terminal,
    Lock,
    Globe,
    Layers,
    FastForward,
    ShieldCheck,
    Sparkles,
    Swords
} from "lucide-react";

export default function DocsPage() {
    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-red-600 selection:text-white font-mono">
            <Navbar />

            {/* Hero Section */}
            <div className="pt-32 pb-16 relative overflow-hidden border-b border-red-900/30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.1)_0%,transparent_70%)]" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded border border-red-900/40 bg-red-950/20">
                            <Terminal className="w-5 h-5 text-red-500" />
                        </div>
                        <span className="text-red-500 font-bold tracking-widest uppercase text-sm">Documentation_v2.4.1</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-6">
                        Technical <span className="text-red-600">Specifications</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl leading-relaxed">
                        In-depth guide to the Hacker.AI autonomous agentic penetration testing framework.
                        Understand the architecture, sub-agent orchestration, and the feedback loops that power our offensive security engine.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-16 grid lg:grid-cols-[250px_1fr] gap-12">
                {/* Sidebar Navigation */}
                <aside className="hidden lg:block">
                    <div className="sticky top-24 space-y-8">
                        <div>
                            <h3 className="text-red-500 font-bold uppercase text-xs tracking-widest mb-4">Core Concepts</h3>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="#overview" className="hover:text-red-500 transition-colors">Project Overview</a></li>
                                <li><a href="#features" className="hover:text-red-500 transition-colors">Key Features</a></li>
                                <li><a href="#solution" className="hover:text-red-500 transition-colors">The Solution</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-red-500 font-bold uppercase text-xs tracking-widest mb-4">Architecture</h3>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li><a href="#pipeline-pentest" className="hover:text-red-500 transition-colors">Pentester Workflow</a></li>
                                <li><a href="#pipeline-soc" className="hover:text-red-500 transition-colors">Smart SOC Workflow</a></li>
                                <li><a href="#sandboxing" className="hover:text-red-500 transition-colors">Docker Sandboxing</a></li>
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Content */}
                <div className="space-y-24 max-w-4xl">
                    {/* Project Overview */}
                    <section id="overview" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold uppercase flex items-center gap-3 mb-8">
                            <Globe className="w-6 h-6 text-red-500" />
                            Project Overview
                        </h2>
                        <div className="glass-panel p-8 rounded-lg border border-red-900/30 bg-red-950/5">
                            <p className="text-gray-400 leading-relaxed mb-6">
                                Hacker.AI is a next-generation offensive security platform that leverages
                                <span className="text-white"> Autonomous Agentic AI</span> to provide a continuous security model.
                                By combining aggressive <span className="text-red-500">Autonomous Pentesting</span> with proactive
                                <span className="text-red-500"> Intelligent Defense</span> (Smart SOC), Hacker.AI bridges the gap between
                                vulnerability discovery and tactical remediation.
                            </p>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-4 border border-red-900/20 bg-black/40 rounded">
                                    <h4 className="text-white font-bold mb-2 uppercase text-xs text-red-500">Active Reconnaissance</h4>
                                    <p className="text-xs text-gray-500">Autonomous agents map infrastructure, identify unpatched services, and find 0-day chains using real-time reasoning.</p>
                                </div>
                                <div className="p-4 border border-red-900/20 bg-black/40 rounded">
                                    <h4 className="text-white font-bold mb-2 uppercase text-xs text-red-500">Proactive Defense</h4>
                                    <p className="text-xs text-gray-500">The Smart SOC agent installs itself within targets to monitor, report, and autonomously patch vulnerabilities.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features */}
                    <section id="features" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold uppercase flex items-center gap-3 mb-8">
                            <Zap className="w-6 h-6 text-red-500" />
                            Key Features
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                {
                                    title: "AI Pentester",
                                    desc: "Autonomous Main AI Agent that orchestrates offensive strategies. It intelligently chooses the right tools (Nmap, Metasploit, etc.) and spawns isolated sub-agents to meet security objectives.",
                                    icon: <Swords className="w-5 h-5" />
                                },
                                {
                                    title: "Vulnerability Scanning",
                                    desc: "Deep inspection across network layers, identifying misconfigurations and unpatched services.",
                                    icon: <Radar className="w-5 h-5" />
                                },
                                {
                                    title: "Anomaly Detection",
                                    desc: "Real-time monitoring of agent behavior to ensure safe execution within target boundaries.",
                                    icon: <Activity className="w-5 h-5" />
                                },
                                {
                                    title: "isolated Execution",
                                    desc: "Every sub-agent runs in a unique, ephemeral Docker container to prevent environment pollution.",
                                    icon: <Lock className="w-5 h-5" />
                                },
                                {
                                    title: "Async Orchestration",
                                    desc: "Powered by RabbitMQ and Celery for massive parallelization of offensive tasks.",
                                    icon: <Layers className="w-5 h-5" />
                                },
                                {
                                    title: "Smart SOC",
                                    desc: "Hacker.AI agent analysis the server and then automatically installs itself in the server through ssh then in a periodc time it initiates the scan then the vulnerabilities found are reported in the dashbaord and then when the user clicks fix now button the agent inside the server patches the vulnerabilty by itlself.",
                                    icon: <ShieldCheck className="w-5 h-5" />
                                },
                                {
                                    title: "Contextual Awareness",
                                    desc: "Users add company context in the dedicated Context Dashboard, which our agents utilize to gain deep insight into the infrastructure and systems for strategic engagement.",
                                    icon: <Sparkles className="w-5 h-5" />
                                }
                            ].map((f, i) => (
                                <div key={i} className="p-6 border border-red-900/20 bg-[#0a0a0a] rounded-md hover:border-red-500/30 transition-colors">
                                    <div className="text-red-500 mb-4">{f.icon}</div>
                                    <h4 className="text-white font-bold uppercase text-sm mb-2">{f.title}</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Pentester Pipeline */}
                    <section id="pipeline-pentest" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold uppercase flex items-center gap-3 mb-8">
                            <Swords className="w-6 h-6 text-red-500" />
                            AI Pentester Pipeline
                        </h2>
                        <div className="relative space-y-12 pl-4">
                            {[
                                {
                                    title: "Objective Ingestion",
                                    desc: "Inngest captures the high-level security goal and dispatches a JSON event to the RabbitMQ broker.",
                                    icon: <Terminal className="w-8 h-8" />
                                },
                                {
                                    title: "Tactical Reasoning",
                                    desc: "The Master Agent (LLM) analyzes the target and company context to formulate a multi-step offensive strategy.",
                                    icon: <Bot className="w-8 h-8" />
                                },
                                {
                                    title: "Docker Swarming",
                                    desc: "Isolated sub-agents are spawned in ephemeral Docker containers to execute specific tasks (Nmap, SQLMap, etc.).",
                                    icon: <Layers className="w-8 h-8" />
                                },
                                {
                                    title: "Exploitation Loop",
                                    desc: "Real-time feedback from sub-agents allows the Master Agent to pivot, escalate privileges, and repeat the loop until the objective is met.",
                                    icon: <RefreshCcw className="w-8 h-8" />
                                }
                            ].map((s, i) => (
                                <div key={i} className="flex gap-6 relative">
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full border border-red-900 bg-red-950/20 flex items-center justify-center text-red-500 z-10">
                                            {s.icon}
                                        </div>
                                        {i !== 3 && <div className="w-0.5 h-full bg-red-900/20 mt-2" />}
                                    </div>
                                    <div className="pb-12">
                                        <h4 className="text-white font-bold uppercase mb-2">{s.title}</h4>
                                        <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Smart SOC Pipeline */}
                    <section id="pipeline-soc" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold uppercase flex items-center gap-3 mb-8">
                            <ShieldCheck className="w-6 h-6 text-red-500" />
                            Smart SOC Workflow
                        </h2>
                        <div className="relative space-y-12 pl-4">
                            {[
                                {
                                    title: "SSH Discovery & Deployment",
                                    desc: "The agent analyzes server credentials and autonomously installs the Hacker.AI monitoring subsystem via SSH.",
                                    icon: <Network className="w-8 h-8" />
                                },
                                {
                                    title: "Continuous Auditing",
                                    desc: "The internal agent performs periodic scans of the local system, kernel, and active services to find drift or new vulnerabilities.",
                                    icon: <Radar className="w-8 h-8" />
                                },
                                {
                                    title: "Dashboard Reporting",
                                    desc: "Vulnerabilities are reported back to the central dashboard in real-time with detailed impact analysis.",
                                    icon: <Activity className="w-8 h-8" />
                                },
                                {
                                    title: "Autonomous Patching",
                                    desc: "Upon user approval ('Fix Now'), the agent executes precise remediation scripts inside the server to seal the vulnerability.",
                                    icon: <ServerCog className="w-8 h-8" />
                                }
                            ].map((s, i) => (
                                <div key={i} className="flex gap-6 relative">
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full border border-red-900 bg-red-950/20 flex items-center justify-center text-red-500 z-10">
                                            {s.icon}
                                        </div>
                                        {i !== 3 && <div className="w-0.5 h-full bg-red-900/20 mt-2" />}
                                    </div>
                                    <div className="pb-12">
                                        <h4 className="text-white font-bold uppercase mb-2">{s.title}</h4>
                                        <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* The Solution */}
                    <section id="solution" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold uppercase flex items-center gap-3 mb-8">
                            <Shield className="w-6 h-6 text-red-500" />
                            Our Solution: Close the Loop
                        </h2>
                        <div className="glass-panel p-8 rounded-lg border border-red-900/30 bg-red-950/5">
                            <p className="text-gray-400 mb-6">
                                Hacker.AI provides a unified ecosystem where discovery and remediation exist in a single feedback loop.
                                We enable security teams to transition from reactive patchwork to a predictive, autonomous posture.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex gap-3 items-start">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-600" />
                                    <div>
                                        <span className="text-white block font-bold text-xs uppercase">Find & Verify</span>
                                        <span className="text-gray-500 text-xs text-wrap">AI-driven exploitation proves the risk, eliminating false positives from traditional scanners.</span>
                                    </div>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-600" />
                                    <div>
                                        <span className="text-white block font-bold text-xs uppercase">Autonomous Remediation</span>
                                        <span className="text-gray-500 text-xs text-wrap">The Smart SOC agent patches vulnerabilities at the source, significantly reducing the Mean Time to Remediate (MTTR).</span>
                                    </div>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-600" />
                                    <div>
                                        <span className="text-white block font-bold text-xs uppercase">Continuous Orchestration</span>
                                        <span className="text-gray-500 text-xs text-wrap">Context-aware agents run 24/7, adapting to new infra changes without manual intervention.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </section>
                </div>
            </div>

            {/* CTA Footer */}
            <div className="py-24 border-t border-red-900/30 text-center">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold uppercase mb-8">Ready to <span className="text-red-600">Shield</span> Your Infrastructure?</h2>
                    <a href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(255,0,0,0.3)] uppercase tracking-widest text-sm">
                        Get Started
                        <FastForward className="w-5 h-5" />
                    </a>
                </div>
            </div>

            <footer className="py-8 border-t border-red-900/30 text-center text-sm font-mono text-gray-500">
                <p>&copy; {new Date().getFullYear()} Hacker.AI. All systems operational.</p>
            </footer>
        </main>
    );
}
