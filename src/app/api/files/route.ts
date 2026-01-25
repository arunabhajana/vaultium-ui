import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
    try {
        const uploadDir = path.join(process.cwd(), "uploads");
        const metadataPath = path.join(uploadDir, "metadata.json");

        // Read Metadata
        try {
            const data = await readFile(metadataPath, "utf-8");
            const files = JSON.parse(data);
            // Ensure we always return an array
            return NextResponse.json(Array.isArray(files) ? files : []);
        } catch (e) {
            // Return empty array if file doesn't exist yet
            return NextResponse.json([]);
        }

    } catch (error) {
        console.error("List files error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
