"use client";

import { useWallet } from "@/context/WalletContext";
import { motion } from "framer-motion";
import { Key, Shield, RefreshCw, Smartphone, Globe, Lock, ToggleLeft, ToggleRight, UploadCloud } from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";

export default function Settings() {
    const { account } = useWallet();
    const [zkEnabled, setZkEnabled] = useState(true);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold font-heading mb-2">Settings & Security</h1>
                <p className="text-white/60">Manage your encryption keys and security preferences.</p>
            </motion.div>

            {/* Account Overview */}
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-vault-cyan" /> Account Overview
                </h2>
                <div className="glass-panel p-6 rounded-3xl">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-sm text-white/50 mb-1">Connected Wallet Address</p>
                            <p className="font-mono font-bold text-lg md:text-xl text-white/90 break-all">
                                {account || "Not Connected"}
                            </p>
                        </div>
                        <div className="px-4 py-2 bg-vault-violet/20 text-vault-violet rounded-full text-sm font-bold border border-vault-violet/30">
                            Polygon Mainnet
                        </div>
                    </div>
                </div>
            </section>

            {/* Secret Key Shards */}
            <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Key size={20} className="text-vault-violet" /> Secret Key Shards
                    </h2>
                    <button className="text-sm text-white/60 hover:text-white flex items-center gap-1 transition-colors">
                        <RefreshCw size={14} /> Regenerate Keys
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((shard) => (
                        <motion.div
                            key={shard}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: shard * 0.1 }}
                            className="aspect-square glass-card rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/5 hover:border-vault-violet/50 hover:bg-vault-violet/5 transition-all cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-vault-violet group-hover:text-white transition-colors">
                                <span className="font-mono font-bold">{shard}</span>
                            </div>
                            <span className="text-xs text-white/40 font-mono">SHARD-{shard}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-vault-emerald shadow-[0_0_5px_lime]" />
                        </motion.div>
                    ))}
                </div>
                <p className="mt-4 text-sm text-white/40">
                    Your master key is split into 5 shards distributed across the decentralized network.
                    You need 3 shards to reconstruct your key.
                </p>
            </section>

            {/* Upload Settings */}
            <ChunkSizeSettings />

            {/* Security Preferences */}
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-vault-emerald" /> Security Preferences
                </h2>
                <div className="glass-panel p-1 rounded-3xl">
                    <div className="flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/5 transition-colors rounded-t-3xl cursor-pointer" onClick={() => setZkEnabled(!zkEnabled)}>
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-vault-emerald/10 text-vault-emerald rounded-lg">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold">Zero-Knowledge Proofs</h3>
                                <p className="text-sm text-white/50">Enable ZK-SNARKs for private ownership verification</p>
                            </div>
                        </div>
                        <button className={clsx("transition-colors", zkEnabled ? "text-vault-emerald" : "text-white/20")}>
                            {zkEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors rounded-b-3xl">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/10 text-white rounded-lg">
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold">2-Factor Authentication</h3>
                                <p className="text-sm text-white/50">Require signature for specialized actions</p>
                            </div>
                        </div>
                        <button className="text-white/20 hover:text-white transition-colors">
                            <ToggleLeft size={32} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

function ChunkSizeSettings() {
    const [chunkSize, setChunkSize] = useState<number>(1048576);

    useEffect(() => {
        const saved = localStorage.getItem("vaultium_chunk_size");
        if (saved) setChunkSize(parseInt(saved));
        else {
            const defaultSize = parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHUNK_SIZE || "1048576");
            setChunkSize(defaultSize);
        }
    }, []);

    const handleSave = (size: number) => {
        setChunkSize(size);
        localStorage.setItem("vaultium_chunk_size", size.toString());
    };

    const formatSize = (bytes: number) => {
        return (bytes / (1024 * 1024)) + " MB";
    };

    return (
        <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <UploadCloud size={20} className="text-vault-cyan" /> Parallel Upload Settings
            </h2>
            <div className="glass-panel p-6 rounded-3xl">
                <div className="mb-4">
                    <h3 className="font-bold mb-1">Chunk Size</h3>
                    <p className="text-sm text-white/50">Larger chunks = fewer requests but higher memory usage.</p>
                </div>

                <div className="flex gap-4">
                    {[1048576, 2097152, 5242880].map((size) => (
                        <button
                            key={size}
                            onClick={() => handleSave(size)}
                            className={clsx(
                                "px-6 py-3 rounded-xl font-bold transition-all border",
                                chunkSize === size
                                    ? "bg-vault-cyan/20 text-vault-cyan border-vault-cyan/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                    : "bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {formatSize(size)}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
