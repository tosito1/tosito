import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";

const USERS_FILE = path.join(process.cwd(), "storage", ".users.json");

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password || password.length < 4) {
      return NextResponse.json({ error: "Usuario y contraseña (mínimo 4 chars) requeridos" }, { status: 400 });
    }

    let users: any[] = [];
    try {
      const data = await fs.readFile(USERS_FILE, "utf-8");
      users = JSON.parse(data);
    } catch {
      // El archivo no existe, será el primer usuario
      const storageDir = path.join(process.cwd(), "storage");
      try { await fs.access(storageDir); } catch { await fs.mkdir(storageDir, { recursive: true }); }
    }

    const existingUser = users.find((u: any) => u.username === username.toLowerCase());
    if (existingUser) {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      username: username.toLowerCase(),
      password: hashedPassword,
    };

    users.push(newUser);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    // Crear la carpeta del usuario
    const userDir = path.join(process.cwd(), "storage", newUser.username);
    try { await fs.access(userDir); } catch { await fs.mkdir(userDir, { recursive: true }); }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
