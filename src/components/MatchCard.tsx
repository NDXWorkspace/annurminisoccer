import type { MatchWithTeams } from '@/lib/types';
import { formatTime, formatShortDate } from '@/lib/utils';
import Monogram from './Monogram';
import StatusBadge from './StatusBadge';
import Link from 'next/link';

interface MatchCardProps {
  match: MatchWithTeams;
  compact?: boolean;
  priority?: boolean;
}

export default function MatchCard({ match, compact = false }: MatchCardProps) {
  const isLive = match.status === 'live' || match.status === 'halftime';
  const isFinished = match.status === 'finished';

  return (
    <article
      className={`border bg-white ${isLive ? 'border-l-4 border-l-whistle border-rule' : 'border-rule'}`}
    >
      <header
        className={`flex items-center justify-between gap-2 border-b border-rule ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}
      >
        <span className="truncate font-mono text-xs text-muted">
          {formatShortDate(match.match_date)} · {formatTime(match.kickoff_time)}
          {match.field ? ` · Lapangan ${match.field}` : ''}
        </span>
        <StatusBadge status={match.status} />
      </header>

      <div className={`flex items-stretch ${compact ? 'px-3 py-3' : 'px-4 py-4'}`}>
        <Side team={match.team_a} teamId={match.team_a_id} compact={compact} />
        <div className="flex min-w-[64px] flex-col items-center justify-center px-1">
          {isLive || isFinished ? (
            <p
              className="score-display text-4xl text-ink"
              aria-live="polite"
              aria-label={`${match.team_a?.name ?? 'Tim A'} ${match.score_a ?? 0}, ${match.team_b?.name ?? 'Tim B'} ${match.score_b ?? 0}`}
            >
              {match.score_a ?? 0}–{match.score_b ?? 0}
            </p>
          ) : (
            <p className="score-display text-3xl text-muted">{formatTime(match.kickoff_time)}</p>
          )}
          {!compact && (
            <span className="mt-1 font-mono text-xs text-muted">
              {match.stage === 'grup'
                ? `Grup ${match.group_name ?? '-'}`
                : match.stage === 'semifinal'
                  ? 'Semifinal'
                  : 'Final'}
            </span>
          )}
        </div>
        <Side team={match.team_b} teamId={match.team_b_id} compact={compact} />
      </div>
    </article>
  );
}

function Side({
  team,
  teamId,
  compact,
}: {
  team?: MatchWithTeams['team_a'];
  teamId: string;
  compact: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <Link href={`/tim/${teamId}`} aria-label={team?.name ?? 'Tim'}>
        <Monogram
          name={team?.name ?? 'Tim'}
          shortName={team?.short_name}
          color={team?.color}
          size={compact ? 32 : 40}
        />
      </Link>
      <Link
        href={`/tim/${teamId}`}
        className={`line-clamp-2 text-center font-bold leading-tight text-ink hover:text-blue ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        {team?.name ?? 'Tim'}
      </Link>
    </div>
  );
}
