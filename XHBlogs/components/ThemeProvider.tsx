"use client";
import { createContext, useContext, useState } from "react";
const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} });
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setDark] = useState(false);
  function toggleTheme() {
    setDark((value) => {
      document.documentElement.classList.toggle("dark", !value);
      return !value;
    });
  }
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
