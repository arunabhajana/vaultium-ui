/**
 * @file vaultiumStorage.ts
 * @description Functions to interact with the VaultiumStorage smart contract.
 */

import { getContract } from "./getContract";

export interface FileMetadata {
    cid: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadTime: number; // Unix timestamp
}

/**
 * Uploads file metadata to the smart contract.
 * @param cid IPFS Content Identifier
 * @param fileName Name of the file
 * @param fileSize Size in bytes
 * @param fileType MIME type
 */
export async function uploadFileToBlockchain(
    cid: string,
    fileName: string,
    fileSize: number,
    fileType: string
): Promise<void> {
    try {
        const contract = await getContract();

        console.log(`Uploading file metadata for ${fileName} to blockchain...`);

        // Call the uploadFile function on the smart contract
        const tx = await contract.uploadFile(cid, fileName, fileSize, fileType);

        console.log("Transaction sent:", tx.hash);

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        console.log("Transaction confirmed:", receipt);
    } catch (error) {
        console.error("Failed to upload file to blockchain:", error);
        throw error;
    }
}

/**
 * Fetches all files uploaded by the connected user.
 * @returns Array of FileMetadata objects.
 */
export async function getUserFiles(): Promise<FileMetadata[]> {
    try {
        const contract = await getContract();

        // Get the address of the connected user
        // (We need to re-fetch signer to get address, or we could just use contract.runner)
        // Actually, contract.getUserFiles(signerAddress) needs the address.
        // However, we can also extract it from the signer attached to the contract.
        const signerAddress = await (contract.runner as any).getAddress();

        console.log(`Fetching files for user: ${signerAddress}`);

        // Call getUserFiles from the smart contract
        const files = await contract.getUserFiles(signerAddress);

        // Map the raw result (struct array) to a clean JS object array
        // Note: Solidity structs returned by ethers are array-like with named properties.
        return files.map((file: any) => ({
            cid: file.cid,
            fileName: file.fileName,
            fileSize: Number(file.fileSize), // Convert BigInt to number
            fileType: file.fileType,
            uploadTime: Number(file.uploadTime), // Convert BigInt to number
        }));

    } catch (error) {
        console.error("Failed to fetch user files:", error);
        throw error;
    }
}
