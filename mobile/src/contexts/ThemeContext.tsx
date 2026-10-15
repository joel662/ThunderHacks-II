import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const lightColors = {
  bg: '#f5f5f5',
  card: '#ffffff',
  surface: '#e8e8e8',
  text: '#1a1a2e',
  textSecondary: '#666666',
  accent: '#e94560',
  accentBg: 'rgba(233, 69, 96, 0.1)',
  secondary: '#3b5998',
  secondaryBg: 'rgba(59, 89, 152, 0.1)',
  border: 'rgba(0, 0, 0, 0.1)',
  inputBg: '#e8e8e8',
  inputBorder: 'rgba(0, 0, 0, 0.15)',
  chipBg: '#e0e0e0',
  chipActiveBg: '#e94560',
  chipText: '#666',
  chipActiveText: '#fff',
  placeholder: '#999',
  tabBar: '#ffffff',
  tabBarBorder: 'rgba(0, 0, 0, 0.1)',
  tabInactive: '#999',
  overlay: 'rgba(245,245,245,0.6)',
  divider: 'rgba(0,0,0,0.08)',
  commentBubble: '#f0f0f0',
  avatarBg: '#0f3460',
  statusBar: 'dark' as const,
};

const darkColors = {
  bg: '#1a1a2e',
  card: '#16213e',
  surface: '#0f0f1a',
  text: '#eeeeee',
  textSecondary: '#888888',
  accent: '#e94560',
  accentBg: 'rgba(233, 69, 96, 0.15)',
  secondary: '#0f3460',
  secondaryBg: 'rgba(15, 52, 96, 0.5)',
  border: 'rgba(255, 255, 255, 0.1)',
  inputBg: '#16213e',
  inputBorder: '#0f3460',
  chipBg: '#16213e',
  chipActiveBg: '#e94560',
  chipText: '#aaa',
  chipActiveText: '#fff',
  placeholder: '#666',
  tabBar: '#16213e',
  tabBarBorder: '#0f3460',
  tabInactive: '#666',
  overlay: 'rgba(26,26,46,0.6)',
  divider: '#0f3460',
  commentBubble: '#16213e',
  avatarBg: '#0f3460',
  statusBar: 'light' as const,
};

export type ThemeColors = Omit<typeof darkColors, 'statusBar'> & { statusBar: 'light' | 'dark' };

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ colors: isDark ? darkColors : lightColors, isDark, toggleTheme }),
    [isDark, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
