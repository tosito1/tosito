"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { signOut, useSession } from "next-auth/react";

interface SidebarProps {
  currentCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  {
    id: "all",
    label: "Todos los archivos",
    color: "#60a5fa",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "photos",
    label: "Fotos",
    color: "#34d399",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    id: "videos",
    label: "Videos",
    color: "#fb7185",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    id: "documents",
    label: "Documentos",
    color: "#fbbf24",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "favorites",
    label: "Favoritos",
    color: "#fbbf24",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: "music",
    label: "Música",
    color: "#a78bfa",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    id: "trash",
    label: "Papelera",
    color: "#f87171",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
];

export default function Sidebar({ currentCategory, onCategoryChange }: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const sidebarRef = React.useRef<HTMLElement>(null);
  const itemsRef = React.useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    setMounted(true);
    // GSAP reveal animation on mount
    gsap.fromTo(
      sidebarRef.current,
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );

    gsap.fromTo(
      itemsRef.current,
      { x: -20, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.08,
        delay: 0.3,
      }
    );
  }, []);

  return (
    <aside ref={sidebarRef} className="sidebar" style={{ opacity: 0 }}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
        </div>
        <span className="sidebar-logo-text">Aura NAS</span>
      </div>

      {/* Nav */}
      <p className="sidebar-section-label">Navegar</p>
      <nav className="sidebar-nav">
        {categories.map((cat, idx) => (
          <div key={cat.id} ref={(el) => { if (el) itemsRef.current[idx] = el; }}>
            <motion.button
              className={`sidebar-item ${currentCategory === cat.id ? "active" : ""}`}
              onClick={() => onCategoryChange(cat.id)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <span
                className="sidebar-item-icon"
                style={{ color: currentCategory === cat.id ? cat.color : undefined }}
              >
                {cat.icon}
              </span>
              {cat.label}
            </motion.button>
          </div>
        ))}
      </nav>

      {/* Storage indicator */}
      <div className="sidebar-storage" style={{ marginTop: 'auto', marginBottom: 16 }}>
        <p className="sidebar-storage-label">Almacenamiento local</p>
        <div className="storage-bar">
          <motion.div
            className="storage-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: "38%" }}
            transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
          />
        </div>
        <p style={{ fontSize: "0.7rem", color: "var(--text-500)", marginTop: 6 }}>Conectado al servidor</p>
      </div>

      {/* User Profile & Logout */}
      <div style={{ padding: "16px", borderTop: "1px solid var(--glass-border)", background: "rgba(0,0,0,0.2)", margin: "0 -20px -20px -20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--blue-500), var(--violet-500))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.9rem" }}>
              {session?.user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>{session?.user?.name || "Usuario"}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-500)" }}>Administrador</span>
            </div>
          </div>
          <button onClick={() => signOut()} style={{ background: "none", border: "none", color: "var(--text-400)", cursor: "pointer", padding: 4 }} title="Cerrar sesión">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
