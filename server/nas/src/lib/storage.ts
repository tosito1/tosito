import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export async function getUserStorageRoot() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) {
    throw new Error("Unauthorized");
  }
  
  // aislar la carpeta base por usuario: /storage/username
  const root = path.join(process.cwd(), "storage", session.user.name);
  
  try {
    await fs.access(root);
  } catch {
    await fs.mkdir(root, { recursive: true });
  }
  
  return root;
}
