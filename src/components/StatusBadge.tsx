import type { MatchStatus } from '@/lib/types';

const LABEL: Record<MatchStatus, string> = {
  scheduled: 'Belum mulai',
  live: 'Live',
  halftime: 'Istirahat',
  finished: 'Selesai',
};

/**
 * Penanda status persegi (radius 2px, tinggi 24px).
 * Status selalu punya teks — tidak mengandalkan warna saja.
 */
export default function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === 'live') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-[2px] bg-ink px-2 text-white">
        <span className="h-2 w-2 rounded-full bg-whistle animate-live-dot" aria-hidden />
        <span className="label">Live</span>
      </span>
    );
  }

  if (status === 'finished') {
    return (
      <span className="inline-flex h-6 items-center rounded-[2px] bg-blue-tint px-2">
        <span className="label text-blue">Selesai</span>
      </span>
    );
  }

  if (status === 'halftime') {
    return (
      <span className="inline-flex h-6 items-center rounded-[2px] bg-blue-tint px-2">
        <span className="label text-ink">Istirahat</span>
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 items-center rounded-[2px] border border-rule px-2">
      <span className="label font-medium normal-case tracking-normal text-muted">
        {LABEL[status]}
      </span>
    </span>
  );
}
