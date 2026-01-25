"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Wallet, ShieldCheck, Database, FileText, Share2, Settings } from "lucide-react";
import clsx from "clsx";

const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: Database },
    { name: "Vault", href: "/vault", icon: FileText },
    { name: "Shared", href: "/shared", icon: Share2 },
    { name: "Audit", href: "/audit", icon: ShieldCheck },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Navbar() {
    const { isConnected, connectWallet, disconnectWallet, account } = useWallet();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const formatAddress = (addr: string) => {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    const handleWalletClick = () => {
        if (isConnected) {
            setIsDropdownOpen(!isDropdownOpen);
        } else {
            connectWallet();
        }
    };

    return (
        <nav
            className={clsx(
                "fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent",
                isScrolled ? "bg-black/50 backdrop-blur-md py-4 border-white/10" : "bg-transparent py-6"
            )}
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vault-cyan to-vault-violet flex items-center justify-center font-bold text-black font-heading">
                            V
                        </div>
                        <span className="font-heading font-bold text-xl tracking-tight hidden sm:block">VAULTIUM</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={clsx(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                                        isActive
                                            ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                            : "text-white/60 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <Icon size={16} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={handleWalletClick}
                                className={clsx(
                                    "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg",
                                    isConnected
                                        ? "bg-vault-emerald/10 text-vault-emerald border border-vault-emerald/20 hover:bg-vault-emerald/20"
                                        : "bg-white text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                                )}
                            >
                                <Wallet size={16} />
                                {isConnected && account ? formatAddress(account) : "Connect"}
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && isConnected && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                                    >
                                        <div className="p-1">
                                            <Link
                                                href="/dashboard"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <Database size={16} />
                                                Profile
                                            </Link>
                                            <Link
                                                href="/settings"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <Settings size={16} />
                                                Settings
                                            </Link>
                                            <div className="h-px bg-white/10 my-1" />
                                            <button
                                                onClick={() => {
                                                    disconnectWallet();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors text-left"
                                            >
                                                <Share2 className="rotate-90" size={16} />
                                                Log out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden text-white/80 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 md:hidden flex flex-col gap-2 shadow-2xl"
                    >
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={clsx(
                                        "px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3",
                                        pathname === link.href
                                            ? "bg-white/10 text-white"
                                            : "text-white/60 hover:bg-white/5"
                                    )}
                                >
                                    <Icon size={18} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
