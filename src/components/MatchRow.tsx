import Link from 'next/link';
import type { MatchWithTeams } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import Monogram from './Monogram';
import CategoryMark from './CategoryMark';
import StatusBadge from './StatusBadge';

/**
 * Baris Pertandingan (spesifikasi 7.1). Bukan kartu: satu baris penuh
 * dengan garis 1px di bawahnya. Tap target >= 56px.
 */
export default function MatchRow({
  match,
  code,
  showCategory = true,
}: {
  match: MatchWithTeams;
  code: string;
  showCategory?: boolean;
}) {
  const a = match.team_a;
  const b = match.team_b;
  const isLive = match.status === 'live' || match.status === 'halftime';
  const isFinished = match.status === 'finished';

  const scoreA = match.score_a ?? 0;
  const scoreB = match.score_b ?? 0;

  let toneA = 'font-bold text-ink';
  let toneB = 'font-bold text-ink';
  if (isFinished) {
    if (scoreA > scoreB) {
      toneA = 'font-extrabold text-ink';
      toneB = 'font-medium text-muted';
    } else if (scoreB > scoreA) {
      toneA = 'font-medium text-muted';
      toneB = 'font-extrabold text-ink';
    }
  }

  const scoreLabel = `${a?.name ?? 'Tim A'} ${scoreA}, ${b?.name ?? 'Tim B'} ${scoreB}`;

  return (
    <article
      className={`border-b border-rule bg-white px-4 py-3 ${
        isLive ? 'border-l-4 border-l-whistle bg-blue-tint' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[13px] text-muted">
          {code} · {formatTime(match.kickoff_time)}
          {showCategory && match.category ? (
            <>
              {' · '}
              <CategoryMark category={match.category} field={match.field} />
            </>
          ) : match.field ? (
            <> · Lapangan {match.field}</>
          ) : null}
        </p>
        <StatusBadge status={match.status} />
      </div>

      <div className="mt-2 flex min-h-[56px] items-center gap-3">
        <Monogram name={a?.name ?? 'Tim A'} shortName={a?.short_name} color={a?.color} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/tim/${match.team_a_id}`}
            className={`block truncate font-display text-[22px] leading-tight ${toneA}`}
          >
            {a?.name ?? 'Tim A'}
          </Link>
        </div>

        {isLive || isFinished ? (
          <p
            className="score-display shrink-0 text-5xl"
            aria-live="polite"
            aria-label={scoreLabel}
          >
            {scoreA}–{scoreB}
          </p>
        ) : (
          <p className="score-display shrink-0 text-5xl text-muted" aria-label="Belum mulai">
            –:–
          </p>
        )}

        <div className="min-w-0 flex-1 text-right">
          <Link
            href={`/tim/${match.team_b_id}`}
            className={`block truncate font-display text-[22px] leading-tight ${toneB}`}
          >
            {b?.name ?? 'Tim B'}
          </Link>
        </div>
        <Monogram name={b?.name ?? 'Tim B'} shortName={b?.short_name} color={b?.color} />
      </div>
    </article>
  );
}
