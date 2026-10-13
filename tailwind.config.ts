import type { Config } from 'tailwindcss';

// =============================================================================
// PALETTE PILOTEE PAR VARIABLES D'ENVIRONNEMENT (marque blanche)
// -----------------------------------------------------------------------------
// Changez NEXT_PUBLIC_BRAND_COLOR dans Vercel (ex. "#0f766e") et TOUTE la palette
// du produit change : boutons, badges, graphiques, dégradés.
// Fallback : bleu profond de la marque MB Mustapha.
// =============================================================================

function hexVersRgb(hex: string) {
  const h = hex.replace('#', '').trim();
  const complet = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(complet.slice(0, 2), 16),
    g: parseInt(complet.slice(2, 4), 16),
    b: parseInt(complet.slice(4, 6), 16),
  };
}

function rgbVersHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslVersHex(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360; s = Math.min(100, Math.max(0, s)) / 100; l = Math.min(97, Math.max(3, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const vers = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${vers(r)}${vers(g)}${vers(b)}`;
}

/**
 * Construit une palette 50 → 900 a partir d'une seule couleur.
 * La teinte fournie est placee sur le ton 600 (celui des boutons par defaut).
 */
function palette(hex: string): Record<string, string> {
  const { r, g, b } = hexVersRgb(hex);
  const { h, s, l } = rgbVersHsl(r, g, b);
  const tons: [string, number, number][] = [
    ['50', l + 46, 0.35],
    ['100', l + 38, 0.45],
    ['200', l + 29, 0.6],
    ['300', l + 20, 0.75],
    ['400', l + 10, 0.9],
    ['500', l + 5, 1],
    ['600', l, 1],
    ['700', l - 8, 1],
    ['800', l - 14, 0.96],
    ['900', l - 20, 0.92],
  ];
  const sortie: Record<string, string> = {};
  for (const [cle, luminosite, facteurSaturation] of tons) {
    sortie[cle] = hslVersHex(h, s * facteurSaturation, luminosite);
  }
  return sortie;
}

const COULEUR_MARQUE = process.env.NEXT_PUBLIC_BRAND_COLOR || '#1d4ed8';
const COULEUR_ACCENT = process.env.NEXT_PUBLIC_BRAND_ACCENT || '#f59e0b';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette generee automatiquement depuis votre couleur de marque
        brand: palette(COULEUR_MARQUE),
        accent: palette(COULEUR_ACCENT),
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.06), 0 8px 24px -12px rgba(15,23,42,0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
