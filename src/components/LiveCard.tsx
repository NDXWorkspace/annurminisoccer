'use client';

import { useCallback, useRef, useState } from 'react';
import type { MatchWithTeams } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import CategoryMark from './CategoryMark';
import StatusBadge from './StatusBadge';
import ScorePair from './ScoreValue';
import Reveal from './Reveal';

/**
 * Kartu pertandingan LIVE. Dipakai beranda dan /live — satu sumber supaya
 * bingkai berputar, denyut gol, dan geraknya tidak pernah berbeda antar halaman.
 */
export default function LiveCard({ match, index = 0 }: { match: MatchWithTeams; index?: number }) {
  const [pulse, setPulse] = useState(0);

  const cheer = useCallback(() => {
    setPulse((k) => k + 1);
  }, []);

  return (
    <Reveal
      as="article"
      index={index}
      className="group relative isolate overflow-hidden rounded-[32px] bg-gradient-to-bl from-raise to-ink p-6"
    >
      <span
        aria-hidden
        className="animate-halo pointer-events-none absolute inset-0 -z-10 rounded-[32px] p-[1.5px]"
        style={{
          background:
            'conic-gradient(from var(--a), transparent 0 60%, var(--color-yellow) 82%, transparent 100%)',
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <span
        key={pulse}
        aria-hidden
        className={
          pulse > 0
            ? 'goal-pulse pointer-events-none absolute inset-0 rounded-[32px]'
            : 'pointer-events-none absolute inset-0 rounded-[32px]'
        }
      />

      <div className="relative flex items-center justify-between gap-3">
        {match.category ? (
          <CategoryMark category={match.category} field={match.field} />
        ) : (
          <span className="label text-muted">
            {match.field ? `Lapangan ${match.field}` : ''}
          </span>
        )}
        <StatusBadge status={match.status} />
      </div>

      <div className="relative mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className="truncate font-display text-[19px] font-bold leading-tight">
          {match.team_a?.name ?? 'Tim A'}
        </p>
        <ScorePair
          a={match.score_a ?? 0}
          b={match.score_b ?? 0}
          size="text-[clamp(64px,18vw,112px)] leading-none"
          label={`${match.team_a?.name ?? 'Tim A'} ${match.score_a ?? 0}, ${match.team_b?.name ?? 'Tim B'} ${match.score_b ?? 0}`}
          onGoal={cheer}
        />
        <p className="truncate text-right font-display text-[19px] font-bold leading-tight">
          {match.team_b?.name ?? 'Tim B'}
        </p>
      </div>

      <p className="label relative mt-4 text-muted">
        {match.match_date} · {formatTime(match.kickoff_time)}
      </p>
    </Reveal>
  );
}