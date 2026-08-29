// Color swatch palette and parser for KAKOS Storefront

export interface ColorSwatchStyle {
  background: string;
  isLight: boolean;
  hasBorder: boolean;
  name: string;
}

const BASE_COLOR_MAP: Record<string, { hex: string; isLight?: boolean }> = {
  // Monochromes
  noir: { hex: '#111111' },
  black: { hex: '#111111' },
  'noir noir': { hex: '#000000' },
  blanc: { hex: '#FFFFFF', isLight: true },
  white: { hex: '#FFFFFF', isLight: true },
  ecru: { hex: '#FDFBF7', isLight: true },
  creme: { hex: '#FFFDD0', isLight: true },
  ivoire: { hex: '#FFFFF0', isLight: true },

  // Grays
  gris: { hex: '#6B7280' },
  grey: { hex: '#6B7280' },
  'gris chine': { hex: '#9CA3AF', isLight: true },
  'gris clair': { hex: '#D1D5DB', isLight: true },
  'gris fonce': { hex: '#374151' },
  anthracite: { hex: '#27272A' },

  // Blues
  bleu: { hex: '#1D4ED8' },
  blue: { hex: '#1D4ED8' },
  'bleu marine': { hex: '#0F172A' },
  marine: { hex: '#0F172A' },
  navy: { hex: '#0F172A' },
  'bleu fonce': { hex: '#1E293B' },
  'bleu ciel': { hex: '#7DD3FC', isLight: true },
  indigo: { hex: '#4338CA' },
  petrole: { hex: '#0E7490' },
  cyan: { hex: '#00F0FF', isLight: true },

  // Earth / Warm tones
  beige: { hex: '#D7C4A8', isLight: true },
  sable: { hex: '#E6D7B9', isLight: true },
  camel: { hex: '#C19A6B' },
  marron: { hex: '#582F0E' },
  brown: { hex: '#582F0E' },
  chocolat: { hex: '#3E2723' },
  kaki: { hex: '#556B2F' },
  vert: { hex: '#15803D' },
  'vert sapin': { hex: '#14532D' },
  olive: { hex: '#65A30D' },

  // Vigor / Reds & Pinks
  rouge: { hex: '#DC2626' },
  red: { hex: '#DC2626' },
  bordeaux: { hex: '#881337' },
  rose: { hex: '#F472B6', isLight: true },
  pink: { hex: '#EC4899', isLight: true },
  orange: { hex: '#EA580C' },
  jaune: { hex: '#EAB308', isLight: true },
  violet: { hex: '#7E22CE' },
  lilas: { hex: '#C084FC', isLight: true },
};

function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getColorSwatchStyle(colorName: string): ColorSwatchStyle {
  if (!colorName) {
    return { background: '#E5E7EB', isLight: true, hasBorder: true, name: 'Standard' };
  }

  const raw = colorName.trim();
  const normalized = normalizeName(raw);

  // 1. Direct match
  if (BASE_COLOR_MAP[normalized]) {
    const item = BASE_COLOR_MAP[normalized];
    return {
      background: item.hex,
      isLight: !!item.isLight,
      hasBorder: !!item.isLight,
      name: raw,
    };
  }

  // 2. Multi-color split (e.g. "Rouge/Blanc", "Vert/Beige", "Noir / Blanc", "Gris / Cyan")
  const delimiters = ['/', '&', '+', '-'];
  for (const delim of delimiters) {
    if (raw.includes(delim)) {
      const parts = raw.split(delim).map((p) => normalizeName(p));
      if (parts.length >= 2) {
        const c1 = BASE_COLOR_MAP[parts[0]]?.hex || '#111111';
        const c2 = BASE_COLOR_MAP[parts[1]]?.hex || '#FFFFFF';
        return {
          background: `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`,
          isLight: false,
          hasBorder: true,
          name: raw,
        };
      }
    }
  }

  // 3. Fallback: search if part of words matches known colors
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (BASE_COLOR_MAP[word]) {
      const item = BASE_COLOR_MAP[word];
      return {
        background: item.hex,
        isLight: !!item.isLight,
        hasBorder: !!item.isLight,
        name: raw,
      };
    }
  }

  // 4. Default modern dark slate neutral
  return {
    background: '#1F2937',
    isLight: false,
    hasBorder: false,
    name: raw,
  };
}
