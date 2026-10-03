import type { MatchStatus } from '@/lib/types';

/**
 * Penanda status: bentuknya selalu zaman, teksnya selalu ada.
 * Tidak ada status yang hanya dibedakan lewat warna.
 */
export default function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === 'live') {
    return (
      <span className="label inline-flex h-[26px] items-center gap-2 rounded-full bg-yellow pl-2 pr-3 text-ink">
        <span className="h-2 w-2 rounded-full bg-ink animate-pulse-dot" aria-hidden />
        Live
      </span>
    );
  }

  if (status === 'finished') {
    return (
      <span className="label inline-flex h-[26px] items-center rounded-full bg-blue/15 px-3 text-blue">
        Selesai
      </span>
    );
  }

  if (status === 'halftime') {
    return (
      <span className="label inline-flex h-[26px] items-center rounded-full bg-yellow/15 px-3 text-yellow">
        Istirahat
      </span>
    );
  }

  return (
    <span className="label inline-flex h-[26px] items-center rounded-full border border-line px-3 text-muted">
      Belum mulai
    </span>
  );
}