// Reusable dark mode component

"use client";
import { useThemeStore } from "@rever/stores";
import { useEffect } from "react";

const ThemeProvider = () => {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  return null;
};

export default ThemeProvider;
