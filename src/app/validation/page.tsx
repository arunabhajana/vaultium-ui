import { Metadata } from 'next';
import { ValidationDashboard } from '@/components/validation/ValidationDashboard';
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'Validation Metrics | Vaultium',
    description: 'System-wide validation metrics for Performance, Security, Cost, and Privacy proofs.',
};

export default function ValidationPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Script src="https://cdn.jsdelivr.net/npm/snarkjs@0.7.6/build/snarkjs.min.js" strategy="afterInteractive" />
            <div className="mb-10 text-center max-w-3xl mx-auto">
                <h1 className="text-4xl font-heading font-bold text-white">
                    System Validation & Metrics
                </h1>
                <p className="mt-4 text-white/60 text-lg">
                    Real-time demonstration of Vaultium's Performance, Security, Cost efficiency, and Zero-Knowledge Proof viability.
                </p>
            </div>

            <ValidationDashboard />
        </div>
    );
}
