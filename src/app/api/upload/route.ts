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

        // Save File
        await writeFile(filePath, buffer);

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
            name: file.name, // Display name
            filename: safeName, // Systems name
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            status: "Encrypted & Stored"
        };

        metadata.unshift(newFileEntry); // Add to beginning
        await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

        console.log("--------------------------------------------------");
        console.log("🔐 Encrypted File Saved");
        console.log(`Name: ${file.name}`);
        console.log(`Path: ${filePath}`);
        console.log("--------------------------------------------------");

        return NextResponse.json({
            success: true,
            message: "File received securely",
            filename: file.name
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
