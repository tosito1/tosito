"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import FileExplorer from "@/components/FileExplorer";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function Home() {
  const [category, setCategory] = useState("all");

  return (
    <>
      <AnimatedBackground />
      <div className="app-container">
        <Sidebar currentCategory={category} onCategoryChange={setCategory} />
        <main className="main-content">
          <FileExplorer category={category} />
        </main>
      </div>
    </>
  );
}
