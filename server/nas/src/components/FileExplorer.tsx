"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ─────────────────────────────────────────────────────── */
interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number;
  lastModified: string;
  path: string;
  parentFolder?: string;
}

interface FileExplorerProps {
  category?: string;
}

/* ── Helpers ───────────────────────────────────────────────────── */
function formatSize(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileKind(name: string, isDir: boolean) {
  if (isDir) return "folder";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext)) return "image";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "flac"].includes(ext)) return "music";
  if (["pdf", "doc", "docx", "xls", "xlsx", "txt", "md", "csv"].includes(ext)) return "doc";
  return "default";
}

/* ── Icon Components ───────────────────────────────────────────── */
function FileTypeIcon({ kind, size = 26 }: { kind: string; size?: number }) {
  const colors: Record<string, string> = {
    folder:  "#60a5fa",
    image:   "#34d399",
    video:   "#fb7185",
    music:   "#a78bfa",
    doc:     "#fbbf24",
    default: "#94a3b8",
  };
  const color = colors[kind] ?? colors.default;

  const icons: Record<string, React.ReactNode> = {
    folder: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
    image: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
    video: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>,
    music: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
    doc: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    default: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>,
  };

  return <>{icons[kind] ?? icons.default}</>;
}

/* ── Action Buttons ────────────────────────────────────────────── */
function FileActions({ file, isTrash, isFav, onToggleFav, onDelete, onRename, onDownload }: {
  file: FileItem;
  isTrash: boolean;
  isFav?: boolean;
  onToggleFav: (e: React.MouseEvent, f: FileItem) => void;
  onDelete: (e: React.MouseEvent, f: FileItem) => void;
  onRename: (e: React.MouseEvent, f: FileItem) => void;
  onDownload: (e: React.MouseEvent, f: FileItem) => void;
}) {
  return (
    <div className="file-actions">
      {!isTrash && (
        <button className="action-btn" style={{ color: isFav ? "#fbbf24" : "currentColor" }} onClick={(e) => onToggleFav(e, file)} title="Favorito">
          <svg width="13" height="13" viewBox="0 0 24 24" fill={isFav ? "#fbbf24" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      )}
      {!file.isDirectory && !isTrash && (
        <button className="action-btn download" onClick={(e) => onDownload(e, file)} title="Descargar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      )}
      {!isTrash && (
        <button className="action-btn rename" onClick={(e) => onRename(e, file)} title="Renombrar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}
      <button className="action-btn delete" onClick={(e) => onDelete(e, file)} title={isTrash ? "Eliminar permanentemente" : "Mover a papelera"}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────── */
export default function FileExplorer({ category = "all" }: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState("/");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: "image" | "video" | "music" } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [uploadProgresses, setUploadProgresses] = useState<Record<string, number>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  /* ── Fetch ─────────────────────────────────────────────────── */
  const fetchFiles = useCallback(async (path: string, cat: string, query: string = "") => {
    setLoading(true);
    setError("");
    try {
      let url = `/api/files?path=${encodeURIComponent(path)}`;
      if (cat !== "all") {
        url = `/api/files?category=${cat}`;
      }
      if (query) {
        url += `&q=${encodeURIComponent(query)}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error cargando archivos");
      setFiles(data.files ?? []);
      if (cat === "all" && !query) setCurrentPath(path);
      
      // Load favorites to sync state if we are not in favorites category
      const favRes = await fetch('/api/files?category=favorites');
      const favData = await favRes.json();
      if (favRes.ok && favData.files) {
        setFavorites(favData.files.map((f: any) => f.path));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(currentPath, category, searchQuery); }, [category, searchQuery]);

  /* ── GSAP stagger when files change ────────────────────────── */
  useEffect(() => {
    if (!loading && gridRef.current) {
      const items = gridRef.current.querySelectorAll(".file-card, .file-list-row");
      gsap.fromTo(
        items,
        { y: 24, opacity: 0, scale: 0.96 },
        {
          y: 0, opacity: 1, scale: 1,
          duration: 0.45,
          ease: "power3.out",
          stagger: 0.04,
        }
      );
    }
  }, [files, loading, viewMode]);

  /* ── Panel reveal on mount ─────────────────────────────────── */
  useEffect(() => {
    gsap.fromTo(
      panelRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.1 }
    );
  }, []);

  /* ── 3D hover tilt ─────────────────────────────────────────── */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    gsap.to(el, { rotateY: dx * 8, rotateX: -dy * 8, duration: 0.2, ease: "power2.out", transformPerspective: 600 });
  };

  const handleMouseLeave = (el: HTMLElement) => {
    gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.4, ease: "power3.out" });
  };

  /* ── File interactions ─────────────────────────────────────── */
  const handleItemClick = (file: FileItem) => {
    if (file.isDirectory) {
      const newPath = currentPath === "/" ? `/${file.name}` : `${currentPath}/${file.name}`;
      fetchFiles(newPath, category, searchQuery);
    } else {
      const kind = getFileKind(file.name, false);
      const url = `/api/download?path=${encodeURIComponent(file.path)}`;
      if (kind === "image") {
        setPreviewMedia({ url: `${url}&preview=true`, type: "image" });
      } else if (kind === "video") {
        setPreviewMedia({ url: `${url}&preview=true`, type: "video" });
      } else if (kind === "music") {
        setPreviewMedia({ url: `${url}&preview=true`, type: "music" });
      } else {
        window.open(url, "_blank");
      }
    }
  };

  const handleBreadcrumb = (index: number) => {
    const parts = currentPath.split("/").filter(Boolean);
    if (index === -1) { fetchFiles("/", category); return; }
    fetchFiles("/" + parts.slice(0, index + 1).join("/"), category);
  };

  const handleDelete = async (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar ${file.name}?`)) return;
    const res = await fetch(`/api/files?path=${encodeURIComponent(file.path)}`, { method: "DELETE" });
    if (res.ok) fetchFiles(currentPath, category, searchQuery);
  };
  
  const handleToggleFav = async (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    const res = await fetch(`/api/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: file.path }),
    });
    if (res.ok) fetchFiles(currentPath, category, searchQuery);
  };

  const handleRename = async (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    const newName = prompt(`Renombrar "${file.name}" a:`, file.name);
    if (!newName || newName === file.name) return;
    const res = await fetch(`/api/files?path=${encodeURIComponent(file.path)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newName }),
    });
    if (res.ok) fetchFiles(currentPath, category);
  };

  const handleDownload = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    if (file.isDirectory) return;
    window.open(`/api/download?path=${encodeURIComponent(file.path)}`, "_blank");
  };

  const handleCreateFolder = async () => {
    const name = prompt("Nombre de la nueva carpeta:");
    if (!name) return;
    const newPath = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
    const res = await fetch(`/api/files?path=${encodeURIComponent(newPath)}`, { method: "POST" });
    if (res.ok) fetchFiles(currentPath, category);
  };

  const uploadFile = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", category === "all" ? currentPath : "/");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload", true);

      setUploadProgresses(prev => ({ ...prev, [file.name]: 0 }));

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgresses(prev => ({ ...prev, [file.name]: percentComplete }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          fetchFiles(currentPath, category);
          setTimeout(() => {
            setUploadProgresses(prev => {
              const next = { ...prev };
              delete next[file.name];
              return next;
            });
          }, 1500);
          resolve();
        } else {
          alert(`Error al subir ${file.name}`);
          reject(new Error("Upload failed"));
        }
      };

      xhr.onerror = () => {
        alert("Error de conexión");
        reject(new Error("Upload error"));
      };

      xhr.send(formData);
    });
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) await uploadFile(e.dataTransfer.files[i]);
    }
  };

  /* ── Category title ────────────────────────────────────────── */
  const catTitles: Record<string, string> = { all: "Todos los archivos", photos: "Fotos", videos: "Videos", documents: "Documentos", trash: "Papelera", favorites: "Favoritos" };
  const breadcrumbParts = currentPath.split("/").filter(Boolean);
  const totalSize = files.reduce((a, f) => a + (f.isDirectory ? 0 : f.size), 0);

  return (
    <div
      ref={panelRef}
      className="glass-panel"
      style={{ flex: 1, padding: "1.5rem", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", opacity: 0 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="drag-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </motion.div>
            <p className="drag-overlay-title">Suelta para subir</p>
            <p className="drag-overlay-sub">Los archivos se guardarán en la carpeta actual</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="header">
        <div>
          {category === "all" && !searchQuery ? (
            <div className="breadcrumb">
              <span className="breadcrumb-item" onClick={() => handleBreadcrumb(-1)}>Inicio</span>
              {breadcrumbParts.map((part, i) => (
                <React.Fragment key={i}>
                  <span className="breadcrumb-sep">/</span>
                  <span className="breadcrumb-item" onClick={() => handleBreadcrumb(i)}>{part}</span>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <motion.h2
              key={category}
              className="header-title"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {searchQuery ? `Buscando: "${searchQuery}"` : (catTitles[category] ?? category)}
            </motion.h2>
          )}
          <p className="stats-bar" style={{ marginTop: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            &nbsp;{files.length} elementos · {formatSize(totalSize)}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* ── Search Input ── */}
          <div style={{ position: "relative", marginRight: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue-400)" strokeWidth="2" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)", padding: "6px 12px 6px 30px", color: "white",
                outline: "none", fontSize: "0.85rem", width: 160, transition: "width 0.2s"
              }}
              onFocus={(e) => (e.target.style.width = "220px")}
              onBlur={(e) => (e.target.style.width = "160px")}
            />
          </div>

          <motion.button
            className="btn btn-secondary btn-icon"
            onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
            title="Cambiar vista"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            {viewMode === "grid"
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            }
          </motion.button>

          {category === "all" && !searchQuery && (
            <motion.button className="btn btn-secondary" onClick={handleCreateFolder} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
              Nueva Carpeta
            </motion.button>
          )}

          {category !== "trash" && (
            <motion.label className="btn btn-primary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Subir
              <input type="file" multiple style={{ display: "none" }} onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(uploadFile); }} />
            </motion.label>
          )}
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#fb7185", marginBottom: 12, fontSize: "0.875rem" }}>
          ⚠ {error}
        </motion.div>
      )}

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" className="spinner-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="spinner" />
            </motion.div>
          ) : files.length === 0 ? (
            <motion.div key="empty" className="empty-state" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <svg className="empty-state-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              <p>{searchQuery ? "No se encontraron archivos" : "Esta sección está vacía"}</p>
              {!searchQuery && <p style={{ fontSize: "0.8rem" }}>Arrastra archivos aquí o usa el botón Subir</p>}
            </motion.div>
          ) : (
            <motion.div
              key={`${category}-${currentPath}-${searchQuery}`}
              ref={gridRef}
              className={viewMode === "grid" ? "file-grid" : "file-list"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {files.map((file, idx) => {
                const kind = getFileKind(file.name, file.isDirectory);
                const isImg = kind === "image";
                const isTrash = category === "trash";
                const isFav = favorites.includes(file.path);

                if (viewMode === "grid") {
                  return (
                    <div
                      key={idx}
                      className="file-card"
                      onClick={() => handleItemClick(file)}
                      onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
                      onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
                    >
                      {isImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="file-card-thumbnail"
                          src={`/api/thumbnail?path=${encodeURIComponent(file.path)}`}
                          alt={file.name}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="file-card-icon"><FileTypeIcon kind={kind} size={48} /></div>
                      )}
                      <div className="file-card-info">
                        <div className="file-card-name" title={file.name}>{file.name}</div>
                        <div className="file-card-meta">
                          {file.isDirectory ? `${file.size} items` : formatSize(file.size)}
                        </div>
                      </div>
                      <FileActions
                        file={file}
                        isTrash={isTrash}
                        isFav={isFav}
                        onToggleFav={handleToggleFav}
                        onDelete={handleDelete}
                        onRename={handleRename}
                        onDownload={handleDownload}
                      />
                    </div>
                  );
                }

                // List View
                return (
                  <div key={idx} className="file-list-row" onClick={() => handleItemClick(file)}>
                    <div className="file-list-cell name-cell">
                      <FileTypeIcon kind={kind} size={20} />
                      <p className="file-list-name" title={file.name}>{file.name}</p>
                      {category !== "all" && file.parentFolder && (
                        <p style={{ fontSize: "0.7rem", color: "var(--text-500)" }}>
                          {file.parentFolder === "." ? "Raíz" : file.parentFolder}
                        </p>
                      )}
                    </div>
                    <span className="file-list-meta">{!file.isDirectory ? formatSize(file.size) : "—"}</span>
                    <FileActions
                      file={file}
                      isTrash={isTrash}
                      isFav={isFav}
                      onToggleFav={handleToggleFav}
                      onDelete={handleDelete}
                      onRename={handleRename}
                      onDownload={handleDownload}
                    />
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Toasts de Subida ── */}
      <div style={{ position: "absolute", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 50 }}>
        <AnimatePresence>
          {Object.entries(uploadProgresses).map(([filename, progress]) => (
            <motion.div
              key={filename}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                background: "var(--bg-elevated)", border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)", padding: "12px 16px", width: 280,
                boxShadow: "var(--shadow-md)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.8rem", fontWeight: 500 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }} title={filename}>{filename}</span>
                <span style={{ color: "var(--blue-400)" }}>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  style={{ height: "100%", background: "linear-gradient(90deg, var(--blue-500), var(--violet-500))" }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Media Modal ── */}
      <AnimatePresence>
        {previewMedia && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setPreviewMedia(null)}
          >
            <motion.div
              className="modal-body"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={() => setPreviewMedia(null)}>✕</button>
              
              {previewMedia.type === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewMedia.url} alt="Preview" />
              )}
              {previewMedia.type === "video" && (
                <video src={previewMedia.url} controls autoPlay style={{ width: "100%", maxHeight: "80vh", borderRadius: "var(--radius-md)", outline: "none" }} />
              )}
              {previewMedia.type === "music" && (
                <div style={{ padding: "40px 60px", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                  <FileTypeIcon kind="music" size={64} />
                  <audio src={previewMedia.url} controls autoPlay style={{ width: 300, outline: "none" }} />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
