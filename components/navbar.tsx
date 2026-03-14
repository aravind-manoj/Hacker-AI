import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-red-500/20 bg-[#050505]/80 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/logo_black.svg"
                        alt="Hacker.AI Logo"
                        width={220}
                        height={49}
                        priority
                        className="h-auto w-[220px] dark:hidden"
                    />
                    <Image
                        src="/logo.svg"
                        alt="Hacker.AI Logo"
                        width={220}
                        height={49}
                        priority
                        className="hidden h-auto w-[220px] dark:block"
                    />
                </Link>
                <div className="hidden md:flex items-center gap-6 font-mono text-sm text-gray-400">
                    <Link href="#features" className="hover:text-red-500 transition-colors">Features</Link>
                    <Link href="#how-it-works" className="hover:text-red-500 transition-colors">Architecture</Link>
                    <Link href="/login" className="px-4 py-2 text-gray-400 hover:text-white transition-colors ml-4">
                        Login
                    </Link>
                    <Link href="/register" className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300">
                        Register
                    </Link>
                </div>
            </div>
        </nav>
    );
}
