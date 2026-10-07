import Link from 'next/link';
import type { MatchWithTeams } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import Monogram from './Monogram';
import ScorePair from './ScoreValue';
import Reveal from './Reveal';
import CategoryMark from './CategoryMark';
import StatusBadge from './StatusBadge';
import EventChips from './EventChips';

/**
 * Baris pertandingan: satu blok penuh, bukan kartu-kartu kecil.
 * Penanda jam di kiri menandai setiap gelombang (-> baris di bawahnya jam sama).
 */
export default function MatchRow({
  match,
  code,
  showCategory = true,
  index = 0,
}: {
  match: MatchWithTeams;
  code: string;
  showCategory?: boolean;
  index?: number;
}) {
  const a = match.team_a;
  const b = match.team_b;
  const isLive = match.status === 'live' || match.status === 'halftime';
  const isFinished = match.status === 'finished';

  const scoreA = match.score_a ?? 0;
  const scoreB = match.score_b ?? 0;

  let toneA = 'font-bold text-text';
  let toneB = 'font-bold text-text';
  if (isFinished) {
    if (scoreA > scoreB) {
      toneA = 'font-extrabold text-text';
      toneB = 'font-medium text-muted';
    } else if (scoreB > scoreA) {
      toneA = 'font-medium text-muted';
      toneB = 'font-extrabold text-text';
    }
  }

  return (
    <Reveal
      as="article"
      index={index}
      className={`row group mb-2.5 rounded-[26px] border ${
        isLive
          ? 'row-live border-yellow/35 bg-gradient-to-r from-yellow/10 to-blue/5'
          : 'border-line bg-white/[0.025] hover:border-blue/35 hover:bg-blue/[0.07]'
      }`}
    >
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="label text-muted">{code}</span>
          <span className="label text-muted">{formatTime(match.kickoff_time)}</span>
          {showCategory && match.category && (
            <CategoryMark category={match.category} field={match.field} />
          )}
          <span className="ml-auto">
            <StatusBadge status={match.status} />
          </span>
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className={`flex items-center gap-3 ${toneA}`}>
            <Link href={`/tim/${match.team_a_id}`} className="min-w-0">
              <Monogram name={a?.name ?? 'Tim A'} shortName={a?.short_name} color={a?.color} logo={a?.logo_url} />
            </Link>
            <Link
              href={`/tim/${match.team_a_id}`}
              className="truncate font-display text-[19px] leading-tight"
            >
              {a?.name ?? 'Tim A'}
            </Link>
          </div>

          {isLive || isFinished ? (
            <ScorePair
              a={scoreA}
              b={scoreB}
              label={`${a?.name ?? 'Tim A'} ${scoreA}, ${b?.name ?? 'Tim B'} ${scoreB}`}
            />
          ) : (
            <p className="num text-xl font-semibold tracking-normal text-muted">vs</p>
          )}

          <div className={`flex flex-row-reverse items-center gap-3 text-right ${toneB}`}>
            <Link href={`/tim/${match.team_b_id}`} className="min-w-0">
              <Monogram name={b?.name ?? 'Tim B'} shortName={b?.short_name} color={b?.color} logo={b?.logo_url} />
            </Link>
            <Link
              href={`/tim/${match.team_b_id}`}
              className="truncate font-display text-[19px] leading-tight"
            >
              {b?.name ?? 'Tim B'}
            </Link>
          </div>
        </div>

        <EventChips match={match} />
      </div>
    </Reveal>
  );
}