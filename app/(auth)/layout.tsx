import Link from "next/link";
import { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-600 selection:text-white flex flex-col font-mono relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/30 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>
      
      {/* Simple header for auth pages */}
      <div className="absolute top-0 w-full z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity w-fit cursor-pointer">
          <Image src="/logo.svg" alt="Hacker.AI Logo" width={240} height={43} priority className="w-[240px] h-auto" />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 z-10 mt-16">
        {children}
      </div>
    </div>
  );
}
