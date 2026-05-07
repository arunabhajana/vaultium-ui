import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest, props: { params: Promise<{ hash: string }> }) {
    try {
        const params = await props.params;
        const hash = params.hash;
        if (!hash) {
            return new NextResponse("Missing hash", { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), "uploads");
        const filePath = path.join(uploadDir, hash);

        let buffer;
        try {
            buffer = await readFile(filePath);
        } catch {
            // Fallback: Find the old .part file that matches this hash
            const { readdir, rename } = await import("fs/promises");
            const crypto = await import("crypto");
            const files = await readdir(uploadDir);
            
            for (const file of files) {
                if (file.includes(".part")) {
                    const tempPath = path.join(uploadDir, file);
                    const tempBuffer = await readFile(tempPath);
                    const fileHash = crypto.createHash("sha256").update(tempBuffer).digest("hex");
                    if (fileHash === hash) {
                        buffer = tempBuffer;
                        // Rename it to the hash so next time it's fast
                        try { await rename(tempPath, filePath); } catch (e) {}
                        break;
                    }
                }
            }
            if (!buffer) throw new Error("Chunk not found in legacy files");
        }

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/octet-stream",
            },
        });
    } catch (error) {
        console.error("Failed to read chunk:", error);
        return new NextResponse("Chunk not found", { status: 404 });
    }
}
