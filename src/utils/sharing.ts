import { FileMetadata } from "../../utils/blockchain/vaultiumStorage";

// Key for LocalStorage Simulation
const SHARED_STORAGE_KEY = "vault_shared_access";

interface SharedRecord {
    cid: string;
    from: string;
    to: string;
    rawMetadata: any; // Store the original file metadata
    keyJwk: JsonWebKey; // Encrypted Key (Simulated)
    sharedAt: number;
    accessType?: string; // 'View', 'Download', 'Edit'
    expiresAt?: number | null; // Timestamp
}

/**
 * Simulates sharing a file with another wallet.
 * In a real-world app, this would involve encrypting the file key with the recipient's public key
 * and storing the result on-chain or in IPFS.
 */
export function shareFile(
    file: any,
    fromAddress: string,
    toAddress: string,
    keyJwk: JsonWebKey,
    accessType: string = 'Download',
    expiresAt: number | null = null
) {
    if (!toAddress.startsWith("0x")) throw new Error("Invalid wallet address");

    const records: SharedRecord[] = JSON.parse(localStorage.getItem(SHARED_STORAGE_KEY) || "[]");

    // Check if already shared
    const existingIndex = records.findIndex(r => r.cid === file.cid && r.to.toLowerCase() === toAddress.toLowerCase());
    
    const newRecord: SharedRecord = {
        cid: file.cid,
        from: fromAddress.toLowerCase(),
        to: toAddress.toLowerCase(),
        rawMetadata: file,
        keyJwk: keyJwk,
        sharedAt: Date.now(),
        accessType,
        expiresAt
    };

    if (existingIndex >= 0) {
        records[existingIndex] = newRecord; // Update existing share
    } else {
        records.push(newRecord);
    }
    
    localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(records));
}

/**
 * Retrieves files returned to a specific wallet.
 */
export function getSharedFiles(myAddress: string): any[] {
    const records: SharedRecord[] = JSON.parse(localStorage.getItem(SHARED_STORAGE_KEY) || "[]");
    const myRecords = records.filter(r => r.to.toLowerCase() === myAddress.toLowerCase());

    return myRecords.map(r => ({
        ...r.rawMetadata,
        isShared: true,
        sharedBy: r.from,
        sharedAt: r.sharedAt,
        accessType: r.accessType,
        expiresAt: r.expiresAt,
        keyJwk: r.keyJwk // Attach key for decryption
    }));
}
