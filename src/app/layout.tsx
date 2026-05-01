import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { Navbar } from "@/components/ui/Navbar";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vaultium | Decentralized Cloud Storage",
  description: "Zero-Trust Auditable Layer-2 Decentralized Storage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased bg-black text-white font-sans overflow-x-hidden`}
        suppressHydrationWarning
      >
        <WalletProvider>
          {/* CDN Scripts for Node polyfills to skip Turbopack panics */}
          <Script src="https://unpkg.com/secrets.js-grempe@2.0.0/secrets.min.js" strategy="afterInteractive" />
          <Navbar />
          <div className="pt-24 min-h-screen">
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
