import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'bright' | 'ir-classic' | 'dark';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  videoBackdrop: boolean;
  setVideoBackdrop: (enabled: boolean) => void;
  replayIntro: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  onReplayIntro,
}: {
  children: React.ReactNode;
  onReplayIntro?: () => void;
}) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('samanvay_theme') as AppTheme;
    return saved && ['bright', 'ir-classic', 'dark'].includes(saved) ? saved : 'bright';
  });

  const [videoBackdrop, setVideoBackdropState] = useState<boolean>(() => {
    const saved = localStorage.getItem('samanvay_video_backdrop');
    return saved !== null ? saved === 'true' : true;
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('samanvay_theme', newTheme);
  };

  const setVideoBackdrop = (enabled: boolean) => {
    setVideoBackdropState(enabled);
    localStorage.setItem('samanvay_video_backdrop', String(enabled));
  };

  const replayIntro = () => {
    if (onReplayIntro) {
      onReplayIntro();
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-bright', 'theme-ir-classic', 'theme-dark', 'dark');

    if (theme === 'bright') {
      root.classList.add('theme-bright');
    } else if (theme === 'ir-classic') {
      root.classList.add('theme-ir-classic', 'dark');
    } else {
      root.classList.add('theme-dark', 'dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        videoBackdrop,
        setVideoBackdrop,
        replayIntro,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
