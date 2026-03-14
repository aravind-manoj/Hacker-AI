import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Features from "@/components/features";
import HowItWorks from "@/components/how-it-works";
import Stats from "@/components/stats";

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
