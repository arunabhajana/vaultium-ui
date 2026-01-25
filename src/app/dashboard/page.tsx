"use client";

import { useWallet } from "@/context/WalletContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HardDrive, File, Activity, UploadCloud, ShieldCheck, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default function Dashboard() {
    const { account } = useWallet();
    const [files, setFiles] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [stats, setStats] = useState([
        { label: "Total Stored", value: "0 MB", icon: HardDrive, color: "text-vault-cyan", bg: "bg-vault-cyan/10" },
        { label: "Total Files", value: "0", icon: File, color: "text-vault-violet", bg: "bg-vault-violet/10" },
        { label: "Storage Health", value: "100%", icon: Activity, color: "text-vault-emerald", bg: "bg-vault-emerald/10" },
    ]);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const res = await fetch("/api/files");
                const data = await res.json();

                if (Array.isArray(data)) {
                    setFiles(data);

                    // Update Stats
                    const totalSize = data.reduce((acc, curr) => acc + curr.size, 0);
                    const formattedSize = (totalSize / (1024 * 1024)).toFixed(2) + " MB";

                    setStats([
                        { label: "Total Stored", value: formattedSize, icon: HardDrive, color: "text-vault-cyan", bg: "bg-vault-cyan/10" },
                        { label: "Total Files", value: data.length.toString(), icon: File, color: "text-vault-violet", bg: "bg-vault-violet/10" },
                        { label: "Storage Health", value: "100%", icon: Activity, color: "text-vault-emerald", bg: "bg-vault-emerald/10" },
                    ]);

                    // Update Recent Activity (Map files to activity format)
                    const activity = data.slice(0, 5).map(file => ({
                        action: `Uploaded '${file.name}'`,
                        time: new Date(file.uploadedAt).toLocaleString(),
                        status: "Success"
                    }));
                    setRecentActivity(activity);
                }
            } catch (error) {
                console.error("Failed to fetch files:", error);
            }
        };

        fetchFiles();
        // Poll every 5 seconds to keep updated without refresh
        const interval = setInterval(fetchFiles, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold font-heading mb-2">Dashboard</h1>
                <p className="text-white/60">Welcome back, {account ? `${account.substring(0, 6)}...${account.slice(-4)}` : "Guest"}</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-card p-6 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-colors"
                    >
                        <div>
                            <p className="text-white/50 text-sm mb-1">{stat.label}</p>
                            <h2 className="text-3xl font-bold font-heading">{stat.value}</h2>
                        </div>
                        <div className={clsx("p-4 rounded-xl", stat.bg, stat.color)}>
                            <stat.icon size={24} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 glass-panel p-8 rounded-3xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-vault-cyan/10 blur-[80px]" />
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <UploadCloud size={20} className="text-vault-cyan" /> Quick Actions
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                        <Link href="/vault" className="group glass-card p-6 rounded-2xl hover:bg-white/10 transition-all border border-white/5 hover:border-vault-cyan/30">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-vault-cyan/20 rounded-lg text-vault-cyan group-hover:scale-110 transition-transform">
                                    <UploadCloud size={24} />
                                </div>
                                <ArrowUpRight className="text-white/30 group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="font-bold text-lg mb-1">Upload Files</h4>
                            <p className="text-white/50 text-sm">Securely encrypt and shard data</p>
                        </Link>

                        <Link href="/audit" className="group glass-card p-6 rounded-2xl hover:bg-white/10 transition-all border border-white/5 hover:border-vault-violet/30">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-vault-violet/20 rounded-lg text-vault-violet group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={24} />
                                </div>
                                <ArrowUpRight className="text-white/30 group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="font-bold text-lg mb-1">Verify Proofs</h4>
                            <p className="text-white/50 text-sm">Check Merkle integrity</p>
                        </Link>
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-panel p-6 rounded-3xl"
                >
                    <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                            <p className="text-white/40 text-center py-4">No recent activity</p>
                        ) : (
                            recentActivity.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-vault-cyan shadow-[0_0_8px_cyan]" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{item.action}</p>
                                        <p className="text-xs text-white/40">{item.time}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
