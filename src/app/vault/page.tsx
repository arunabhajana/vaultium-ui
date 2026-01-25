"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File as FileIcon, X, CheckCircle, Loader2 } from "lucide-react";

// Mock Upload State
interface UploadingFile {
    name: string;
    size: string;
    progress: number;
    status: "encrypting" | "sharding" | "uploading" | "confirming" | "complete";
}

export default function Vault() {
    const [activeUploads, setActiveUploads] = useState<UploadingFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleUpload = useCallback(async (files: FileList | null) => {
        if (!files) return;

        // Generate a single key for this batch (or per file - per file is safer/better practice here)
        // For simplicity and security, let's generate a key per file

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
                // 1. Generate Key
                const key = await import("../../utils/encryption").then(m => m.generateKey());

                // 2. Encrypt (Update status)
                setActiveUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "encrypting", progress: 30 } : u));
                const encryptedBlob = await import("../../utils/encryption").then(m => m.encryptFile(file, key));

                // 3. Prepare Upload
                setActiveUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "uploading", progress: 60 } : u));
                const formData = new FormData();
                // Send original name but encrypted content
                formData.append("file", encryptedBlob, file.name);

                // 4. Upload
                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) throw new Error("Upload failed");

                const data = await response.json();

                // 4.5. Store on Blockchain
                if (data.cid) {
                    setActiveUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "confirming", progress: 80 } : u));

                    // Dynamic import to avoid SSR issues if any, though "use client" handles it. 
                    // Using standard import at top is better, but local here is fine for now if I don't want to change top level imports too much.
                    // But I should add import at top. I will add import at top in next step or use dynamic import here.
                    // Let's use dynamic import for safety since I'm editing a chunk.
                    const { uploadFileToBlockchain } = await import("../../../utils/blockchain/vaultiumStorage");
                    await uploadFileToBlockchain(data.cid, file.name, file.size, file.type);
                }

                // 5. Complete
                setActiveUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "complete", progress: 100 } : u));

            } catch (error) {
                console.error("Error processing file:", file.name, error);
                setActiveUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: "complete", progress: 0 } : u)); // Or error status if UI supported it
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
                <h1 className="text-3xl font-bold font-heading mb-2">Upload Vault</h1>
                <p className="text-white/60">Securely encrypt, shard, and distribute your files.</p>
            </motion.div>

            {/* Drag & Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300
          ${isDragOver
                        ? "border-vault-cyan bg-vault-cyan/10 scale-[1.01]"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"}
        `}
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

                                {/* Progress Bar */}
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-vault-cyan to-vault-violet"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${file.progress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>

                                <div className="flex justify-between items-center mt-2 text-xs">
                                    <span className="text-white/40 uppercase tracking-wider font-semibold flex items-center gap-2">
                                        {file.status === "complete" ? (
                                            <span className="text-vault-emerald flex items-center gap-1">
                                                <CheckCircle size={12} /> Encrypted & Stored
                                            </span>
                                        ) : (
                                            <span className="text-vault-cyan flex items-center gap-1">
                                                <Loader2 size={12} className="animate-spin" /> {file.status}...
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-white/40">{Math.round(file.progress)}%</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
