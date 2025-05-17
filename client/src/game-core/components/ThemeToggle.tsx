"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useDarkMode } from "../hooks/useDarkMode";
import { cn } from "../utils/cn";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const { isDark, setIsDark } = useDarkMode();

  return (
    <button
      onClick={() => {
        // Changer le thème
        localStorage.setItem("darkMode", (!isDark).toString());
        setIsDark(!isDark);
        
        // Diffuser un événement personnalisé pour les composants qui doivent réagir au changement de thème
        const themeChangeEvent = new CustomEvent('themeChange', { detail: { isDark: !isDark } });
        window.dispatchEvent(themeChangeEvent);
      }}
      className={cn(
        "fixed top-4 right-4 p-2 rounded-full transition-all duration-300",
        "hover:ring-2 hover:ring-offset-2",
        isDark
          ? "bg-gray-800 text-yellow-400 hover:bg-gray-700 hover:ring-yellow-400"
          : "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:ring-blue-400"
      )}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}>
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
