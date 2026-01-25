"use client";

import { motion } from "framer-motion";
import { FileText, Clock, Trash2, Eye, Share2, MoreVertical } from "lucide-react";
import clsx from "clsx";

const sharedFiles = [
    { name: "Q4_Investor_Deck.pdf", size: "14.2 MB", sharedBy: "Vitalik B.", access: "Read Only", expiry: "24h left", type: "pdf" },
    { name: "Mainnet_Keys_Backup.enc", size: "2.1 KB", sharedBy: "Satoshi N.", access: "Write", expiry: "Permanent", type: "enc" },
    { name: "Frontend_Assets.zip", size: "142 MB", sharedBy: "Design Team", access: "Read Only", expiry: "7 days left", type: "zip" },
    { name: "Legal_Contracts_v1.docx", size: "450 KB", sharedBy: "Legal", access: "Read/Write", expiry: "30 days left", type: "doc" },
];

export default function Shared() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex justify-between items-center"
            >
                <div>
                    <h1 className="text-3xl font-bold font-heading mb-2">Shared With Me</h1>
                    <p className="text-white/60">Manage file access and permissions.</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-sm text-white/50">
                    <Share2 size={16} /> Incoming Shares
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedFiles.map((file, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-card p-6 rounded-2xl group hover:bg-white/10 transition-colors relative"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-105 transition-transform duration-300">
                                <FileText size={32} className="text-vault-violet" />
                            </div>
                            <button className="text-white/20 hover:text-white transition-colors">
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        <h3 className="font-bold text-lg mb-1 truncate">{file.name}</h3>
                        <p className="text-white/50 text-sm mb-4">{file.size} • Shared by {file.sharedBy}</p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className={clsx(
                                "px-2 py-1 rounded-md text-xs font-semibold border",
                                file.access.includes("Write")
                                    ? "bg-vault-cyan/10 text-vault-cyan border-vault-cyan/20"
                                    : "bg-white/5 text-white/60 border-white/10"
                            )}>
                                {file.access}
                            </span>
                            <span className="px-2 py-1 rounded-md text-xs font-semibold bg-white/5 text-white/40 border border-white/10 flex items-center gap-1">
                                <Clock size={10} /> {file.expiry}
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                                <Eye size={16} /> View
                            </button>
                            <button className="px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
