"use client";

import { useWallet } from "@/context/WalletContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Clock, Trash2, Eye, Share2, MoreVertical, Download, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { getSharedFiles } from "../../utils/sharing";
import { decryptFile, importKey } from "../../utils/encryption";
import { computeFileHash } from "../../utils/hash";

export default function Shared() {
    const { account } = useWallet();
    const [files, setFiles] = useState<any[]>([]);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<{ [key: string]: 'verified' | 'tampered' | null }>({});

    useEffect(() => {
        if (!account) return;
        const shared = getSharedFiles(account);
        setFiles(shared);
    }, [account]);

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
            // For shared files, the key is attached to the record (simulated)
            const keyJwk = fileRec.keyJwk;
            if (!keyJwk) {
                alert("Decryption Key not found for this shared file!");
                throw new Error("Key missing");
            }
            const key = await importKey(keyJwk);

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
            alert("Download/Decryption failed. See console.");
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex justify-between items-center"
            >
                <div>
                    <h1 className="text-3xl font-bold font-heading mb-2">Shared With Me</h1>
                    <p className="text-white/60">Files shared securely with your wallet.</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-sm text-white/50">
                    <Share2 size={16} /> Incoming Shares
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-white/30 border-2 border-dashed border-white/5 rounded-3xl">
                        <p>No files have been shared with you yet.</p>
                    </div>
                ) : (
                    files.map((file, idx) => (
                        <motion.div
                            key={file.cid}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-card p-6 rounded-2xl group hover:bg-white/10 transition-colors relative"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-105 transition-transform duration-300">
                                    <FileText size={32} className="text-vault-violet" />
                                </div>
                                <div className="flex bg-white/5 rounded-lg border border-white/10 p-1">
                                    <span className="text-[10px] uppercase px-1.5 py-0.5 text-white/50">READ ONLY</span>
                                </div>
                            </div>

                            <h3 className="font-bold text-lg mb-1 truncate" title={file.name}>{file.name}</h3>
                            <p className="text-white/50 text-sm mb-4">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB • From {file.sharedBy.substring(0, 6)}...
                            </p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className={clsx(
                                    "px-2 py-1 rounded-md text-xs font-semibold border bg-white/5 text-white/60 border-white/10"
                                )}>
                                    {new Date(file.sharedAt).toLocaleDateString()}
                                </span>
                                {verificationStatus[file.cid] === 'verified' && (
                                    <span className="px-2 py-1 rounded-md text-xs font-semibold bg-vault-emerald/10 text-vault-emerald border border-vault-emerald/20 flex items-center gap-1">
                                        <CheckCircle size={10} /> Verified
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDownload(file)}
                                    disabled={downloading === file.cid}
                                    className="flex-1 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {downloading === file.cid ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Decrypting...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={16} /> Download
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
