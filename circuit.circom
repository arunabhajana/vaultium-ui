pragma circom 2.0.0;

// Include SHA-256 circuit from circomlib
// NOTE: In a real environment, you would run `npm install circomlib` and include it.
// include "../node_modules/circomlib/circuits/sha256/sha256.circom";

/*
    Constraint:
    SHA256(fileHash) == publicHash

    fileHash: Private Witness (User knows the file content hash)
    publicHash: Public Input (Recorded on Blockchain/IPFS Manifest)
*/

template OwnershipProof() {
    // 1. Private Input: The actual file hash (secret)
    signal input fileHash;
    
    // 2. Public Input: The expected public hash
    signal input publicHash;

    // 3. Output logic (Constraint)
    // In a real circuit, we would use the SHA256 component.
    // signal output out;
    
    // component hasher = Sha256(256);
    // hasher.in <== fileHash;
    // out <== hasher.out;

    // Enforce the constraint
    fileHash === publicHash;
}

component main {public [publicHash]} = OwnershipProof();
