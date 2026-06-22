import React, { createContext, useContext, useState } from 'react';

export type ThemeName = 'space' | 'egyptians' | 'ocean';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'space',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Hardcoded to 'space' — no theme switching
  const [theme] = useState<ThemeName>('space');

  function setTheme(_newTheme: ThemeName) {
    // No-op: theme is locked to 'space'
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
