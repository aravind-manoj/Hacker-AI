import { Bot, ShieldBan, Zap, Radar, Activity } from "lucide-react";

const features = [
    {
        title: "Vulnerability Scanning",
        description: "Continuous and deep scanning to identify zero-days, misconfigurations, and outdated components in real-time.",
        icon: <Radar className="w-8 h-8 text-red-500" />
    },
    {
        title: "Realtime Anomaly Detection",
        description: "Advanced ML models to monitor application behavior and instantly flag suspicious or unauthorized access patterns.",
        icon: <Activity className="w-8 h-8 text-red-500" />
    },
    {
        title: "Isolated Sub-Agent Execution",
        description: "The Main AI Agent provisions individual Docker containers, dynamically installing necessary tools for sub-agents.",
        icon: <ShieldBan className="w-8 h-8 text-red-500" />
    },
    {
        title: "Asynchronous Orchestration",
        description: "Inngest offloads tasks to Celery via RabbitMQ, ensuring zero-lag message brokering for the Master Agent loop.",
        icon: <Zap className="w-8 h-8 text-red-500" />
    }
];

export default function Features() {
    return (
        <section id="features" className="py-24 relative bg-[#050505] border-t border-red-900/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(69,10,10,0.2)_0%,transparent_50%)]" />
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold font-mono text-white mb-4 uppercase">
                        Core <span className="text-red-600">Infrastructure</span>
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-900 mx-auto" />
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="group glass-panel p-8 rounded-lg hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(255,0,0,0.15)] transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                {feature.icon}
                            </div>
                            <div className="w-16 h-16 rounded-full bg-red-950 flex items-center justify-center mb-6 border border-red-900/50 group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white font-mono mb-3 uppercase tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 font-mono text-sm leading-relaxed">
                                {feature.description}
                            </p>

                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-900 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
