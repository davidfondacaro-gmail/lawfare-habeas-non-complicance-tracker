export type ThemeVariantId = 'standard' | 'nebula' | 'vibrancy';

export interface ThemeVariant {
  id: ThemeVariantId;
  name: string;
  description: string;
}

export const THEME_VARIANTS: ThemeVariant[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Precisely classic'
  },
  {
    id: 'nebula',
    name: 'Nebula',
    description: 'Deep-space indigo'
  },
  {
    id: 'vibrancy',
    name: 'Vibrancy',
    description: 'macOS frosted glass'
  }
];

export const STORAGE_KEY = 'precisely-theme-variant';
