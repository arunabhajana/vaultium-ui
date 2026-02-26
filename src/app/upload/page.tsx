"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File as FileIcon, X, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import clsx from "clsx";

// Mock Upload State
interface UploadingFile {
    name: string;
    size: string;
    progress: number;
    status: "encrypting" | "sharding" | "uploading" | "confirming" | "complete" | "error";
    totalChunks?: number; // Added for ChunkVisualizer
    errorMessage?: string; // New field for error display
}

// Chunk Visualizer Component
const ChunkVisualizer = ({ totalChunks, progress }: { totalChunks: number, progress: number }) => {
    // Determine how many chunks are "complete" based on progress percentage
    const completedCount = Math.floor((progress / 100) * totalChunks);

    return (
        <div className="w-full mt-3">
            <div className="flex justify-between text-xs text-white/40 mb-1">
                <span>Parallel Upload</span>
                <span>{Math.min(100, Math.round(progress))}%</span>
            </div>
            <div className="flex gap-1 flex-wrap">
                {Array.from({ length: totalChunks }).map((_, i) => (
                    <motion.div
                        key={i}
                        className={clsx(
                            "h-2 rounded-sm flex-1 min-w-[4px] transition-colors duration-300",
                            i < completedCount ? "bg-vault-cyan shadow-[0_0_5px_cyan]" : "bg-white/10"
                        )}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.05 }}
                    />
                ))}
            </div>
        </div>
    );
};

