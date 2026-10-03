import { getInitials } from '@/lib/utils';

/** Kontras teks di atas warna latar tim. */
function textOn(hex: string): string {
  const m = hex.replace('#', '');
  if (m.length < 6) return '#F4F7FC';
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#05070D' : '#F4F7FC';
}

/**
 * Monogram tim pengganti logo.
 * Lingkaran 40px, garis tipis, berisi singkatan 2–3 huruf.
 */
export default function Monogram({
  name,
  shortName,
  color,
  size = 40,
}: {
  name: string;
  shortName?: string | null;
  color?: string | null;
  size?: number;
}) {
  const initials = (shortName?.trim() || getInitials(name)).toUpperCase().slice(0, 3);
  const bg = color?.trim() || '#FFFFFF';

  return (
    <span
      aria-hidden
      className="mono-badge"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color: textOn(bg),
        fontSize: size * 0.34,
        borderColor: 'rgba(140,165,220,.2)',
      }}
    >
      {initials}
    </span>
  );
}