import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { Navbar } from "@/components/ui/Navbar";

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
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased bg-black text-white font-sans overflow-x-hidden`}
      >
        <WalletProvider>
          <Navbar />
          <div className="pt-24 min-h-screen">
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
