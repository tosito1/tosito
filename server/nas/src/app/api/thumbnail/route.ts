import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import sharp from "sharp";
import crypto from "crypto";
import { getUserStorageRoot } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const STORAGE_ROOT = await getUserStorageRoot();
    const CACHE_DIR = path.join(STORAGE_ROOT, ".cache");

    const { searchParams } = new URL(request.url);
    const queryPath = searchParams.get("path");

    if (!queryPath) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 });
    }

    const safePath = path.normalize(queryPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolutePath = path.join(STORAGE_ROOT, safePath);

    if (!absolutePath.startsWith(STORAGE_ROOT)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    try {
      await fs.access(absolutePath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Asegurar directorio caché
    if (!existsSync(CACHE_DIR)) {
      await fs.mkdir(CACHE_DIR, { recursive: true });
    }

    // Hash path for cache filename
    const hash = crypto.createHash("md5").update(absolutePath).digest("hex");
    const cachedPath = path.join(CACHE_DIR, `${hash}.webp`);

    let buffer: Buffer;

    if (existsSync(cachedPath)) {
      buffer = await fs.readFile(cachedPath);
    } else {
      // Resize and convert to webp using sharp
      buffer = await sharp(absolutePath)
        .resize(300, 300, { fit: "cover", position: "center" })
        .webp({ quality: 75 })
        .toBuffer();

      // Guardar en caché async
      fs.writeFile(cachedPath, buffer).catch(console.error);
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Thumbnail error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
