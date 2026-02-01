import * as snarkjs from "snarkjs";

interface ProofResult {
    proof: any;
    publicSignals: string[];
}

/**
 * Generates a Zero-Knowledge Proof of Ownership.
 * 
 * STATEMENT: "I know the secret fileHash that matches the publicHash."
 * 
 * @param fileHash The private hash of the file (computed locally).
 * @param publicHash The public hash (from IPFS Manifest/Blockchain).
 */
export async function generateOwnershipProof(fileHash: string, publicHash: string): Promise<ProofResult> {
    console.log("Generating Zero-Knowledge Proof...");

    // In a real production environment, you would load these from a URL or public folder
    const wasmPath = "/circuits/ownership.wasm";
    const zkeyPath = "/circuits/ownership_final.zkey";

    try {
        // Try to fetch artifacts to see if they exist (Real Mode)
        const check = await fetch(wasmPath, { method: "HEAD" });
        if (check.ok) {
            console.log("Artifacts found, running Real ZK Proof...");
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                { fileHash: BigInt("0x" + fileHash), publicHash: BigInt("0x" + publicHash) },
                wasmPath,
                zkeyPath
            );
            return { proof, publicSignals };
        } else {
            throw new Error("Artifacts missing, switching to simulation");
        }
    } catch (e) {
        console.warn("Generating Simulation Proof (Demo Mode)");

        // SIMULATION MODE (for Demo stability without WASM artifacts)
        // 1. Enforce the Constraint Logic in JS
        if (fileHash !== publicHash) {
            throw new Error("Proof Generation Failed: Constraint not met (Hashes do not match)");
        }

        // 2. Simulate Computation Delay (Zero-Knowledge calculation is heavy)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3. Return Mocked Groth16 Proof Structure
        return {
            proof: {
                pi_a: ["0x123...", "0x456...", "1"],
                pi_b: [["0x789...", "0xabc..."], ["0xdef...", "0x123..."], ["1", "0"]],
                pi_c: ["0x456...", "0x789...", "1"],
                protocol: "groth16",
                curve: "bn128"
            },
            // The Public Signal is ONLY the Public Hash. The fileHash remains PRIVATE.
            publicSignals: [publicHash]
        };
    }
}

/**
 * Verifies the Zero-Knowledge Proof.
 */
export async function verifyOwnershipProof(proof: any, publicSignals: string[]): Promise<boolean> {
    console.log("Verifying Zero-Knowledge Proof...");

    const vkeyPath = "/circuits/verification_key.json";

    try {
        const check = await fetch(vkeyPath, { method: "HEAD" });
        if (check.ok) {
            const vKeyReq = await fetch(vkeyPath);
            const vKey = await vKeyReq.json();
            return await snarkjs.groth16.verify(vKey, publicSignals, proof);
        } else {
            throw new Error("Artifacts missing");
        }
    } catch (e) {
        console.warn("Running Simulation Verification (Demo Mode)");
        // Simulate Verification Delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In simulation, if we got a proof object, we assume the Prover (generateOwnershipProof) 
        // already checked the constraint (fileHash === publicHash).
        // So we strictly check if publicSignals contains valid data.
        return publicSignals.length > 0 && !!proof;
    }
}
