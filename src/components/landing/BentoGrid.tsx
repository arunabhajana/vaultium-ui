"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Fingerprint, Zap, Coins, Lock } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import clsx from "clsx";

gsap.registerPlugin(ScrollTrigger);

const features = [
    {
        title: "Zero-Trust Key Security",
        description: "Client-side encryption with sharded keys. Only you hold the access.",
        icon: Lock,
        className: "col-span-1 md:col-span-2 md:row-span-2",
        color: "from-vault-cyan to-blue-500",
    },
    {
        title: "Parallel Upload Engine",
        description: "Multi-threaded chunk uploads for lightning fast speeds.",
        icon: Zap,
        className: "col-span-1",
        color: "from-orange-400 to-red-500",
    },
    {
        title: "Merkle Proof Auditing",
        description: "Cryptographic verification of file integrity at any time.",
        icon: Shield,
        className: "col-span-1",
        color: "from-vault-violet to-purple-500",
    },
    {
        title: "ZK Ownership Proof",
        description: "Prove ownership without revealing file contents using Zero-Knowledge proofs.",
        icon: Fingerprint,
        className: "col-span-1 md:col-span-2",
        color: "from-vault-emerald to-green-500",
    },
    {
        title: "Layer-2 Low Fees",
        description: "Built on Polygon specifically to minimize transaction costs.",
        icon: Coins,
        className: "col-span-1",
        color: "from-yellow-400 to-amber-500",
    },
];

export function BentoGrid() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            const elements = containerRef.current.querySelectorAll(".bento-card");
            gsap.fromTo(
                elements,
                {
                    y: 100,
                    opacity: 0,
                },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 80%",
                        end: "bottom 20%",
                        toggleActions: "play none none reverse",
                    },
                }
            );
        }
    }, []);

    return (
        <section className="container mx-auto px-4 py-24 relative z-10" ref={containerRef}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[250px]">
                {features.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                        <div
                            key={idx}
                            className={clsx(
                                "group relative overflow-hidden rounded-3xl glass-card p-8 transition-all hover:bg-white/10 bento-card",
                                feature.className
                            )}
                        >
                            <div
                                className={clsx(
                                    "absolute -right-10 -top-10 w-48 h-48 bg-gradient-to-br opacity-10 blur-3xl rounded-full group-hover:opacity-20 transition-opacity duration-500",
                                    feature.color
                                )}
                            />

                            <div className="flex flex-col h-full justify-between relative z-10">
                                <div className={clsx("p-3 rounded-2xl w-fit bg-gradient-to-br opacity-80", feature.color)}>
                                    <Icon className="text-white" size={24} />
                                </div>

                                <div>
                                    <h3 className="text-2xl font-bold mb-2 font-heading">{feature.title}</h3>
                                    <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            </div>

                            {/* Hover Effect Border */}
                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/10 rounded-3xl transition-all duration-500" />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
