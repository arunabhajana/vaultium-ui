"use client";

import { useWallet } from "@/context/WalletContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet, Shield, HardDrive, UploadCloud, Link as LinkIcon, FileText,
    Eye, Bell, Terminal, Info, LogOut, Check, ChevronDown, RefreshCw,
    ExternalLink, Trash2, Github, Users, Key, Palette, Moon, Sun, Monitor, Type, Layout, Grid, List
} from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";
import Link from "next/link";

// ----------------------------------------------------------------------
// Types & State
// ----------------------------------------------------------------------

type TabId =
    | "account" | "appearance" | "security" | "storage" | "upload" | "blockchain"
    | "files" | "privacy" | "notifications" | "developer" | "about";

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function Settings() {
    const [activeTab, setActiveTab] = useState<TabId>("account");

    const tabs: { id: TabId; label: string; icon: any }[] = [
        { id: "account", label: "Account & Wallet", icon: Wallet },
        { id: "appearance", label: "Appearance", icon: Palette },
        { id: "security", label: "Security & Encryption", icon: Shield },
        { id: "storage", label: "Storage & IPFS", icon: HardDrive },
        { id: "upload", label: "Upload Preferences", icon: UploadCloud },
        { id: "blockchain", label: "Blockchain", icon: LinkIcon },
        { id: "files", label: "File Management", icon: FileText },
        { id: "privacy", label: "Privacy Controls", icon: Eye },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "developer", label: "Developer", icon: Terminal },
        { id: "about", label: "About Vaultium", icon: Info },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[90vh] flex flex-col md:flex-row gap-8">

            {/* Sidebar */}
            <div className="md:w-1/4 flex-shrink-0">
                <div className="sticky top-24 space-y-2">
                    <div className="mb-6 px-4">
                        <h1 className="text-2xl font-bold font-heading">Settings</h1>
                        <p className="text-white/40 text-sm">Configure your vault</p>
                    </div>

                    <div className="space-y-1 h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-sm font-bold text-left",
                                    activeTab === tab.id
                                        ? "bg-vault-cyan/10 text-vault-cyan shadow-[0_0_15px_rgba(6,182,212,0.1)] border border-vault-cyan/20"
                                        : "text-white/50 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="md:w-3/4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-transparent space-y-6"
                    >
                        {activeTab === "account" && <AccountSection />}
                        {activeTab === "appearance" && <AppearanceSection />}
                        {activeTab === "security" && <SecuritySection />}
                        {activeTab === "storage" && <StorageSection />}
                        {activeTab === "upload" && <UploadSection />}
                        {activeTab === "blockchain" && <BlockchainSection />}
                        {activeTab === "files" && <FilesSection />}
                        {activeTab === "privacy" && <PrivacySection />}
                        {activeTab === "notifications" && <NotificationsSection />}
                        {activeTab === "developer" && <DeveloperSection />}
                        {activeTab === "about" && <AboutSection />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Sections
// ----------------------------------------------------------------------

function AppearanceSection() {
    return (
        <>
            <SectionHeader title="Appearance" description="Customize theme, layout, and visual accessibility." />
            <div className="glass-panel p-6 rounded-3xl space-y-8">

                {/* Theme & Mode */}
                <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Moon size={18} /> Theme Mode</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <SelectCard title="Dark" desc="Web3 Standard" active={true} icon={Moon} />
                        <SelectCard title="Light" desc="High Brightness" active={false} icon={Sun} />
                        <SelectCard title="System" desc="Follow Default" active={false} icon={Monitor} />
                    </div>
                    <div className="mt-4">
                        <ToggleRow label="High Contrast Mode" sublabel="Improves readability for demos" defaultChecked={false} />
                    </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* Colors */}
                <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Palette size={18} /> Accent Color</h3>
                    <div className="flex gap-4">
                        {[
                            { name: "Polygon Purple", class: "bg-vault-violet ring-2 ring-white/20" },
                            { name: "Cyan", class: "bg-vault-cyan" },
                            { name: "Blue", class: "bg-blue-500" },
                            { name: "Emerald", class: "bg-vault-emerald" },
                        ].map((c, i) => (
                            <button key={i} className={clsx("w-10 h-10 rounded-full hover:scale-110 transition-transform", c.class)} title={c.name} />
                        ))}
                    </div>
                </div>

                {/* Layout */}
                <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Layout size={18} /> Layout Preferences</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <SelectCard title="Comfortable" desc="Standard spacing" active={true} />
                        <SelectCard title="Compact" desc="High density data" active={false} />
                    </div>
                    <ToggleRow label="Sticky Header" sublabel="Keep navigation visible" defaultChecked={true} />
                </div>

                {/* Animations */}
                <div>
                    <h3 className="font-bold text-lg mb-4">Animations</h3>
                    <div className="space-y-2">
                        <ToggleRow label="UI Animations" sublabel="Smooth interactions" defaultChecked={true} />
                        <ToggleRow label="Upload Progress Animation" sublabel="Show visualizer" defaultChecked={true} />
                    </div>
                </div>

                {/* Typography */}
                <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Type size={18} /> Typography</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold">Font Size</label>
                            <input type="range" min="12" max="20" className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                            <div className="flex justify-between text-xs text-white/40">
                                <span>Small</span>
                                <span>Medium</span>
                                <span>Large</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reset */}
                <div className="pt-4 border-t border-white/10">
                    <button className="text-white/40 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
                        <RefreshCw size={14} /> Reset Appearance Defaults
                    </button>
                </div>
            </div>
        </>
    );
}

