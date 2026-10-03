import { getInitials } from '@/lib/utils';

/** Kontras sederhana: pilih teks hitam/putih di atas warna latar. */
function textOn(hex: string): string {
  const m = hex.replace('#', '');
  if (m.length < 6) return '#0A1F44';
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0A1F44' : '#FFFFFF';
}

/**
 * Monogram tim pengganti logo (spesifikasi 7.4).
 * Persegi 40×40, garis 1.5px ink, singkatan 2–3 huruf.
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
      className="inline-flex shrink-0 items-center justify-center border-[1.5px] border-ink font-display font-extrabold"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color: textOn(bg),
        fontSize: size * 0.42,
        lineHeight: 1,
      }}
    >
      {initials}
    </span>
  );
}