export default function UploadPage() {
    const [activeUploads, setActiveUploads] = useState<UploadingFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleUpload = useCallback(async (files: FileList | null) => {
        if (!files) return;

        const filesArray = Array.from(files);

        // Add to active uploads with initial state
        const newUploads: UploadingFile[] = filesArray.map(file => ({
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
            progress: 0,
            status: "encrypting",
        }));

        setActiveUploads(prev => [...prev, ...newUploads]);

        for (const file of filesArray) {
            try {
                // Get Chunk Size from Settings
                let chunkSizeVar = parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHUNK_SIZE || "1048576");
                if (typeof window !== "undefined") {
                    const saved = localStorage.getItem("vaultium_chunk_size");
                    if (saved) chunkSizeVar = parseInt(saved);
                }
                const chunkSize = chunkSizeVar;

                // 0. Compute Hash (Integrity)
                const { computeFileHash } = await import("../../utils/hash");
                const fileHash = await computeFileHash(file);
                console.log(`Hash computed for ${file.name}: ${fileHash}`);

                // 1. Generate Key
                const { generateKey, encryptFile, exportKey } = await import("../../utils/encryption");
                const key = await generateKey();

                // 2. Encrypt
                setActiveUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "encrypting", progress: 10 } : u));
                const encryptedBlob = await import("../../utils/encryption").then(m => m.encryptFile(file, key));

                // 3. Chunking
                setActiveUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "sharding", progress: 30 } : u));
                const { createChunks, createManifest } = await import("../../utils/chunking");
                const chunks = createChunks(encryptedBlob, chunkSize);
                console.log(`Split ${file.name} into ${chunks.length} chunks (Size: ${chunkSize})`);

                // 4. Parallel Upload
                setActiveUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "uploading", progress: 40, totalChunks: chunks.length } : u));

                let completedChunks = 0;
                const totalChunks = chunks.length;

                const uploadPromises = chunks.map(async (chunk, index) => {
                    const formData = new FormData();
                    // Append index to name to avoid collisions in simple storage if needed, though API handles uniqueness locally.
                    // Important: We're uploading raw chunks.
                    formData.append("file", chunk, `${file.name}.part${index}`);

                    console.log(`Uploading chunk ${index + 1}/${totalChunks}`);

                    const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                    });

                    if (!res.ok) throw new Error(`Chunk ${index} upload failed`);
                    const data = await res.json();

                    completedChunks++;
                    // Update progress: 40% -> 90% range for uploads
                    const currentProgress = 40 + ((completedChunks / totalChunks) * 50);
                    setActiveUploads(prev => prev.map(u => u.name === file.name ? { ...u, progress: currentProgress } : u));

                    return data.cid;
                });

                const chunkCids = await Promise.all(uploadPromises);
                console.log("All chunks uploaded:", chunkCids);

                // 5. Create & Upload Manifest
                setActiveUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "confirming", progress: 95 } : u));

                const manifestFile = createManifest(file.name, file.size, file.type, chunkCids, chunkSize, fileHash);
                const manifestFormData = new FormData();
                manifestFormData.append("file", manifestFile);

                const manifestRes = await fetch("/api/upload", {
                    method: "POST",
                    body: manifestFormData,
                });

                if (!manifestRes.ok) throw new Error("Manifest upload failed");
                const manifestData = await manifestRes.json();
                const manifestCID = manifestData.cid;
                console.log("Manifest uploaded:", manifestCID);

                // 6. Store on Blockchain
                if (manifestCID) {
                    const { uploadFileToBlockchain } = await import("../../../utils/blockchain/vaultiumStorage");
                    // Store the MANIFEST CID, not the file content CID.
                    // Blockchain sees it as one file (the manifest).
                    await uploadFileToBlockchain(manifestCID, file.name, file.size, file.type);

                    // 8. Store Key Shares (Zero Trust - SSS)
                    const { splitKey } = await import("../../utils/shamir");

                    // Split key into 3 shares (threshold 2)
                    const shares = await splitKey(key, 3, 2);

                    // Share 1: LocalStorage (Simulated Device Storage)
                    const localKeys = JSON.parse(localStorage.getItem("vault_keys_share1") || "{}");
                    localKeys[manifestCID] = shares[0];
                    localStorage.setItem("vault_keys_share1", JSON.stringify(localKeys));

                    // Share 2: SessionStorage (Simulated Session Memory)
                    const sessionKeys = JSON.parse(sessionStorage.getItem("vault_keys_share2") || "{}");
                    sessionKeys[manifestCID] = shares[1];
                    sessionStorage.setItem("vault_keys_share2", JSON.stringify(sessionKeys));

                    // Share 3: LocalStorage Backup (Simulated Backup Service)
                    const backupKeys = JSON.parse(localStorage.getItem("vault_keys_share3") || "{}");
                    backupKeys[manifestCID] = shares[2];
                    localStorage.setItem("vault_keys_share3", JSON.stringify(backupKeys));

                    console.log(`Key split into 3 shares and distributed for CID: ${manifestCID}`);
                    console.log("Full key deleted from memory.");
                }

                // 7. Complete
                setActiveUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "complete", progress: 100 } : u));

            } catch (error) {
                console.error("Error processing file:", file.name, error);

                // Parse the error conditionally by checking if in browser to avoid import errors
                const { parseBlockchainError } = await import("../../utils/errors");
                const errorMessage = parseBlockchainError(error);

                setActiveUploads(prev => prev.map(u =>
                    u.name === file.name
                        ? { ...u, status: "error", progress: 0, errorMessage }
                        : u
                ));
            }
        }
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleUpload(e.dataTransfer.files);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold font-heading mb-2">Upload Files</h1>
                <p className="text-white/60">Securely encrypt, shard, and distribute your files.</p>
            </motion.div>

            {/* Drag & Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={clsx(
                    "relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300",
                    isDragOver
                        ? "border-vault-cyan bg-vault-cyan/10 scale-[1.01]"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                )}
            >
                <div className="flex flex-col items-center gap-4 pointer-events-none">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-vault-cyan to-vault-violet flex items-center justify-center shadow-2xl shadow-vault-cyan/20">
                        <Upload size={32} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-1">Drag files here to upload</h3>
                        <p className="text-white/50 text-sm">or click to browse from device</p>
                    </div>
                </div>
                <input
                    type="file"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => handleUpload(e.target.files)}
                />
            </div>

            {/* Upload Progress List */}
            <div className="mt-8 space-y-4">
                <AnimatePresence>
                    {activeUploads.map((file, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-panel p-4 rounded-xl flex items-center gap-4"
                        >
                            <div className="p-3 bg-white/5 rounded-lg">
                                <FileIcon size={24} className="text-vault-cyan" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium truncate">{file.name}</span>
                                    <span className="text-white/50">{file.size}</span>
                                </div>

                                {/* Progress Bar or Error Display */}
                                {file.status === "error" ? (
                                    <div className="mt-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg flex items-start gap-2">
                                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                        <span>{file.errorMessage || "Upload failed."}</span>
                                    </div>
                                ) : file.status === "uploading" && file.totalChunks ? (
                                    <ChunkVisualizer totalChunks={file.totalChunks} progress={file.progress} />
                                ) : (
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-vault-cyan to-vault-violet"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${file.progress}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                )}

                                <div className="flex justify-between items-center mt-2 text-xs">
                                    <span className="text-white/40 uppercase tracking-wider font-semibold flex items-center gap-2">
                                        {file.status === "complete" ? (
                                            <span className="text-vault-emerald flex items-center gap-1">
                                                <CheckCircle size={12} /> Encrypted & Stored
                                            </span>
                                        ) : file.status === "error" ? (
                                            <span className="text-red-400 flex items-center gap-1">
                                                <X size={12} /> Failed
                                            </span>
                                        ) : (
                                            <span className="text-vault-cyan flex items-center gap-1">
                                                <Loader2 size={12} className="animate-spin" /> {file.status}...
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
