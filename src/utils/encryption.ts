export async function generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptFile(file: File, key: CryptoKey): Promise<Blob> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const algorithm = { name: "AES-GCM", iv: iv };

    const fileBuffer = await file.arrayBuffer();

    const encryptedContent = await window.crypto.subtle.encrypt(
        algorithm,
        key,
        fileBuffer
    );

    // Combine IV and encrypted content
    // Format: [IV (12 bytes)] + [Ciphertext]
    const combinedBuffer = new Uint8Array(iv.length + encryptedContent.byteLength);
    combinedBuffer.set(iv);
    combinedBuffer.set(new Uint8Array(encryptedContent), iv.length);

    return new Blob([combinedBuffer], { type: "application/octet-stream" });
}

export async function decryptFile(encryptedBlob: Blob, key: CryptoKey): Promise<Blob> {
    const buffer = await encryptedBlob.arrayBuffer();
    const combinedData = new Uint8Array(buffer);

    // Extract IV (first 12 bytes)
    const iv = combinedData.slice(0, 12);
    // Extract encrypted data (rest of the file)
    const ciphertext = combinedData.slice(12);

    const algorithm = { name: "AES-GCM", iv: iv };

    try {
        const decryptedContent = await window.crypto.subtle.decrypt(
            algorithm,
            key,
            ciphertext
        );
        return new Blob([decryptedContent]);
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Failed to decrypt file. Invalid key or corrupted data.");
    }
}

export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
    return await window.crypto.subtle.exportKey("jwk", key);
}

export async function importKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}
