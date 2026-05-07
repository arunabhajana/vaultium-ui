"use client";

import { useWallet } from "@/context/WalletContext";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardDrive, File, Activity, ShieldCheck } from "lucide-react";
import { Download, CheckCircle, Loader2, AlertTriangle, Share2, XCircle, Copy, Key, Server, LockOpen, CheckCircle2 } from "lucide-react";
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

    // Missing Key State
    const [missingKeyFile, setMissingKeyFile] = useState<any | null>(null);

    // Download Progress State
    interface DownloadProgress {
        fileName: string;
        cid: string;
        step: 'blockchain' | 'manifest' | 'keys' | 'chunks' | 'decrypt' | 'verify' | 'done' | 'error';
        keysFound?: number;
        keysNeeded?: number;
        totalChunks?: number;
        downloadedChunks?: number;
        error?: string;
    }
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

    const handleDownload = async (fileRec: any) => {
        if (downloading) return;
        setDownloading(fileRec.cid);
        setVerificationStatus(prev => ({ ...prev, [fileRec.cid]: null }));

        setDownloadProgress({
            fileName: fileRec.name,
            cid: fileRec.cid,
            step: 'blockchain'
        });

        try {
            console.log(`Starting download for ${fileRec.name} (${fileRec.cid})`);

            // 0. Verify Blockchain Metadata
            await new Promise(r => setTimeout(r, 600)); // Visual delay for Polygon verification
            setDownloadProgress(prev => prev ? { ...prev, step: 'manifest' } : null);

            // 1. Fetch Manifest
            const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
            const manifestRes = await fetch(`${gateway}${fileRec.cid}`);
            if (!manifestRes.ok) throw new Error("Failed to fetch manifest");
            const manifest = await manifestRes.json();

            setDownloadProgress(prev => prev ? { ...prev, step: 'keys' } : null);

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
                setDownloadProgress(prev => prev ? { ...prev, keysFound: availableShares.length, keysNeeded: 2 } : null);

                // Add an artificial delay so user can see the key retrieval
                await new Promise(r => setTimeout(r, 800));

                if (availableShares.length < 2) {
                    setMissingKeyFile(fileRec);
                    setDownloadProgress(null);
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
            setDownloadProgress(prev => prev ? { ...prev, step: 'chunks', totalChunks: manifest.chunks.length, downloadedChunks: 0 } : null);
            
            let downloaded = 0;
            const chunkPromises = manifest.chunks.map(async (chunkCid: string) => {
                const isHex = /^[0-9a-f]{64}$/i.test(chunkCid);
                const url = isHex ? `/api/chunks/${chunkCid}` : `${gateway}${chunkCid}`;
                const chunkRes = await fetch(url);
                if (!chunkRes.ok) throw new Error(`Failed to fetch chunk ${chunkCid}`);
                const blob = await chunkRes.blob();
                
                downloaded++;
                setDownloadProgress(prev => prev ? { ...prev, downloadedChunks: downloaded } : null);
                return blob;
            });
            const chunks = await Promise.all(chunkPromises);

            // 4. Combine
            setDownloadProgress(prev => prev ? { ...prev, step: 'decrypt' } : null);
            const encryptedBlob = new Blob(chunks);

            // Add slight delay for animation
            await new Promise(r => setTimeout(r, 500));

            // 5. Decrypt
            const decryptedBlob = await decryptFile(encryptedBlob, key);

            // 6. Verify Integrity
            setDownloadProgress(prev => prev ? { ...prev, step: 'verify' } : null);
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

            // Add slight delay for animation
            await new Promise(r => setTimeout(r, 600));

            // Download Trigger
            setDownloadProgress(prev => prev ? { ...prev, step: 'done' } : null);
            const url = window.URL.createObjectURL(decryptedBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileRec.name; // Use original name
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error: any) {
            console.error("Download failed:", error);
            if (error.message !== "Insufficient shares") {
                const { parseBlockchainError } = await import("../../utils/errors");
                setGlobalError(parseBlockchainError(error));
                setDownloadProgress(prev => prev ? { ...prev, step: 'error', error: parseBlockchainError(error) } : null);
            }
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

            {/* Missing Key Modal */}
            {missingKeyFile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black border border-red-500/30 p-6 rounded-2xl w-full max-w-md shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-4 text-red-400">
                            <div className="p-2 bg-red-500/10 rounded-full">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Access Denied</h3>
                        </div>
                        
                        <p className="text-white/80 text-sm mb-4 leading-relaxed">
                            Cannot decrypt <span className="text-white font-bold">{missingKeyFile.name}</span>.
                            <br/><br/>
                            Vaultium uses <strong>Zero-Trust Security</strong> via Shamir's Secret Sharing. 
                            Your encryption key was split into multiple fragments and distributed across different storages. 
                            You currently do not have enough key fragments on this device/session to reconstruct the secret.
                        </p>

                        <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl mb-6">
                            <h4 className="text-xs font-bold text-red-400 mb-1 uppercase tracking-wider">How to fix this</h4>
                            <p className="text-xs text-white/60">
                                This usually happens if you switched browsers, cleared your local storage, or the session expired. You need at least 2 out of 3 shards to recover your file.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setMissingKeyFile(null)}
                                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-bold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Download Progress Modal */}
            <AnimatePresence>
                {downloadProgress && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-black/90 border border-vault-cyan/30 p-8 rounded-3xl w-full max-w-md shadow-[0_0_40px_rgba(0,255,255,0.1)] relative overflow-hidden"
                        >
                            {/* Close Button */}
                            <button 
                                onClick={() => setDownloadProgress(null)}
                                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
                            >
                                <XCircle size={20} />
                            </button>

                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vault-cyan via-vault-violet to-vault-emerald" />
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-vault-cyan/10 rounded-full blur-3xl pointer-events-none" />
                            
                            <h3 className="text-2xl font-bold font-heading mb-6 flex items-center gap-3">
                                {downloadProgress.step === 'done' ? (
                                    <span className="text-vault-emerald flex items-center gap-2"><CheckCircle2 size={24} /> Decrypted</span>
                                ) : downloadProgress.step === 'error' ? (
                                    <span className="text-red-500 flex items-center gap-2"><AlertTriangle size={24} /> Failed</span>
                                ) : (
                                    <span className="text-white flex items-center gap-2"><Activity className="text-vault-cyan animate-pulse" size={24} /> Retrieving</span>
                                )}
                            </h3>

                            <div className="mb-8">
                                <p className="text-white/60 text-sm mb-1">Target File:</p>
                                <p className="text-white font-mono text-sm truncate bg-white/5 p-2 rounded-lg border border-white/10">{downloadProgress.fileName}</p>
                            </div>

                            {/* Progress Steps List */}
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                                
                                {/* Step 0: Polygon Metadata */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-vault-violet bg-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_10px_rgba(138,43,226,0.2)] z-10">
                                        {['manifest', 'keys', 'chunks', 'decrypt', 'verify', 'done'].includes(downloadProgress.step) ? <CheckCircle size={16} className="text-vault-violet" /> : <Activity size={16} className="text-vault-violet" />}
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl bg-white/5 border border-white/10">
                                        <h4 className="text-sm font-bold text-white mb-1">Polygon Metadata</h4>
                                        <p className="text-xs text-white/50">Fetching immutable CID from smart contract...</p>
                                    </div>
                                </div>

                                {/* Step 1: Manifest */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className={clsx("flex items-center justify-center w-10 h-10 rounded-full border-2 bg-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors", 
                                        ['keys', 'chunks', 'decrypt', 'verify', 'done'].includes(downloadProgress.step) ? "border-vault-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]" : 
                                        downloadProgress.step === 'manifest' ? "border-vault-cyan/50" : "border-white/10")}>
                                        {['keys', 'chunks', 'decrypt', 'verify', 'done'].includes(downloadProgress.step) ? <CheckCircle size={16} className="text-vault-cyan" /> : <Server size={16} className={downloadProgress.step === 'manifest' ? "text-vault-cyan" : "text-white/30"} />}
                                    </div>
                                    <div className={clsx("w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl border transition-all", 
                                        ['keys', 'chunks', 'decrypt', 'verify', 'done'].includes(downloadProgress.step) || downloadProgress.step === 'manifest' ? "bg-white/5 border-white/10" : "opacity-40 border-transparent")}>
                                        <h4 className="text-sm font-bold text-white mb-1">File Manifest</h4>
                                        <p className="text-xs text-white/50">
                                            {downloadProgress.step === 'blockchain' ? "Waiting..." : "Fetching structure from IPFS..."}
                                        </p>
                                    </div>
                                </div>

                                {/* Step 2: Keys */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className={clsx("flex items-center justify-center w-10 h-10 rounded-full border-2 bg-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors", 
                                        ['chunks', 'decrypt', 'verify', 'done'].includes(downloadProgress.step) ? "border-vault-violet shadow-[0_0_10px_rgba(138,43,226,0.2)]" : 
                                        downloadProgress.step === 'keys' ? "border-vault-violet/50" : "border-white/10")}>
                                        {['chunks', 'decrypt', 'verify', 'done'].includes(downloadProgress.step) ? <CheckCircle size={16} className="text-vault-violet" /> : <Key size={16} className={downloadProgress.step === 'keys' ? "text-vault-violet" : "text-white/30"} />}
                                    </div>
                                    <div className={clsx("w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl border transition-all", 
                                        ['chunks', 'decrypt', 'verify', 'done'].includes(downloadProgress.step) || downloadProgress.step === 'keys' ? "bg-white/5 border-white/10" : "opacity-40 border-transparent")}>
                                        <h4 className="text-sm font-bold text-white mb-1">Key Retrieval</h4>
                                        <p className="text-xs text-white/50">
                                            {downloadProgress.step === 'manifest' ? "Waiting..." : 
                                             downloadProgress.keysFound !== undefined ? `Found ${downloadProgress.keysFound}/${downloadProgress.keysNeeded} Shamir fragments` : "Locating fragments..."}
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3: Download */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className={clsx("flex items-center justify-center w-10 h-10 rounded-full border-2 bg-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors", 
                                        ['decrypt', 'verify', 'done'].includes(downloadProgress.step) ? "border-vault-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]" : 
                                        downloadProgress.step === 'chunks' ? "border-vault-cyan/50" : "border-white/10")}>
                                        {['decrypt', 'verify', 'done'].includes(downloadProgress.step) ? <CheckCircle size={16} className="text-vault-cyan" /> : <Download size={16} className={downloadProgress.step === 'chunks' ? "text-vault-cyan" : "text-white/30"} />}
                                    </div>
                                    <div className={clsx("w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl border transition-all", 
                                        ['decrypt', 'verify', 'done'].includes(downloadProgress.step) || downloadProgress.step === 'chunks' ? "bg-white/5 border-white/10" : "opacity-40 border-transparent")}>
                                        <h4 className="text-sm font-bold text-white mb-1">Fetch Chunks</h4>
                                        <p className="text-xs text-white/50">
                                            {downloadProgress.step === 'chunks' && downloadProgress.totalChunks ? 
                                                `Downloading ${downloadProgress.downloadedChunks}/${downloadProgress.totalChunks}` : 
                                             ['decrypt', 'verify', 'done'].includes(downloadProgress.step) ? "All chunks downloaded" : "Waiting..."}
                                        </p>
                                        {downloadProgress.step === 'chunks' && downloadProgress.totalChunks && (
                                            <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                                <motion.div 
                                                    className="h-full bg-vault-cyan" 
                                                    initial={{ width: 0 }} 
                                                    animate={{ width: `${(downloadProgress.downloadedChunks! / downloadProgress.totalChunks) * 100}%` }} 
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 4: Decrypt & Combine */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className={clsx("flex items-center justify-center w-10 h-10 rounded-full border-2 bg-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors", 
                                        ['verify', 'done'].includes(downloadProgress.step) ? "border-vault-emerald shadow-[0_0_10px_rgba(16,185,129,0.2)]" : 
                                        downloadProgress.step === 'decrypt' ? "border-vault-emerald/50" : "border-white/10")}>
                                        {['verify', 'done'].includes(downloadProgress.step) ? <CheckCircle size={16} className="text-vault-emerald" /> : <LockOpen size={16} className={downloadProgress.step === 'decrypt' ? "text-vault-emerald" : "text-white/30"} />}
                                    </div>
                                    <div className={clsx("w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl border transition-all", 
                                        ['verify', 'done'].includes(downloadProgress.step) || downloadProgress.step === 'decrypt' ? "bg-white/5 border-white/10" : "opacity-40 border-transparent")}>
                                        <h4 className="text-sm font-bold text-white mb-1">AES Decryption</h4>
                                        <p className="text-xs text-white/50">
                                            {downloadProgress.step === 'decrypt' ? "Decrypting..." : 
                                             ['verify', 'done'].includes(downloadProgress.step) ? "Decrypted successfully" : "Waiting..."}
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
