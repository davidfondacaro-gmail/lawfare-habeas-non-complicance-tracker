'use client';

import { type ThemeVariantId, STORAGE_KEY } from '@/lib/theme/theme-variants';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface ThemeVariantContextValue {
  variant: ThemeVariantId;
  setVariant: (variant: ThemeVariantId) => void;
}

const ThemeVariantContext = createContext<ThemeVariantContextValue>({
  variant: 'standard',
  setVariant: () => {}
});

export function useThemeVariant() {
  return useContext(ThemeVariantContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariantState] = useState<ThemeVariantId>('standard');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeVariantId | null;
    if (stored && stored !== 'standard') {
      setVariantState(stored);
      document.documentElement.setAttribute('data-theme', stored);
    }
  }, []);

  const setVariant = useCallback((v: ThemeVariantId) => {
    setVariantState(v);
    if (v === 'standard') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem(STORAGE_KEY);
    } else {
      document.documentElement.setAttribute('data-theme', v);
      localStorage.setItem(STORAGE_KEY, v);
    }
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeVariantContext.Provider value={{ variant, setVariant }}>{children}</ThemeVariantContext.Provider>
    </NextThemesProvider>
  );
}