function AccountSection() {
    const { account, disconnectWallet } = useWallet();

    return (
        <>
            <SectionHeader title="Account & Wallet" description="Manage identity and connectivity." />
            <div className="glass-panel p-6 rounded-3xl space-y-6">
                <div className="space-y-4">
                    <SettingRow label="Connected Wallet" value={account || "Not Connected"} type="readonly" />
                    <SettingRow label="Network" value="Polygon Amoy" type="readonly" badge="Active" badgeColor="bg-vault-violet" />
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                        <div>
                            <span className="font-bold block mb-1">Status</span>
                            <span className={clsx("text-sm", account ? "text-vault-emerald" : "text-red-400")}>
                                {account ? "● Connected" : "● Disconnected"}
                            </span>
                        </div>
                        {account && (
                            <button onClick={disconnectWallet} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors flex items-center gap-2">
                                <LogOut size={14} /> Disconnect
                            </button>
                        )}
                    </div>
                </div>

                <div className="h-px bg-white/10" />

                <h3 className="font-bold text-lg">Transaction Mode</h3>
                <div className="grid grid-cols-2 gap-4">
                    <SelectCard title="Auto" desc="Standard signing flow" active={true} />
                    <SelectCard title="Manual" desc="Extra confirmation step" active={false} />
                </div>
            </div>
        </>
    );
}

function SecuritySection() {
    return (
        <>
            <SectionHeader title="Security & Encryption" description="Core trust and privacy controls." />
            <div className="glass-panel p-6 rounded-3xl space-y-6">
                <SettingRow label="Encryption Algorithm" value="AES-256-GCM" type="readonly" />
                <SettingRow label="Client-Side Encryption" value="Enabled" type="readonly" badge="Secure" badgeColor="bg-vault-emerald" />

                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-sm">Key Handling Mode</span>
                        <span className="text-xs text-vault-cyan">In-Memory (Default)</span>
                    </div>
                    <p className="text-white/40 text-xs">Keys are never stored on disk. Use safe session handling.</p>
                </div>

                <ToggleRow label="Integrity Verification" sublabel="Verify SHA-256 hashes on download" defaultChecked={true} />
                <ToggleRow label="Auto-verify signatures" sublabel="Check signer authenticity" defaultChecked={true} />
            </div>
        </>
    );
}

function StorageSection() {
    return (
        <>
            <SectionHeader title="Storage & IPFS" description="Control decentralized storage behavior." />
            <div className="glass-panel p-6 rounded-3xl space-y-6">
                <SettingRow label="Storage Provider" value="Pinata (IPFS)" type="readonly" />

                <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">IPFS Gateway</label>
                    <input type="text" value="https://gateway.pinata.cloud/ipfs/" readOnly className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/60 focus:outline-none focus:border-vault-cyan/50" />
                </div>

                <ToggleRow label="Show Pinning Status" sublabel="Display real-time pin states in dashboard" defaultChecked={true} />

                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <ToggleRow label="Keep Local Backup" sublabel="Store encrypted copy in browser cache (Demo Mode)" defaultChecked={true} color="text-orange-400" />
                </div>
            </div>
        </>
    );
}

