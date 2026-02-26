"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Search, CheckCircle, Database, GitCommit, FileKey, X, Lock, AlertTriangle, XCircle } from "lucide-react";
import clsx from "clsx";
import { computeFileHash } from "../../utils/hash";
import { generateOwnershipProof, verifyOwnershipProof } from "../../utils/zkProof";

export default function Audit() {
    const [cid, setCid] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStep, setVerificationStep] = useState<string>(""); // For progress status
    const [auditResult, setAuditResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cid || !file) return;

        setIsVerifying(true);
        setAuditResult(null);
        setError(null);
        setVerificationStep("Fetching Public Record from IPFS...");

        try {
            // 1. Fetch Public Record (Manifest)
            const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
            const res = await fetch(`${gateway}${cid}`);
            if (!res.ok) throw new Error("CID not found or invalid");
            const manifest = await res.json();

            const publicHash = manifest.hash;
            if (!publicHash) throw new Error("Manifest does not contain a integrity hash");

            // 2. Compute Private Witness (File Hash)
            setVerificationStep("Computing Private Witness (Local Hash)...");
            const fileHash = await computeFileHash(file);
            console.log("Witness (Private):", fileHash);
            console.log("Public Commitment:", publicHash);

            // 3. Generate ZK Proof
            setVerificationStep("Generating Zero-Knowledge Proof (Groth16)...");
            // This never reveals the fileHash, only the proof
            const { proof, publicSignals } = await generateOwnershipProof(fileHash, publicHash);

            // 4. Verify ZK Proof
            setVerificationStep("Verifying Proof on Client...");
            const isValid = await verifyOwnershipProof(proof, publicSignals);

            if (isValid) {
                setAuditResult({
                    publicHash,
                    proofSummary: JSON.stringify(proof.pi_a).substring(0, 30) + "...",
                    timestamp: new Date().toLocaleString()
                });
            } else {
                throw new Error("ZK Proof Verification Failed: You do not own this file.");
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Verification Failed");
        } finally {
            setIsVerifying(false);
            setVerificationStep("");
        }
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
                    Zero-Knowledge Audit
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/60 text-lg"
                >
                    Prove ownership of a file without revealing its content or encryption keys.
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel p-8 rounded-3xl mb-12"
            >
                <form onSubmit={handleVerify} className="space-y-6">
                    {/* Public Input: CID */}
                    <div>
                        <label className="text-xs uppercase text-white/40 font-bold tracking-wider mb-2 block">
                            Public Input (IPFS CID)
                        </label>
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 text-white/30" size={20} />
                            <input
                                type="text"
                                placeholder="Enter File CID (e.g., Qjm...)"
                                value={cid}
                                onChange={(e) => setCid(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-vault-cyan/50 focus:ring-1 focus:ring-vault-cyan/50 transition-all font-mono"
                            />
                        </div>
                    </div>

                    {/* Private Input: File Witness */}
                    <div>
                        <label className="text-xs uppercase text-white/40 font-bold tracking-wider mb-2 block flex items-center gap-2">
                            <Lock size={12} className="text-vault-violet" /> Private Input (Witness File)
                        </label>
                        <div className={clsx(
                            "border border-white/10 rounded-xl p-4 flex items-center justify-between transition-colors",
                            file ? "bg-vault-violet/5 border-vault-violet/20" : "bg-black/40"
                        )}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-white/5 rounded-lg text-white/60">
                                    <FileKey size={20} />
                                </div>
                                {file ? (
                                    <div>
                                        <p className="font-medium text-sm truncate">{file.name}</p>
                                        <p className="text-xs text-white/40">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                ) : (
                                    <p className="text-white/30 text-sm">Select original file to prove ownership...</p>
                                )}
                            </div>

                            {file ? (
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            ) : (
                                <label className="cursor-pointer px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold text-white transition-colors border border-white/5">
                                    Select File
                                    <input
                                        type="file"
                                        hidden
                                        onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                    />
                                </label>
                            )}
                        </div>
                        <p className="text-[10px] text-white/30 mt-2">
                            * The file is only used locally to calculate the hash witness. It is never uploaded.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isVerifying || !cid || !file}
                        className={clsx(
                            "w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg",
                            isVerifying || !cid || !file
                                ? "bg-white/10 text-white/50 cursor-not-allowed"
                                : "bg-vault-emerald text-black hover:bg-vault-emerald/90 shadow-vault-emerald/20"
                        )}
                    >
                        {isVerifying ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                {verificationStep}
                            </span>
                        ) : "Generate & Verify ZK Proof"}
                    </button>

                </form>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="mt-6 overflow-hidden"
                        >
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 relative">
                                <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm mb-1">Proof Generation Failed</h4>
                                    <p className="text-sm opacity-90">{error}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setError(null)}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <XCircle size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {auditResult && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <div className="flex items-center gap-3 text-vault-emerald mb-6 bg-vault-emerald/10 p-4 rounded-xl border border-vault-emerald/20 shadow-[0_0_30px_rgba(0,255,157,0.1)]">
                                    <div className="p-1 bg-vault-emerald rounded-full">
                                        <CheckCircle size={16} className="text-black" />
                                    </div>
                                    <span className="font-bold">Zero-Knowledge Proof Verified</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="glass-card p-4 rounded-xl flex justify-between items-center">
                                        <p className="text-xs text-white/40 uppercase font-bold flex items-center gap-2">
                                            <Database size={12} /> Public Commitment
                                        </p>
                                        <p className="font-mono text-xs text-white/80">
                                            {auditResult.publicHash.substring(0, 20)}...
                                        </p>
                                    </div>
                                    <div className="glass-card p-4 rounded-xl flex justify-between items-center">
                                        <p className="text-xs text-white/40 uppercase font-bold flex items-center gap-2">
                                            <GitCommit size={12} /> ZK Proof (Groth16)
                                        </p>
                                        <p className="font-mono text-xs text-white/80">
                                            {auditResult.proofSummary}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                                        <p className="text-xs text-white/30 italic">
                                            "We verified that the user knows a secret file whose SHA-256 hash matches the public record, without the user revealing the file or the hash."
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
