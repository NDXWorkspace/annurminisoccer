import type { MatchWithTeams } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import Monogram from './Monogram';
import StatusBadge from './StatusBadge';
import Link from 'next/link';

/** Kartu ringkas untuk daftar hasil terbaru. */
export default function MatchCard({
  match,
  compact = false,
}: {
  match: MatchWithTeams;
  compact?: boolean;
}) {
  const isLive = match.status === 'live' || match.status === 'halftime';
  const showScore = isLive || match.status === 'finished';

  return (
    <article className="rounded-[24px] border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="label text-muted">
          {formatTime(match.kickoff_time)}
          {match.field ? ` · Lapangan ${match.field}` : ''}
        </span>
        <StatusBadge status={match.status} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Link href={`/tim/${match.team_a_id}`} className="min-w-0 flex-1 text-right">
          <span
            className={`block truncate font-display leading-tight ${
              compact ? 'text-sm' : 'text-base'
            }`}
          >
            {match.team_a?.name ?? 'Tim A'}
          </span>
        </Link>
        <Monogram name={match.team_a?.name ?? 'A'} shortName={match.team_a?.short_name} size={compact ? 32 : 40} />
        {showScore ? (
          <p className="num flex items-center gap-1.5 text-3xl" aria-live="polite">
            {match.score_a ?? 0}
            <span className="font-medium text-muted">–</span>
            {match.score_b ?? 0}
          </p>
        ) : (
          <p className="num text-xl text-muted">vs</p>
        )}
        <Monogram name={match.team_b?.name ?? 'B'} shortName={match.team_b?.short_name} size={compact ? 32 : 40} />
        <Link href={`/tim/${match.team_b_id}`} className="min-w-0 flex-1">
          <span
            className={`block truncate font-display leading-tight ${
              compact ? 'text-sm' : 'text-base'
            }`}
          >
            {match.team_b?.name ?? 'Tim B'}
          </span>
        </Link>
      </div>
    </article>
  );
}