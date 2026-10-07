import type { MatchEventType, MatchWithTeams } from '@/lib/types';
import { EVENT_LABEL, sortMatchEvents } from '@/lib/events';

/**
 * Kejadian pertandingan (kartu, pelanggaran, catatan) sebagai baris chip
 * kecil di bawah skor. Kartu digambar kotak kuning/merah dengan CSS —
 * bukan emoji — supaya konsisten di semua perangkat.
 *
 * Dipakai MatchRow/MatchCard/LiveCard untuk publik, dan panel /updateskor
 * (dengan onDelete) untuk koreksi wasit.
 */
export function EventGlyph({ type }: { type: MatchEventType }) {
  if (type === 'kartu_kuning') {
    return <span aria-hidden className="h-3 w-2.5 shrink-0 rounded-[3px] bg-yellow" />;
  }
  if (type === 'kartu_merah') {
    return <span aria-hidden className="h-3 w-2.5 shrink-0 rounded-[3px] bg-danger" />;
  }
  return <span className="label shrink-0 text-muted">{EVENT_LABEL[type]}</span>;
}

export default function EventChips({
  match,
  onDelete,
  disabled = false,
}: {
  match: MatchWithTeams;
  onDelete?: (eventId: string) => void;
  disabled?: boolean;
}) {
  const events = match.events ?? [];
  if (events.length === 0) return null;

  const shorts = new Map<string, string>();
  if (match.team_a) shorts.set(match.team_a.id, match.team_a.short_name);
  if (match.team_b) shorts.set(match.team_b.id, match.team_b.short_name);

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {sortMatchEvents(events).map((e) => {
        const parts: string[] = [];
        if (e.minute !== null) parts.push(`${e.minute}'`);
        const short = e.team_id ? shorts.get(e.team_id) : undefined;
        if (short) parts.push(short);
        if (e.player_name) parts.push(e.player_name);
        return (
          <span
            key={e.id}
            className="flex items-center gap-1.5 rounded-full border border-line bg-white/[0.04] py-1 pl-2.5 pr-2 text-[13px] leading-none"
          >
            <EventGlyph type={e.event_type} />
            {parts.length > 0 && <span>{parts.join(' ')}</span>}
            {e.note && <span className="text-muted">— {e.note}</span>}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(e.id)}
                disabled={disabled}
                aria-label="Hapus catatan ini"
                className="ml-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-danger/15 hover:text-danger disabled:opacity-40"
              >
                ✕
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
