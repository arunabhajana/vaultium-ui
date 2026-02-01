export const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB

/**
 * Splits a file (or Blob) into fixed-size chunks.
 */
export function createChunks(file: Blob, chunkSize: number = CHUNK_SIZE): Blob[] {
    const chunks: Blob[] = [];
    let start = 0;

    while (start < file.size) {
        const end = Math.min(start + chunkSize, file.size);
        chunks.push(file.slice(start, end));
        start = end;
    }

    return chunks;
}

/**
 * Creates a manifest JSON file linking all chunks.
 */
export function createManifest(
    fileName: string,
    fileSize: number,
    mimeType: string,
    chunkCids: string[],
    chunkSize: number = CHUNK_SIZE,
    hash?: string // Added SHA-256 hash
): File {
    const manifest = {
        name: fileName,
        size: fileSize,
        type: mimeType,
        chunkSize: chunkSize,
        chunks: chunkCids,
        hash: hash, // Store hash in manifest
        uploadedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    return new File([blob], "manifest.json", { type: "application/json" });
}