function UploadSection() {
    const [chunkSize, setChunkSize] = useState<number>(1048576);

    useEffect(() => {
        const saved = localStorage.getItem("vaultium_chunk_size");
        if (saved) setChunkSize(parseInt(saved));
    }, []);

    const handleSave = (size: number) => {
        setChunkSize(size);
        localStorage.setItem("vaultium_chunk_size", size.toString());
    };

    return (
        <>
            <SectionHeader title="Upload Preferences" description="Performance and split-tunneling tuning." />
            <div className="glass-panel p-6 rounded-3xl space-y-6">
                <ToggleRow label="Parallel Chunk Upload" sublabel="Split files for faster dispersed storage" defaultChecked={true} />

                <div className="space-y-3">
                    <label className="text-sm font-bold ml-1">Chunk Size</label>
                    <div className="flex gap-3">
                        {[524288, 1048576, 2097152].map((size) => (
                            <button
                                key={size}
                                onClick={() => handleSave(size)}
                                className={clsx(
                                    "flex-1 py-3 rounded-xl font-bold transition-all border text-sm",
                                    chunkSize === size
                                        ? "bg-vault-cyan/20 text-vault-cyan border-vault-cyan/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                        : "bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {size / 1024 < 1000 ? `${size / 1024} KB` : `${size / (1024 * 1024)} MB`}
                            </button>
                        ))}
                    </div>
                </div>

                <ToggleRow label="Retry Failed Chunks" sublabel="Automatically retry dropped packets" defaultChecked={true} />
                <ToggleRow label="Visual Progress Indicator" sublabel="Show block-grid animation" defaultChecked={true} />
            </div>
        </>
    );
}

function BlockchainSection() {
    return (
        <>
            <SectionHeader title="Blockchain Settings" description="On-chain interaction transparency." />
            <div className="glass-panel p-6 rounded-3xl space-y-6">
                <SettingRow label="Network" value="Polygon Amoy Testnet" type="readonly" />
                <SettingRow label="Smart Contract" value={`${process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS?.substring(0, 10)}...`} type="readonly" />

                <div className="h-px bg-white/10" />

                <ToggleRow label="Show Transaction Hash" sublabel="Display TX links after upload" defaultChecked={true} />
                <ToggleRow label="Auto-open Explorer" sublabel="Open PolygonScan on success" defaultChecked={false} />
            </div>
        </>
    );
}

function FilesSection() {
    return (
        <>
            <SectionHeader title="File Management" description="User control over stored artifacts." />
            <div className="glass-panel p-6 rounded-3xl space-y-6">
                <div className="space-y-3">
                    <label className="text-sm font-bold ml-1">Default Download Format</label>
                    <div className="grid grid-cols-2 gap-4">
                        <SelectCard title="Original" desc="Decrypted file" active={true} />
                        <SelectCard title="Encrypted" desc="Raw ciphertext" active={false} />
                    </div>
                </div>

                <ToggleRow label="Show Metadata" sublabel="Display CID, Size, Time in lists" defaultChecked={true} />
            </div>
        </>
    );
}

function PrivacySection() {
    return (
        <>
            <SectionHeader title="Privacy Controls" description="Manage logs and local traces." />
            <div className="glass-panel p-6 rounded-3xl space-y-6">
                <ToggleRow label="Allow Analytics" sublabel="Share anonymous usage stats" defaultChecked={false} />
                <ToggleRow label="Local Logging" sublabel="Keep upload history in browser" defaultChecked={true} />

                <div className="h-px bg-white/10" />

                <button className="w-full py-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-bold flex items-center justify-center gap-2">
                    <Trash2 size={18} /> Clear Local Metadata Cache
                </button>
                <button className="w-full py-4 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors font-bold flex items-center justify-center gap-2">
                    <Key size={18} /> Clear Session Keys
                </button>
            </div>
        </>
    );
}

function NotificationsSection() {
    return (
        <>
            <SectionHeader title="Notifications" description="Manage alerts and toasts." />
            <div className="glass-panel p-6 rounded-3xl space-y-6">
                <ToggleRow label="Upload Completions" sublabel="Notify when encryption finishes" defaultChecked={true} />
                <ToggleRow label="Blockchain Confirmations" sublabel="Notify when block is mined" defaultChecked={true} />
                <ToggleRow label="Errors" sublabel="Alert on network failures" defaultChecked={true} />
            </div>
        </>
    );
}

function DeveloperSection() {
    return (
        <>
            <SectionHeader title="Developer Tools" description="Debugging and raw inspection." />
            <div className="glass-panel p-6 rounded-3xl space-y-6 border border-yellow-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Terminal size={100} />
                </div>
                <ToggleRow label="Enable Debug Logs" sublabel="Verbose console output" defaultChecked={false} />
                <ToggleRow label="Show Raw CIDs" sublabel="Display full IPFS hashes in UI" defaultChecked={false} />
                <ToggleRow label="Show Manifest JSON" sublabel="Inspect chunk maps" defaultChecked={false} />

                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white/60 hover:bg-white/10">
                    Export Application Logs
                </button>
            </div>
        </>
    );
}

function AboutSection() {
    return (
        <>
            <SectionHeader title="About Vaultium" description="Project details and team." />
            <div className="glass-panel p-8 rounded-3xl space-y-8 text-center relative overflow-hidden">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-vault-cyan to-vault-violet flex items-center justify-center font-bold text-black font-heading text-4xl shadow-[0_0_30px_rgba(6,182,212,0.4)] mb-4">
                    V
                </div>

                <div>
                    <h2 className="text-3xl font-bold font-heading mb-2">Vaultium</h2>
                    <p className="text-white/40">Secure Decentralized Storage • v1.0.0-beta</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="p-4 bg-white/5 rounded-2xl">
                        <h4 className="font-bold text-vault-cyan text-sm mb-2 uppercase tracking-wide">Team</h4>
                        <ul className="space-y-1 text-white/80">
                            <li className="flex items-center gap-2"><Users size={14} /> Arunabha Jana</li>
                            <li className="flex items-center gap-2"><Users size={14} /> Anirudh Shadipurram</li>
                        </ul>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl">
                        <h4 className="font-bold text-vault-violet text-sm mb-2 uppercase tracking-wide">Guide</h4>
                        <p className="text-white/80">Dr. Gokulnath C</p>
                    </div>
                </div>

                <Link href="https://github.com/arunabhajana/vaultium-ui" target="_blank" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors shadow-lg">
                    <Github size={20} /> View on GitHub
                </Link>
            </div>
        </>
    );
}

// ----------------------------------------------------------------------
// Reusable Components
// ----------------------------------------------------------------------

function SectionHeader({ title, description }: { title: string, description: string }) {
    return (
        <div className="mb-6">
            <h2 className="text-3xl font-bold font-heading mb-2">{title}</h2>
            <p className="text-white/50">{description}</p>
        </div>
    );
}

function SettingRow({ label, value, type, badge, badgeColor }: any) {
    return (
        <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors">
            <span className="font-medium text-white/80">{label}</span>
            <div className="flex items-center gap-3">
                {badge && (
                    <span className={clsx("px-2 py-1 rounded text-xs font-bold text-black", badgeColor)}>
                        {badge}
                    </span>
                )}
                <span className="font-mono text-sm text-white/60">{value}</span>
            </div>
        </div>
    );
}

function ToggleRow({ label, sublabel, defaultChecked, color = "text-vault-emerald" }: any) {
    const [checked, setChecked] = useState(defaultChecked);
    return (
        <div
            className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => setChecked(!checked)}
        >
            <div>
                <h4 className="font-bold text-sm">{label}</h4>
                {sublabel && <p className="text-xs text-white/40 mt-0.5">{sublabel}</p>}
            </div>
            <div className={clsx("w-12 h-6 rounded-full relative transition-colors duration-300", checked ? "bg-white/20" : "bg-black/20")}>
                <div className={clsx("absolute top-1 w-4 h-4 rounded-full transition-all duration-300 shadow-md", checked ? "left-7 bg-vault-emerald" : "left-1 bg-white/40")} />
            </div>
        </div>
    );
}

function SelectCard({ title, desc, active, icon: Icon }: any) {
    return (
        <div className={clsx(
            "p-4 rounded-xl border transition-all cursor-pointer text-center",
            active ? "bg-vault-cyan/10 border-vault-cyan/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]" : "bg-white/5 border-white/5 hover:bg-white/10"
        )}>
            {Icon && <Icon size={24} className={clsx("mx-auto mb-2", active ? "text-vault-cyan" : "text-white/40")} />}
            <div className="font-bold mb-1">{title}</div>
            <div className="text-xs text-white/40">{desc}</div>
        </div>
    );
}
