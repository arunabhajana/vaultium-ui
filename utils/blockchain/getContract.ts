/**
 * @file getContract.ts
 * @description Helper function to get an ethers.js Contract instance connected to MetaMask.
 */

import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";

/**
 * Returns a read-write contract instance connected to the user's wallet (MetaMask).
 * Throws an error if MetaMask is not installed or the user creates an issue.
 */
export async function getContract() {
    if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask is not installed. Please install it to use this feature.");
    }

    try {
        // 1. Request account access if needed
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // 2. Create an ethers Provider using window.ethereum
        const provider = new ethers.BrowserProvider(window.ethereum);

        // 3. Get the Signer (the connected user)
        const signer = await provider.getSigner();

        // 4. Return the Contract instance connected with the Signer
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    } catch (error) {
        console.error("Error setting up contract:", error);
        throw error;
    }
}
