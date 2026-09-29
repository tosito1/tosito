import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getUserStorageRoot } from "@/lib/storage";

const CATEGORY_EXTENSIONS: Record<string, string[]> = {
  photos: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  videos: [".mp4", ".mov", ".avi", ".mkv", ".webm"],
  documents: [".pdf", ".txt", ".doc", ".docx", ".xls", ".xlsx", ".md", ".csv"],
};


export async function GET(request: NextRequest) {
  try {
    const STORAGE_ROOT = await getUserStorageRoot();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q") || undefined;

    async function walkDir(dir: string, category: string, query?: string): Promise<any[]> {
      const exts = CATEGORY_EXTENSIONS[category] || [];
      let results: any[] = [];
      try {
        const list = await fs.readdir(dir, { withFileTypes: true });
        for (const file of list) {
          if (file.name.startsWith('.') && category !== 'trash' && dir === STORAGE_ROOT) continue; // ignore hidden folders like .trash, .cache in root unless we want trash
          
          const fullPath = path.join(dir, file.name);
          
          if (file.isDirectory()) {
            results = results.concat(await walkDir(fullPath, category, query));
          } else {
            const ext = path.extname(file.name).toLowerCase();
            const matchesCategory = exts.length === 0 || exts.includes(ext);
            const matchesQuery = !query || file.name.toLowerCase().includes(query.toLowerCase());
            
            if (matchesCategory && matchesQuery) {
              const stat = await fs.stat(fullPath);
              const relPath = path.relative(STORAGE_ROOT, fullPath);
              results.push({
                name: file.name,
                isDirectory: false,
                size: stat.size,
                lastModified: stat.mtime,
                path: relPath.split(path.sep).join(path.posix.sep),
                parentFolder: path.dirname(relPath).split(path.sep).join(path.posix.sep)
              });
            }
          }
        }
      } catch (err) {
        console.error("Error reading dir", dir, err);
      }
      return results;
    }
    
    // Búsqueda global o categorías (fotos, videos, etc.)
    if (query || (category && category !== "all" && category !== "trash" && category !== "favorites")) {
      const files = await walkDir(STORAGE_ROOT, category || 'all', query);
      files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
      return NextResponse.json({ files });
    }

    // Categoría Papelera
    if (category === "trash") {
      const TRASH_DIR = path.join(STORAGE_ROOT, ".trash");
      try { await fs.access(TRASH_DIR); } catch { return NextResponse.json({ files: [] }); }
      const files = await walkDir(TRASH_DIR, "all");
      files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
      return NextResponse.json({ files });
    }

    // Categoría Favoritos
    if (category === "favorites") {
      try {
        const favData = await fs.readFile(path.join(STORAGE_ROOT, ".favorites.json"), "utf-8");
        const favPaths = JSON.parse(favData) as string[];
        const files = [];
        for (const fPath of favPaths) {
          const absPath = path.join(STORAGE_ROOT, fPath);
          try {
            const stat = await fs.stat(absPath);
            files.push({
              name: path.basename(absPath),
              isDirectory: stat.isDirectory(),
              size: stat.size,
              lastModified: stat.mtime,
              path: fPath.split(path.sep).join(path.posix.sep),
              parentFolder: path.dirname(fPath).split(path.sep).join(path.posix.sep)
            });
          } catch {
            // file missing
          }
        }
        return NextResponse.json({ files });
      } catch {
        return NextResponse.json({ files: [] }); // No favorites file yet
      }
    }

    const queryPath = searchParams.get("path") || "/";

    const safePath = path.normalize(queryPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolutePath = path.join(STORAGE_ROOT, safePath);

    if (!absolutePath.startsWith(STORAGE_ROOT)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    const files = await fs.readdir(absolutePath, { withFileTypes: true });

    const fileList = await Promise.all(
      files
        .filter(f => !(f.name.startsWith('.') && queryPath === '/')) // oculta .trash y .cache en la raíz
        .map(async (file) => {
          const filePath = path.join(absolutePath, file.name);
          const stat = await fs.stat(filePath);
          return {
            name: file.name,
            isDirectory: file.isDirectory(),
            size: stat.size,
            lastModified: stat.mtime,
            path: path.join(safePath, file.name).split(path.sep).join(path.posix.sep),
          };
        })
    );

    // Carpetas primero
    fileList.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }
      return a.isDirectory ? -1 : 1;
    });

    return NextResponse.json({ files: fileList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const STORAGE_ROOT = await getUserStorageRoot();
    const { searchParams } = new URL(request.url);
    const queryPath = searchParams.get("path");

    if (!queryPath) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    const safePath = path.normalize(queryPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolutePath = path.join(STORAGE_ROOT, safePath);

    if (!absolutePath.startsWith(STORAGE_ROOT)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Papelera de reciclaje
    const TRASH_DIR = path.join(STORAGE_ROOT, ".trash");
    try { await fs.access(TRASH_DIR); } catch { await fs.mkdir(TRASH_DIR, { recursive: true }); }

    const stat = await fs.stat(absolutePath);
    const fileName = path.basename(absolutePath);
    const timestamp = Date.now();
    const trashPath = path.join(TRASH_DIR, `${timestamp}_${fileName}`);

    await fs.rename(absolutePath, trashPath);

    return NextResponse.json({ success: true, message: "Moved to trash" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const STORAGE_ROOT = await getUserStorageRoot();
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get("path");

    if (!targetPath) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 });
    }

    // Prevent directory traversal
    const safePath = path.normalize(targetPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const finalPath = path.join(STORAGE_ROOT, safePath);

    if (!finalPath.startsWith(STORAGE_ROOT)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    try {
      await fs.mkdir(finalPath, { recursive: true });
      return NextResponse.json({ success: true, message: "Folder created successfully" });
    } catch {
      return NextResponse.json({ error: "Could not create folder" }, { status: 500 });
    }

  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const STORAGE_ROOT = await getUserStorageRoot();
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get("path");
    
    // Parse body for new name
    const body = await request.json();
    const newName = body.newName;

    if (!targetPath || !newName) {
      return NextResponse.json({ error: "Path and newName are required" }, { status: 400 });
    }

    // Prevent directory traversal
    const safePath = path.normalize(targetPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const finalPath = path.join(STORAGE_ROOT, safePath);

    if (!finalPath.startsWith(STORAGE_ROOT) || finalPath === STORAGE_ROOT) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const safeNewName = path.basename(newName); // Prevent slashes in new name
    const dirName = path.dirname(finalPath);
    const newFinalPath = path.join(dirName, safeNewName);

    try {
      await fs.rename(finalPath, newFinalPath);
      return NextResponse.json({ success: true, message: "Renamed successfully" });
    } catch {
      return NextResponse.json({ error: "Could not rename" }, { status: 500 });
    }

  } catch (error) {
    console.error("Error renaming:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
