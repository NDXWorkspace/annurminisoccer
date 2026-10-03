import type { MatchWithTeams } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import CategoryMark from './CategoryMark';
import StatusBadge from './StatusBadge';
import ScorePair from './ScoreValue';

/**
 * Kartu pertandingan LIVE. Dipakai beranda dan /live — satu sumber supaya
 * bingkai berputar, skor, dan geraknya tidak pernah berbeda antar halaman.
 */
export default function LiveCard({ match, index = 0 }: { match: MatchWithTeams; index?: number }) {
  return (
    <article
      style={{ ['--i' as string]: index }}
      className="animate-reveal relative isolate overflow-hidden rounded-[32px] bg-gradient-to-bl from-raise to-ink p-6 before:absolute before:inset-0 before:-z-10 before:rounded-[32px] before:p-[1.5px] before:bg-[conic-gradient(from_var(--a),transparent_0_60%,var(--color-yellow)_82%,transparent_100%)] before:[-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] before:[mask-composite:exclude] animate-halo"
    >
      <div className="flex items-center justify-between gap-3">
        {match.category ? (
          <CategoryMark category={match.category} field={match.field} />
        ) : (
          <span className="label text-muted">
            {match.field ? `Lapangan ${match.field}` : ''}
          </span>
        )}
        <StatusBadge status={match.status} />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className="truncate font-display text-[19px] font-bold leading-tight">
          {match.team_a?.name ?? 'Tim A'}
        </p>
        <ScorePair
          a={match.score_a ?? 0}
          b={match.score_b ?? 0}
          size="text-[clamp(64px,18vw,112px)] leading-none"
          label={`${match.team_a?.name ?? 'Tim A'} ${match.score_a ?? 0}, ${match.team_b?.name ?? 'Tim B'} ${match.score_b ?? 0}`}
        />
        <p className="truncate text-right font-display text-[19px] font-bold leading-tight">
          {match.team_b?.name ?? 'Tim B'}
        </p>
      </div>

      <p className="label mt-4 text-muted">
        {match.match_date} · {formatTime(match.kickoff_time)}
      </p>
    </article>
  );
}