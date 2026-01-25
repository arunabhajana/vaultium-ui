"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Search, CheckCircle, Database, GitCommit } from "lucide-react";
import clsx from "clsx";

export default function Audit() {
    const [cid, setCid] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cid) return;

        setIsVerifying(true);
        setIsVerified(false);

        // Mock verification delay
        setTimeout(() => {
            setIsVerifying(false);
            setIsVerified(true);
        }, 2500);
    };

    return (
        <div className="container mx-auto px-4 py-16 max-w-3xl">
            <div className="text-center mb-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-20 h-20 bg-vault-emerald/10 rounded-full flex items-center justify-center mx-auto mb-6 text-vault-emerald"
                >
                    <ShieldCheck size={40} />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold font-heading mb-4"
                >
                    Proof & Audit
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/60 text-lg"
                >
                    Cryptographically verify the integrity and existence of any file on Vaultium.
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel p-8 rounded-3xl mb-12"
            >
                <form onSubmit={handleVerify} className="relative">
                    <div className="relative flex items-center">
                        <Search className="absolute left-4 text-white/30" size={20} />
                        <input
                            type="text"
                            placeholder="Enter File CID (e.g., Qjm...)"
                            value={cid}
                            onChange={(e) => setCid(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-32 text-white placeholder:text-white/20 focus:outline-none focus:border-vault-cyan/50 focus:ring-1 focus:ring-vault-cyan/50 transition-all font-mono"
                        />
                        <button
                            type="submit"
                            disabled={isVerifying || !cid}
                            className={clsx(
                                "absolute right-2 px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2",
                                isVerifying
                                    ? "bg-white/10 text-white/50 cursor-not-allowed"
                                    : "bg-vault-emerald text-black hover:shadow-[0_0_20px_rgba(0,255,157,0.4)]"
                            )}
                        >
                            {isVerifying ? "Verifying..." : "Verify Proof"}
                        </button>
                    </div>
                </form>

                <AnimatePresence>
                    {isVerified && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <div className="flex items-center gap-3 text-vault-emerald mb-6 bg-vault-emerald/10 p-4 rounded-xl border border-vault-emerald/20">
                                    <div className="p-1 bg-vault-emerald rounded-full">
                                        <CheckCircle size={16} className="text-black" />
                                    </div>
                                    <span className="font-bold">Merkle Proof Verified Successfully</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="glass-card p-4 rounded-xl">
                                        <p className="text-xs text-white/40 uppercase font-bold mb-2 flex items-center gap-2">
                                            <Database size={12} /> Merkle Root (On-Chain)
                                        </p>
                                        <p className="font-mono text-xs text-white/80 break-all">
                                            0x71c480df93d63...92a1b32d3e
                                        </p>
                                    </div>
                                    <div className="glass-card p-4 rounded-xl">
                                        <p className="text-xs text-white/40 uppercase font-bold mb-2 flex items-center gap-2">
                                            <GitCommit size={12} /> Transaction Hash
                                        </p>
                                        <p className="font-mono text-xs text-white/80 break-all">
                                            0x89a...2b1c
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
