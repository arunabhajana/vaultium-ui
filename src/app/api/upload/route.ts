
import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file received" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "uploads");

        // Ensure upload directory exists
        try {
            await writeFile(path.join(uploadDir, ".keep"), "");
        } catch {
            await mkdir(uploadDir, { recursive: true });
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = path.join(uploadDir, safeName);

        // Save File Locally (Backup/Cache)
        await writeFile(filePath, buffer);

        // Upload to IPFS (Pinata)
        let ipfsData = {
            IpfsHash: null,
            PinSize: 0,
            Timestamp: new Date().toISOString()
        };
        let pinStatus = "Pending";

        try {
            const jwt = process.env.PINATA_JWT;
            if (jwt) {
                const pinataFormData = new FormData();
                // Create a blob from the buffer to send to Pinata
                const fileBlob = new Blob([buffer], { type: file.type || "application/octet-stream" });
                pinataFormData.append("file", fileBlob, safeName);

                const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                    },
                    body: pinataFormData,
                });

                if (pinataRes.ok) {
                    ipfsData = await pinataRes.json();
                    pinStatus = "Pinned to IPFS";
                    console.log(`📌 Pinned to IPFS: ${ipfsData.IpfsHash}`);
                } else {
                    console.error("Pinata Upload Failed:", await pinataRes.text());
                    pinStatus = "IPFS Upload Failed";
                }
            } else {
                console.warn("⚠️ PINATA_JWT not found. Skipping IPFS upload.");
                pinStatus = "Skipped (No Key)";
            }
        } catch (ipfsError) {
            console.error("IPFS Error:", ipfsError);
            pinStatus = "IPFS Error";
        }

        // Update Metadata
        const metadataPath = path.join(uploadDir, "metadata.json");
        let metadata = [];
        try {
            const data = await readFile(metadataPath, "utf-8");
            metadata = JSON.parse(data);
        } catch (e) {
            // File doesn't exist or is empty
        }

        const newFileEntry = {
            id: crypto.randomUUID(),
            name: file.name,
            filename: safeName,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            status: "Encrypted & Stored",
            cid: ipfsData.IpfsHash,
            ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/",
            pinStatus: pinStatus
        };

        metadata.unshift(newFileEntry);
        await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

        console.log("--------------------------------------------------");
        console.log("🔐 Encrypted File Saved & Processed");
        console.log(`Name: ${file.name}`);
        console.log(`Local Path: ${filePath}`);
        console.log(`IPFS CID: ${ipfsData.IpfsHash || "N/A"}`);
        console.log("--------------------------------------------------");

        return NextResponse.json({
            success: true,
            message: "File received and processed",
            filename: file.name,
            cid: ipfsData.IpfsHash,
            pinStatus: pinStatus
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
