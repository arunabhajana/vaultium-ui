/**
 * @file errors.ts
 * @description Utility functions for parsing blockchain and generic errors.
 */

/**
 * Parses an error object (especially from Ethers.js) into a user-friendly string.
 * @param error The caught error object
 * @returns A user-friendly error message
 */
export function parseBlockchainError(error: any): string {
    if (!error) return "An unknown error occurred.";

    // Extracted string message
    const message = error?.message || error?.reason || String(error);

    // 1. User Rejected Transaction (MetaMask / Ethers.js ACTION_REJECTED)
    if (
        error?.code === "ACTION_REJECTED" ||
        message.toLowerCase().includes("user rejected")
    ) {
        return "Transaction was rejected in your wallet.";
    }

    // 2. Insufficient Funds / Gas
    if (
        error?.code === "INSUFFICIENT_FUNDS" ||
        message.toLowerCase().includes("insufficient funds")
    ) {
        return "Insufficient funds to cover the gas cost for this transaction.";
    }

    if (message.toLowerCase().includes("gas limit")) {
        return "Transaction failed due to gas limit. Try increasing the gas limit in your wallet.";
    }

    // 3. Execution Reverted (Smart Contract Error)
    if (
        error?.code === "CALL_EXCEPTION" ||
        message.toLowerCase().includes("execution reverted")
    ) {
        // Try to extract the specific reason if provided by the contract
        if (error.reason) {
            return `Contract execution reverted: ${error.reason}`;
        }
        return "The smart contract transaction failed (execution reverted).";
    }

    // 4. Network / Connection Errors
    if (
        error?.code === "NETWORK_ERROR" ||
        message.toLowerCase().includes("network") ||
        message.toLowerCase().includes("timeout")
    ) {
        return "Network error. Please check your connection and RPC endpoint.";
    }

    // 5. Unpredictable Gas Limit (often means the tx will fail anyway)
    if (error?.code === "UNPREDICTABLE_GAS_LIMIT") {
        return "Cannot estimate gas. The transaction is likely to fail.";
    }

    // 6. Generic Fallback
    // If it's a very long error message (like a full stringified JSON from a provider), truncate it
    if (message.length > 150) {
        return "An unexpected error occurred during the transaction. See console for details.";
    }

    return message;
}
