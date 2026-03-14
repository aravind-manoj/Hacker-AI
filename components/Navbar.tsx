import { Terminal } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-red-500/20 bg-[#050505]/80 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-6 h-6 text-red-600 animate-pulse" />
                    <span className="text-white font-mono font-bold tracking-tight text-xl">
                        Hacker<span className="text-red-600">.AI</span>
                    </span>
                </div>
                <div className="hidden md:flex items-center gap-6 font-mono text-sm text-gray-400">
                    <Link href="#features" className="hover:text-red-500 transition-colors">Features</Link>
                    <Link href="#how-it-works" className="hover:text-red-500 transition-colors">Architecture</Link>
                    <button className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 ml-4">
                        Initialize
                    </button>
                </div>
            </div>
        </nav>
    );
}
