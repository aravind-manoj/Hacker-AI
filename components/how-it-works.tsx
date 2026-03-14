import { ServerCog, Network, Bot, RefreshCcw } from "lucide-react";

export default function HowItWorks() {
    const steps = [
        {
            num: "01",
            title: "Task Ingestion",
            description: "Inngest captures the initial objective, formatting it for asynchronous processing.",
            icon: <ServerCog className="w-6 h-6 text-red-500" />
        },
        {
            num: "02",
            title: "Queue & Broker",
            description: "Task is passed to Celery workers via RabbitMQ for high-throughput scaling.",
            icon: <Network className="w-6 h-6 text-red-500" />
        },
        {
            num: "03",
            title: "Main AI Orchestration",
            description: "The core AI intelligently decides the strategy, spawning isolated Docker containers for sub-agents.",
            icon: <Bot className="w-6 h-6 text-red-500" />
        },
        {
            num: "04",
            title: "Feedback Loop",
            description: "Sub-agents install necessary tools, execute, and report back. The loop continues until the objective is met.",
            icon: <RefreshCcw className="w-6 h-6 text-red-500" />
        }
    ];

    return (
        <section id="how-it-works" className="py-24 relative bg-gray-50 dark:bg-[#0a0a0a] border-y border-gray-200 dark:border-red-900/30">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold font-mono text-white mb-4 uppercase">
                        Execution <span className="text-red-600">Pipeline</span>
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-900 mx-auto" />
                </div>

                <div className="grid md:grid-cols-4 gap-8 relative">
                    <div className="hidden md:block absolute top-[5rem] left-[12%] right-[12%] h-0.5 bg-red-900/30">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-red-600 to-transparent animate-pulse" />
                    </div>

                    {steps.map((step, idx) => (
                        <div key={idx} className="relative group text-center z-10">
                            <div className="w-24 h-24 mx-auto bg-white dark:bg-[#050505] border border-gray-300 dark:border-red-900/50 rounded-full flex items-center justify-center mb-6 relative group-hover:border-red-500/50 group-hover:shadow-[0_0_30px_rgba(255,0,0,0.2)] transition-all duration-300">
                                <span className="absolute -top-3 -right-3 text-sm font-mono text-red-600 font-bold bg-white dark:bg-[#050505] px-2">
                                    {step.num}
                                </span>
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white font-mono uppercase tracking-tight mb-2">
                                {step.title}
                            </h3>
                            <p className="text-sm text-gray-400 font-mono leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
