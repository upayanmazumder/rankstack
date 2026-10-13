/**
 * Concrete color values for canvas and WebGL effects, which cannot read CSS
 * variables. Keep in sync with the OKLCH tokens in `src/app/globals.css`.
 */
export interface Palette {
  /** `--primary` neon green (dark) or `--brand` green (light). */
  accent: string;
  /** Same accent as an `H S L` triple, for effects that take HSL. */
  accentHsl: string;
  /** `--foreground`. */
  ink: string;
  /** Faint gray for idle marks such as background dots. */
  faint: string;
  /** `--card`. */
  surface: string;
}

export const PALETTES: Record<'dark' | 'light', Palette> = {
  dark: {
    accent: '#a1fa68',
    accentHsl: '96 94 69',
    ink: '#f5f5f5',
    faint: '#2e2e2e',
    surface: '#0c0c0c',
  },
  light: {
    accent: '#3e9f24',
    accentHsl: '107 63 38',
    ink: '#0d0d0d',
    faint: '#cfcfcf',
    surface: '#ffffff',
  },
};
