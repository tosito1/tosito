import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getUserStorageRoot } from "@/lib/storage";

export async function GET() {
  try {
    const STORAGE_ROOT = await getUserStorageRoot();
    const FAVORITES_FILE = path.join(STORAGE_ROOT, ".favorites.json");
    try {
      const data = await fs.readFile(FAVORITES_FILE, "utf-8");
      return NextResponse.json({ files: JSON.parse(data) });
    } catch {
      return NextResponse.json({ files: [] });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const STORAGE_ROOT = await getUserStorageRoot();
    const FAVORITES_FILE = path.join(STORAGE_ROOT, ".favorites.json");
    const { path: favPath } = await request.json();
    
    let favorites: string[] = [];
    try {
      const data = await fs.readFile(FAVORITES_FILE, "utf-8");
      favorites = JSON.parse(data);
    } catch {
      // no favorites yet
    }

    if (favorites.includes(favPath)) {
      favorites = favorites.filter((p) => p !== favPath);
    } else {
      favorites.push(favPath);
    }

    await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites));
    return NextResponse.json({ success: true, favorites });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
