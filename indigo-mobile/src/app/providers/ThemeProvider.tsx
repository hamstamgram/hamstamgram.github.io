/**
 * Theme Provider
 * Provides theme context based on system settings and user preference
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { lightTheme, darkTheme, type Theme } from '../../theme';

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const { themeMode, setThemeMode } = useSettingsStore();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Determine dark mode based on settings and system preference
  useEffect(() => {
    if (themeMode === 'system') {
      setIsDarkMode(systemColorScheme === 'dark');
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    if (themeMode === 'system') {
      // If on system, switch to explicit light/dark
      setThemeMode(isDarkMode ? 'light' : 'dark');
    } else {
      // Toggle between light and dark
      setThemeMode(isDarkMode ? 'light' : 'dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
