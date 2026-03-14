export default function Stats() {
    const stats = [
        { label: "Security Tools Integrated", target: "50", suffix: "+" },
        { label: "Concurrent Agent Tasks", target: "1000", suffix: "+" },
        { label: "Report Generation Speed", target: "95", suffix: "% Faster" }
    ];

    return (
        <section className="py-24 relative bg-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(69,10,10,0.15)_0%,transparent_70%)] pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-red-900/30">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-center text-center py-8 md:py-0">
                            <div className="text-5xl md:text-7xl font-bold text-white font-mono mb-2 flex items-baseline gap-1">
                                {stat.target}
                                <span className="text-red-600 text-2xl md:text-3xl">{stat.suffix}</span>
                            </div>
                            <h3 className="text-gray-400 font-mono tracking-widest uppercase text-sm md:text-base text-balance shadow-black drop-shadow-md">
                                {stat.label}
                            </h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
