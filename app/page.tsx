import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Stats from "@/components/Stats";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-red-600 selection:text-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />

      {/* Footer minimal */}
      <footer className="py-8 border-t border-red-900/30 text-center text-sm font-mono text-gray-500">
        <p>&copy; {new Date().getFullYear()} Hacker.AI. All systems operational.</p>
      </footer>
    </main>
  );
}
