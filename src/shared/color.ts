/** Converts `#rrggbb` / `#rgb` to the `"r g b"` format Tailwind's rgb() vars need. */
export function toRgbChannels(hex: string, fallback = '249 115 22'): string {
  if (!hex) return fallback;
  let value = hex.trim().replace(/^#/, '');
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return fallback;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `${r} ${g} ${b}`;
}

/** Converts `#rrggbb` to `rgba(r,g,b,alpha)`. */
export function withAlpha(hex: string, alpha: number, fallback = '249,115,22'): string {
  const channels = toRgbChannels(hex, fallback.replace(/,/g, ' ')).split(' ').join(',');
  return `rgba(${channels},${alpha})`;
}

/** Validates an image URL: must be HTTPS (or a relative path). */
export function isSafeImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
