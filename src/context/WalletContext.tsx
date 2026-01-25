"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

interface WalletContextType {
    account: string | null;
    connectWallet: () => Promise<void>;
    isConnected: boolean;
    chainId: string | null;
}

const WalletContext = createContext<WalletContextType>({
    account: null,
    connectWallet: async () => { },
    isConnected: false,
    chainId: null,
});

export const useWallet = () => useContext(WalletContext);

// Extend Window interface for Ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [account, setAccount] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [chainId, setChainId] = useState<string | null>(null);

    const checkConnection = async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                const accounts = await window.ethereum.request({ method: "eth_accounts" });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setIsConnected(true);
                    const chain = await window.ethereum.request({ method: "eth_chainId" });
                    setChainId(chain);
                }
            } catch (error) {
                console.error("Error checking connection:", error);
            }
        }
    };

    const connectWallet = async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
                setAccount(accounts[0]);
                setIsConnected(true);
                const chain = await window.ethereum.request({ method: "eth_chainId" });
                setChainId(chain);
            } catch (error) {
                console.error("Error connecting wallet:", error);
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    useEffect(() => {
        checkConnection();

        if (typeof window.ethereum !== "undefined") {
            window.ethereum.on("accountsChanged", (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setIsConnected(true);
                } else {
                    setAccount(null);
                    setIsConnected(false);
                }
            });

            window.ethereum.on("chainChanged", (chainId: string) => {
                setChainId(chainId);
                window.location.reload();
            });
        }

        return () => {
            if (window.ethereum?.removeListener) {
                window.ethereum.removeListener("accountsChanged", () => { });
                window.ethereum.removeListener("chainChanged", () => { });
            }
        };
    }, []);

    return (
        <WalletContext.Provider value={{ account, connectWallet, isConnected, chainId }}>
            {children}
        </WalletContext.Provider>
    );
};
