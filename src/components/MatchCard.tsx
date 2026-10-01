'use client';

import { MatchWithTeams } from '@/lib/types';
import { formatTime, formatShortDate } from '@/lib/utils';
import TeamBadge from './TeamBadge';
import Link from 'next/link';

interface MatchCardProps {
  match: MatchWithTeams;
  compact?: boolean;
  priority?: boolean;
}

const STATUS_META: Record<string, { label: string; className: string; dot?: boolean }> = {
  live: { label: 'Live', className: 'text-live-red border-live-red/40 bg-live-red/10', dot: true },
  halftime: { label: 'Istirahat', className: 'text-amber border-amber/40 bg-amber/10' },
  finished: { label: 'Selesai', className: 'text-chalk-faint border-line bg-white/5' },
  scheduled: { label: 'Akan datang', className: 'text-flood border-flood/30 bg-flood/8' },
};

export default function MatchCard({ match, compact = false }: MatchCardProps) {
  const isLive = match.status === 'live' || match.status === 'halftime';
  const isFinished = match.status === 'finished';
  const status = STATUS_META[match.status] ?? STATUS_META.scheduled;

  return (
    <article
      className={[
        'group relative overflow-hidden rounded-[14px] border border-line bg-ink-raised',
        'transition-[transform,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-line-bright',
        isLive ? 'border-live-red/35 shadow-[0_0_0_1px_rgba(255,45,85,0.12),0_18px_40px_-24px_rgba(255,45,85,0.55)]' : '',
      ].join(' ')}
    >
      {/* Team colour rails — the card's identity comes from the clubs, not the palette */}
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: match.team_a?.color ?? '#d3ff3f' }}
        aria-hidden
      />
      <span
        className="absolute inset-y-0 right-0 w-[3px]"
        style={{ backgroundColor: match.team_b?.color ?? '#2a3a52' }}
        aria-hidden
      />

      {/* Masthead */}
      <header
        className={`flex items-center justify-between gap-2 border-b border-line ${compact ? 'px-3.5 py-2' : 'px-4 py-2.5'}`}
      >
        <span className="label-programme truncate text-chalk-faint">
          {formatShortDate(match.match_date)} · {formatTime(match.kickoff_time)}
          {match.field ? ` · Lap ${match.field}` : ''}
        </span>

        <span
          className={`label-programme flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-[3px] ${status.className}`}
        >
          {status.dot && <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-live-pulse" />}
          {status.label}
        </span>
      </header>

      {/* Scoreboard */}
      <div className={`flex items-stretch ${compact ? 'px-3.5 py-3' : 'px-4 py-4'}`}>
        <Side team={match.team_a} teamId={match.team_a_id} align="left" compact={compact} />

        <div className="flex min-w-[64px] flex-col items-center justify-center px-1">
          {isLive || isFinished ? (
            <div className="flex items-center gap-1.5">
              <span
                className={`score-plate text-[2.1rem] tabular-nums transition-colors ${
                  isLive ? 'text-flood' : 'text-chalk'
                }`}
              >
                {match.score_a ?? 0}
              </span>
              <span className="score-plate text-lg text-chalk-faint">–</span>
              <span
                className={`score-plate text-[2.1rem] tabular-nums transition-colors ${
                  isLive ? 'text-flood' : 'text-chalk'
                }`}
              >
                {match.score_b ?? 0}
              </span>
            </div>
          ) : (
            <span className="score-plate rounded-md border border-line bg-ink-sunken px-2.5 py-1 text-xl text-chalk">
              {formatTime(match.kickoff_time)}
            </span>
          )}

          {!compact && (
            <span className="label-programme mt-1.5 text-chalk-faint">
              {match.stage === 'grup'
                ? `Grup ${match.group_name ?? '-'}`
                : match.stage === 'semifinal'
                  ? 'Semifinal'
                  : 'Final'}
            </span>
          )}
        </div>

        <Side team={match.team_b} teamId={match.team_b_id} align="right" compact={compact} />
      </div>
    </article>
  );
}

function Side({
  team,
  teamId,
  align,
  compact,
}: {
  team?: MatchWithTeams['team_a'];
  teamId: string;
  align: 'left' | 'right';
  compact: boolean;
}) {
  const isLeft = align === 'left';

  return (
    <div className={`flex flex-1 flex-col items-center gap-1.5 ${isLeft ? '' : ''}`}>
      {team ? (
        <Link href={`/tim/${teamId}`} className="rounded-full transition-transform duration-300 hover:scale-105">
          <TeamBadge team={team} size={compact ? 'sm' : 'md'} />
        </Link>
      ) : (
        <div className="h-12 w-12 rounded-full bg-ink-sunken ring-1 ring-line" />
      )}

      <Link
        href={`/tim/${teamId}`}
        className={`text-center font-medium leading-tight text-chalk transition-colors hover:text-flood ${
          compact ? 'line-clamp-2 text-[11px]' : 'line-clamp-2 text-sm'
        }`}
      >
        {team?.name ?? 'Tim'}
      </Link>
    </div>
  );
}
