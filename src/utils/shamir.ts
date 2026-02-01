import secrets from "secrets.js-grempe";

/**
 * Converts an ArrayBuffer to a Hex string.
 */
function bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Converts a Hex string to an ArrayBuffer.
 */
function hexToBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
}

/**
 * Splits a CryptoKey into N shares with a threshold of K.
 * @param key The AES-GCM CryptoKey to split
 * @param shares Number of shares to generate (default 3)
 * @param threshold Number of shares required to reconstruct (default 2)
 * @returns Array of hex strings (the shares)
 */
export async function splitKey(key: CryptoKey, shares: number = 3, threshold: number = 2): Promise<string[]> {
    // 1. Export key to Raw format (pure bytes)
    const rawKey = await window.crypto.subtle.exportKey("raw", key);

    // 2. Convert to Hex
    const keyHex = bufferToHex(rawKey);

    // 3. Split using Shamir's Secret Sharing
    // secrets.share(secret, numShares, threshold)
    const keyShares = secrets.share(keyHex, shares, threshold);

    return keyShares;
}

/**
 * Reconstructs a CryptoKey from an array of shares.
 * @param sharesArray Array of hex strings (the shares)
 * @returns The reconstructed CryptoKey
 */
export async function reconstructKey(sharesArray: string[]): Promise<CryptoKey> {
    try {
        // 1. Combine shares to get Hex
        const combinedHex = secrets.combine(sharesArray);

        // 2. Convert Hex to Buffer
        const keyBuffer = hexToBuffer(combinedHex);

        // 3. Import Key
        const key = await window.crypto.subtle.importKey(
            "raw",
            keyBuffer,
            { name: "AES-GCM" },
            true, // extractable
            ["encrypt", "decrypt"]
        );

        return key;
    } catch (error) {
        console.error("Shamir Reconstruction Failed:", error);
        throw new Error("Failed to reconstruct key. Shares may be invalid or insufficient.");
    }
}
