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
