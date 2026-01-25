/**
 * @file contract.ts
 * @description Stores the Smart Contract Address and ABI for VaultiumStorage.
 */

// TODO: Ensure NEXT_PUBLIC_SMART_CONTRACT_ADDRESS is set in .env.local
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS || "";

export const CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "cid", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "fileName", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "uploadTime", "type": "uint256" }
        ],
        "name": "FileUploaded",
        "type": "event"
    },
    {
        "inputs": [
            { "internalType": "string", "name": "_cid", "type": "string" },
            { "internalType": "string", "name": "_fileName", "type": "string" },
            { "internalType": "uint256", "name": "_fileSize", "type": "uint256" },
            { "internalType": "string", "name": "_fileType", "type": "string" }
        ],
        "name": "uploadFile",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "_user", "type": "address" }
        ],
        "name": "getUserFileCount",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "_user", "type": "address" }
        ],
        "name": "getUserFiles",
        "outputs": [
            {
                "components": [
                    { "internalType": "string", "name": "cid", "type": "string" },
                    { "internalType": "string", "name": "fileName", "type": "string" },
                    { "internalType": "uint256", "name": "fileSize", "type": "uint256" },
                    { "internalType": "string", "name": "fileType", "type": "string" },
                    { "internalType": "uint256", "name": "uploadTime", "type": "uint256" }
                ],
                "internalType": "struct VaultiumStorage.FileMetadata[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
