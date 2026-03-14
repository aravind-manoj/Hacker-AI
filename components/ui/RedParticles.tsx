"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function RedParticles() {
    const [particles, setParticles] = useState<
        { id: number; x: number; y: number; size: number; delay: number; duration: number }[]
    >([]);

    useEffect(() => {
        const generates = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            delay: Math.random() * 5,
            duration: Math.random() * 10 + 10,
        }));
        setParticles(generates);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(69,10,10,0.1)_0%,rgba(5,5,5,1)_100%)]" />
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-red-600 shadow-[0_0_8px_rgba(255,0,0,0.8)]"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                    }}
                    animate={{
                        y: [`${p.y}%`, `${p.y - 20}%`, `${p.y}%`],
                        opacity: [0, 0.8, 0],
                        scale: [0, 1, 0],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear",
                    }}
                />
            ))}
        </div>
    );
}
