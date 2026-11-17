// Tema monocromo: bianco su nero, superfici grigie come le app di sistema iOS.
export const colors = {
  bg: '#000000',
  surface: '#1C1C1E',
  raised: '#2C2C2E',
  line: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  muted: '#8E8E93',
  accent: '#FFFFFF',
  onAccent: '#000000',
  danger: '#FF453A',
  glass: 'rgba(255,255,255,0.08)',
};

export const fmtTime = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  s = Math.floor(s);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Tinta di riserva per le copertine mancanti: grigi diversi in base all'id.
export function hashHue(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 2246822507) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
export function fallbackGrays(id: string): [string, string] {
  const l = 40 + (hashHue(id) % 6) * 6;
  return [`hsl(0, 0%, ${l}%)`, `hsl(0, 0%, ${Math.round(l * 0.42)}%)`];
}
