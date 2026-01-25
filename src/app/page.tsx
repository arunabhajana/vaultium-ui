"use client";

import { motion } from "framer-motion";
import { ArrowRight, Wallet } from "lucide-react";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { useWallet } from "@/context/WalletContext";

export default function Home() {
  const { connectWallet } = useWallet();

  return (
    <main className="min-h-screen flex flex-col items-center relative overflow-hidden bg-background text-foreground">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vault-cyan/20 rounded-full blur-[120px] animate-[float_10s_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-vault-violet/20 rounded-full blur-[120px] animate-[float_12s_infinite_reverse]" />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 z-10 flex flex-col items-center text-center min-h-screen justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 relative"
        >
          <div className="absolute -inset-4 bg-vault-cyan/20 blur-xl opacity-50 rounded-full" />
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/50 relative z-10 font-heading">
            VAULTIUM
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-xl md:text-2xl text-white/60 mb-8 max-w-2xl font-light"
        >
          Zero-Trust. Auditable. <span className="text-vault-cyan font-medium">Decentralized.</span>
          <br />
          The future of secure layer-2 storage.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <button
            onClick={connectWallet}
            className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full flex items-center gap-2 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.7)] transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              Connect Wallet <Wallet size={18} />
            </span>
          </button>

          <button className="px-8 py-4 glass-panel rounded-full text-white/80 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2">
            View Audit Proofs <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <BentoGrid />

      {/* Footer */}
      <footer className="w-full py-12 border-t border-white/5 mt-24 z-10 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 text-center text-white/40 text-sm">
          <p>&copy; 2024 Vaultium Decentralized Storage. All rights reserved.</p>
        </div>
      </footer>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none fixed" />
    </main>
  );
}
