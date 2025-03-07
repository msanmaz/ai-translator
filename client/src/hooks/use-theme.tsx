// src/hooks/use-theme.tsx
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  // Initialize with a guaranteed value
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  
  // Load from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      console.log("Loading saved theme:", savedTheme);
      setTheme(savedTheme);
    }
  }, [storageKey]);

  // Apply theme to document when it changes
  useEffect(() => {
    const root = window.document.documentElement;
    console.log("Setting document theme to:", theme);
    
    // Remove both possible classes
    root.classList.remove("light");
    root.classList.remove("dark");
    
    // Add the new theme
    root.classList.add(theme);
  }, [theme]);

  // Function to change theme
  const changeTheme = (newTheme: Theme) => {
    console.log("Changing theme to:", newTheme);
    setTheme(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  return (
    <ThemeProviderContext.Provider 
      value={{ theme, setTheme: changeTheme }}
      {...props}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
}