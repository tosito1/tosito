"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";

import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "Configuration") {
      setError("Error de configuración del servidor.");
    } else if (errorParam) {
      setError("Error de autenticación.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Usuario o contraseña incorrectos");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", position: "relative", zIndex: 10 }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-panel"
        style={{ padding: "3rem", width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 24 }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: 8, background: "linear-gradient(90deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Aura NAS
          </h1>
          <p style={{ color: "var(--text-400)" }}>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, color: "var(--text-200)" }}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "var(--radius-md)",
                background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)",
                color: "white", outline: "none", fontSize: "1rem", transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--blue-500)"}
              onBlur={(e) => e.target.style.borderColor = "var(--glass-border)"}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6, color: "var(--text-200)" }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "var(--radius-md)",
                background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)",
                color: "white", outline: "none", fontSize: "1rem", transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--violet-500)"}
              onBlur={(e) => e.target.style.borderColor = "var(--glass-border)"}
            />
          </div>

          {error && <p style={{ color: "#fb7185", fontSize: "0.85rem", textAlign: "center" }}>{error}</p>}

          <motion.button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", justifyContent: "center", marginTop: 8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : "Entrar"}
          </motion.button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-400)" }}>
          ¿No tienes cuenta? <a href="/register" style={{ color: "var(--blue-400)", textDecoration: "none" }}>Regístrate</a>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <AnimatedBackground />
      <Suspense fallback={<div>Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </>
  );
}
