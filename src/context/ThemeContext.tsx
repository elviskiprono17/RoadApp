import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeName = 'space' | 'egyptians' | 'ocean';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const THEME_KEY = '@roadapp_theme';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'space',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('space');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored && ['space', 'egyptians', 'ocean'].includes(stored)) {
          setThemeState(stored as ThemeName);
        }
      } catch {
        // ignore
      }
      setLoaded(true);
    })();
  }, []);

  async function setTheme(newTheme: ThemeName) {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_KEY, newTheme);
    } catch {
      // ignore
    }
  }

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
