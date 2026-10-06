'use client';

import { useWire } from '@/lib/live-store';

/**
 * Penanda kecil: apakah angka di layar ini datang langsung dari database
 * (realtime) atau sedang menunggu giliran tarik berkala.
 *
 * Diam bukan berarti rusak. Pada mode cadangan, polling tetap berjalan, hanya
 * saja penanda ini jujur soal keadaannya.
 */
export default function RealtimeBadge({ className = '' }: { className?: string }) {
  const state = useWire();

  if (state === 'live') {
    return (
      <span
        className={`label inline-flex items-center gap-2 text-blue ${className}`}
        title="Skor masuk otomatis begitu panitia menyimpannya. Tidak perlu me-refresh."
      >
        <span className="h-[7px] w-[7px] animate-dot rounded-full bg-blue" aria-hidden />
        Realtime
      </span>
    );
  }

  return (
    <span
      className={`label inline-flex items-center gap-2 text-muted/70 ${className}`}
      title="Koneksi realtime sedang terputus — data tetap diperbarui tiap 5 detik."
    >
      <span
        className={`h-[7px] w-[7px] rounded-full ${state === 'connecting' ? 'animate-dot bg-yellow' : 'bg-muted/50'}`}
        aria-hidden
      />
      {state === 'connecting' ? 'Menyambung' : 'Mode cadangan'}
    </span>
  );
}
