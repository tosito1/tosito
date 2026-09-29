import { NextRequest, NextResponse } from "next/server";
import fsPromises from "fs/promises";
import path from "path";
import { getUserStorageRoot } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const STORAGE_ROOT = await getUserStorageRoot();
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get("path");
    const preview = searchParams.get("preview") === "true";

    if (!targetPath) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 });
    }

    const safePath = path.normalize(targetPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const finalPath = path.join(STORAGE_ROOT, safePath);

    if (!finalPath.startsWith(STORAGE_ROOT)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const stat = await fsPromises.stat(finalPath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }

    const fileBuffer = await fsPromises.readFile(finalPath);
    
    const ext = path.extname(finalPath).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".mp4") contentType = "video/mp4";
    else if (ext === ".txt") contentType = "text/plain";
    else if (ext === ".md") contentType = "text/markdown";
    else if (ext === ".mp3") contentType = "audio/mpeg";
    else if (ext === ".wav") contentType = "audio/wav";

    const disposition = preview ? "inline" : `attachment; filename="${path.basename(finalPath)}"`;

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
      },
    });

  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json({ error: "Internal server error or file not found" }, { status: 500 });
  }
}
