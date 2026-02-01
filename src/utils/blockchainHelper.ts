import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS || "";

// Minimal ABI for Vaultium Storage Contract
const ABI = [
    "function getUserFiles(address _user) view returns (tuple(string cid, string name, uint256 size, string fileType, uint256 uploadedAt)[])",
    "function uploadFile(string _cid, string _name, uint256 _size, string _fileType) public"
];

export interface VaultiumFile {
    cid: string;
    name: string;
    size: number;
    fileType: string;
    uploadedAt: number;
    chunkCids: string[]; // Added: Needed for download
    hash?: string;       // Added: Needed for verification
}

export const getContract = (providerOrSigner: any) => {
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, providerOrSigner);
};

export async function getUserFiles(walletAddress: string): Promise<VaultiumFile[]> {
    if (!window.ethereum) throw new Error("No crypto wallet found");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    try {
        const files = await contract.getUserFiles(walletAddress);

        // Format the output
        return files.map((file: any) => ({
            cid: file.cid,
            name: file.name,
            size: Number(file.size), // Convert BigInt to number
            fileType: file.fileType,
            uploadedAt: Number(file.uploadedAt) * 1000 // Convert timestamp to ms if needed, check contract logic. usually seconds.
        }));
    } catch (error) {
        console.error("Error fetching user files:", error);
        return [];
    }
}

export async function uploadFileToBlockchain(cid: string, name: string, size: number, fileType: string) {
    if (!window.ethereum) throw new Error("No crypto wallet found");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    const tx = await contract.uploadFile(cid, name, size, fileType);
    await tx.wait();
    return tx.hash;
}
