import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getUserStorageRoot } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const STORAGE_ROOT = await getUserStorageRoot();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const targetPath = formData.get("path") as string || "/";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Prevent directory traversal
    const safePath = path.normalize(targetPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const finalDir = path.join(STORAGE_ROOT, safePath);

    if (!finalDir.startsWith(STORAGE_ROOT)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Ensure directory exists
    await fs.mkdir(finalDir, { recursive: true });

    // Get file buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Ensure filename is safe
    const safeFileName = path.basename(file.name);
    const finalFilePath = path.join(finalDir, safeFileName);

    await fs.writeFile(finalFilePath, buffer);

    return NextResponse.json({ success: true, filename: safeFileName });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
