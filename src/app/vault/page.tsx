"use client";

import { useWallet } from "@/context/WalletContext";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardDrive, File, Activity, ShieldCheck } from "lucide-react";
import { Download, CheckCircle, Loader2, AlertTriangle, Share2, XCircle, Copy } from "lucide-react";
import clsx from "clsx";
import { getUserFiles } from "../../../utils/blockchain/vaultiumStorage";
import { decryptFile, importKey, exportKey } from "../../utils/encryption";
import { computeFileHash } from "../../utils/hash";
import { shareFile, getSharedFiles } from "../../utils/sharing";

export default function Vault() {
    const { account } = useWallet();
    const [files, setFiles] = useState<any[]>([]);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<{ [key: string]: 'verified' | 'tampered' | null }>({});

    // Share Modal State
    const [sharingFile, setSharingFile] = useState<any | null>(null);
    const [shareAddress, setShareAddress] = useState("");

    // Global Error State
    const [globalError, setGlobalError] = useState<string | null>(null);

    const handleDownload = async (fileRec: any) => {
        if (downloading) return;
        setDownloading(fileRec.cid);
        setVerificationStatus(prev => ({ ...prev, [fileRec.cid]: null }));

        try {
            console.log(`Starting download for ${fileRec.name} (${fileRec.cid})`);

            // 1. Fetch Manifest
            const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
            const manifestRes = await fetch(`${gateway}${fileRec.cid}`);
            if (!manifestRes.ok) throw new Error("Failed to fetch manifest");
            const manifest = await manifestRes.json();

            // 2. Get Key
            // If shared, the key is attached to the record. If own file, get from local storage.
            let key: CryptoKey;

            if (!fileRec.isShared) {
                // Own File: Reconstruct from SSS
                const { reconstructKey } = await import("../../utils/shamir");

                // Gather Shares from Distributed Storage
                const s1 = JSON.parse(localStorage.getItem("vault_keys_share1") || "{}")[fileRec.cid];
                const s2 = JSON.parse(sessionStorage.getItem("vault_keys_share2") || "{}")[fileRec.cid];
                const s3 = JSON.parse(localStorage.getItem("vault_keys_share3") || "{}")[fileRec.cid];

                const availableShares = [s1, s2, s3].filter(s => !!s);
                console.log(`Found ${availableShares.length} shares for key reconstruction.`);

                if (availableShares.length < 2) {
                    alert("Access Denied: Insufficient key shares to reconstruct the key. (Zero-Trust Security)");
                    throw new Error("Insufficient shares");
                }

                // Reconstruct
                key = await reconstructKey(availableShares);

            } else {
                // Shared File: Use attached key (Simulated)
                if (!fileRec.keyJwk) throw new Error("Shared key missing");
                key = await importKey(fileRec.keyJwk);
            }

            // 3. Download Chunks
            const chunkPromises = manifest.chunks.map(async (chunkCid: string) => {
                const chunkRes = await fetch(`${gateway}${chunkCid}`);
                if (!chunkRes.ok) throw new Error(`Failed to fetch chunk ${chunkCid}`);
                return await chunkRes.blob();
            });
            const chunks = await Promise.all(chunkPromises);

            // 4. Combine
            const encryptedBlob = new Blob(chunks);

            // 5. Decrypt
            const decryptedBlob = await decryptFile(encryptedBlob, key);

            // 6. Verify Integrity
            if (manifest.hash) {
                const computedHash = await computeFileHash(decryptedBlob);
                if (computedHash === manifest.hash) {
                    setVerificationStatus(prev => ({ ...prev, [fileRec.cid]: 'verified' }));
                    console.log("Integrity Verified ✅");
                } else {
                    setVerificationStatus(prev => ({ ...prev, [fileRec.cid]: 'tampered' }));
                    console.error("Integrity Check Failed ❌");
                    alert("Warning: File hash mismatch! The file may have been tampered with.");
                }
            } else {
                console.warn("No hash in manifest, skipping verification");
            }

            // 7. Download Trigger
            const url = window.URL.createObjectURL(decryptedBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileRec.name; // Use original name
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Download failed:", error);
            const { parseBlockchainError } = await import("../../utils/errors");
            setGlobalError(parseBlockchainError(error));
        } finally {
            setDownloading(null);
        }
    };

    const handleShare = async () => {
        if (!sharingFile || !shareAddress || !account) return;
        try {
            // 1. Get Key to share (Reconstruct first)
            let keyJwk: JsonWebKey;

            // Reconstruct logic for Sharing
            const { reconstructKey } = await import("../../utils/shamir");
            const s1 = JSON.parse(localStorage.getItem("vault_keys_share1") || "{}")[sharingFile.cid];
            const s2 = JSON.parse(sessionStorage.getItem("vault_keys_share2") || "{}")[sharingFile.cid];
            const s3 = JSON.parse(localStorage.getItem("vault_keys_share3") || "{}")[sharingFile.cid];
            const availableShares = [s1, s2, s3].filter(s => !!s);

            if (availableShares.length >= 2) {
                const key = await reconstructKey(availableShares);
                keyJwk = await exportKey(key);
            } else {
                // Fallback if legacy or error
                throw new Error("Cannot reconstruct key for sharing");
            }

            // 2. Share
            shareFile(sharingFile, account, shareAddress, keyJwk);
            // We could use a toast here ideally, but sticking to prompt to not break things too much. Or just clear state. Let's just clear for now, could add success banner later.
            setSharingFile(null);
            setShareAddress("");
        } catch (error) {
            console.error("Share failed", error);
            const { parseBlockchainError } = await import("../../utils/errors");
            setGlobalError(parseBlockchainError(error));
        }
    };

    useEffect(() => {
        const fetchFiles = async () => {
            if (!account) return;
            try {
                // Use Blockchain Helper
                const rawData = await getUserFiles();

                if (Array.isArray(rawData)) {
                    // Map FileMetadata to Dashboard properties
                    const data = rawData.map(f => ({
                        cid: f.cid,
                        name: f.fileName,
                        size: f.fileSize,
                        uploadedAt: f.uploadTime * 1000, // s to ms
                        type: f.fileType
                    }));

                    setFiles(data);

                    // Fetch Shared Files
                    const shared = getSharedFiles(account);
                    if (shared.length > 0) {
                        setFiles(prev => [...prev, ...shared]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch files:", error);
            }
        };

        fetchFiles();
        // Poll every 10 seconds
        const interval = setInterval(fetchFiles, 10000);
        return () => clearInterval(interval);
    }, [account]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold font-heading mb-2">Vault Repository</h1>
                <p className="text-white/60">Manage your encrypted files.</p>
            </motion.div>

            {/* Global Error Banner */}
            <AnimatePresence>
                {globalError && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 relative"
                    >
                        <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                        <div className="flex-1">
                            <h4 className="font-bold text-sm mb-1">Transaction Failed</h4>
                            <p className="text-sm opacity-90">{globalError}</p>
                        </div>
                        <button
                            onClick={() => setGlobalError(null)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <XCircle size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Your Files List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-8 rounded-3xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold font-heading">Files ({files.length})</h3>
                    <div className="flex gap-2 text-sm text-white/40">
                        <span className="flex items-center gap-1"><ShieldCheck size={14} /> Encrypted</span>
                        <span className="flex items-center gap-1"><HardDrive size={14} /> IPFS</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-white/40 text-sm">
                                <th className="pb-4 pl-4 font-medium">Name</th>
                                <th className="pb-4 font-medium">Size</th>
                                <th className="pb-4 font-medium">Date</th>
                                <th className="pb-4 font-medium">Status & Integrity</th>
                                <th className="pb-4 pr-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-white/30">
                                        No files found in your vault.
                                    </td>
                                </tr>
                            ) : (
                                files.map((file) => (
                                    <tr key={file.cid} className="group border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                        <td className="py-4 pl-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3 font-medium">
                                                    <div className="p-2 bg-vault-cyan/10 rounded-lg text-vault-cyan">
                                                        <File size={18} />
                                                    </div>
                                                    <span>{file.name}</span>
                                                    {file.isShared && (
                                                        <span className="text-[10px] uppercase px-1.5 py-0.5 bg-vault-violet/20 text-vault-violet rounded border border-vault-violet/30 font-bold">
                                                            Shared by {file.sharedBy.substring(0, 4)}...
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 pl-[42px] text-white/40 text-[10px] font-mono mt-1">
                                                    <span>CID: {file.cid.substring(0, 20)}...</span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(file.cid)}
                                                        className="hover:text-vault-cyan transition-colors"
                                                        title="Copy Full IPFS CID"
                                                    >
                                                        <Copy size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-white/60 font-mono text-sm">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </td>
                                        <td className="py-4 text-white/60 text-sm">
                                            {new Date(file.uploadedAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                {/* Status Indicators */}
                                                <div className="flex gap-1">
                                                    <span className="text-[10px] uppercase px-1.5 py-0.5 bg-white/10 rounded text-white/50 border border-white/5" title="Encrypted Local AES">ENC</span>
                                                    <span className="text-[10px] uppercase px-1.5 py-0.5 bg-white/10 rounded text-white/50 border border-white/5" title="Stored on IPFS">IPFS</span>
                                                    <span className="text-[10px] uppercase px-1.5 py-0.5 bg-white/10 rounded text-white/50 border border-white/5" title="Verified on Blockchain">CHAIN</span>
                                                </div>

                                                {/* Integrity Badge */}
                                                {verificationStatus[file.cid] === 'verified' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-vault-emerald/10 text-vault-emerald text-xs font-bold border border-vault-emerald/20">
                                                        <CheckCircle size={12} /> Verified
                                                    </span>
                                                )}
                                                {verificationStatus[file.cid] === 'tampered' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
                                                        <AlertTriangle size={12} /> Tampered
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 pr-4 text-right flex justify-end gap-2">
                                            {!file.isShared && (
                                                <button
                                                    onClick={() => setSharingFile(file)}
                                                    className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/5 hover:border-vault-violet/30"
                                                    title="Share Access"
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDownload(file)}
                                                disabled={downloading === file.cid}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-bold transition-all border border-white/5 hover:border-vault-cyan/30 flex items-center gap-2 ml-auto"
                                            >
                                                {downloading === file.cid ? (
                                                    <Loader2 size={16} className="animate-spin text-vault-cyan" />
                                                ) : (
                                                    <Download size={16} />
                                                )}
                                                {downloading === file.cid ? "Decrypting..." : "Download"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Share Modal */}
            {sharingFile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl"
                    >
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Share2 className="text-vault-violet" /> Share File
                        </h3>
                        <p className="text-white/60 text-sm mb-4">
                            Share <span className="text-white font-bold">{sharingFile.name}</span> with another wallet.
                            They will be able to download and decrypt it.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs uppercase text-white/40 font-bold tracking-wider mb-2 block">Recipient Address</label>
                                <input
                                    type="text"
                                    value={shareAddress}
                                    onChange={(e) => setShareAddress(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl focus:border-vault-violet outline-none font-mono text-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setSharingFile(null)}
                                    className="px-4 py-2 text-white/60 hover:text-white text-sm font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleShare}
                                    disabled={!shareAddress.startsWith("0x")}
                                    className="px-6 py-2 bg-vault-violet hover:bg-vault-violet/80 text-white rounded-xl text-sm font-bold shadow-lg shadow-vault-violet/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Share Access
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
