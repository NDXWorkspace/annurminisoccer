'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MatchWithTeams, ApiResponse } from '@/lib/types';
import { formatTime, formatShortDate } from '@/lib/utils';
import { SEED_MATCHES } from '@/lib/seed';

interface RailItem {
  key: string;
  href: string;
  status: MatchWithTeams['status'];
  label: string;
  a: string;
  b: string;
  scoreA: number | null;
  scoreB: number | null;
  meta: string;
}

/**
 * Signature element: a continuously scrolling matchday rail.
 * Live fixtures lead, then the next kickoffs, then fresh results.
 * Hovering pauses the scroll so a fixture can actually be read.
 */
export default function MatchdayRail() {
  const [matches, setMatches] = useState<MatchWithTeams[]>(SEED_MATCHES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/matches', { cache: 'no-store' });
        if (!res.ok) return;
        const data: ApiResponse<MatchWithTeams[]> = await res.json();
        if (!cancelled && data.success && data.data) setMatches(data.data);
      } catch {
        // rail is decorative; a failed poll just leaves the last snapshot in place
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    load();
    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const items = useMemo<RailItem[]>(() => {
    if (matches.length === 0) return [];

    const bySoonest = (a: MatchWithTeams, b: MatchWithTeams) =>
      `${a.match_date}${a.kickoff_time}`.localeCompare(`${b.match_date}${b.kickoff_time}`);

    const live = matches
      .filter((m) => m.status === 'live' || m.status === 'halftime')
      .sort(bySoonest);

    const next = matches.filter((m) => m.status === 'scheduled').sort(bySoonest).slice(0, 6);

    const done = matches
      .filter((m) => m.status === 'finished')
      .sort((a, b) =>
        `${b.match_date}${b.kickoff_time}`.localeCompare(`${a.match_date}${a.kickoff_time}`)
      )
      .slice(0, 4);

    const toItem = (m: MatchWithTeams, meta: string): RailItem => ({
      key: m.id,
      href: '/live',
      status: m.status,
      label: m.status === 'halftime' ? 'Istirahat' : m.status === 'finished' ? 'Full time' : m.status === 'live' ? 'Live' : 'Kickoff',
      a: m.team_a?.short_name ?? '???',
      b: m.team_b?.short_name ?? '???',
      scoreA: m.status === 'scheduled' ? null : (m.score_a ?? 0),
      scoreB: m.status === 'scheduled' ? null : (m.score_b ?? 0),
      meta,
    });

    return [
      ...live.map((m) => toItem(m, `Lapangan ${m.field}`)),
      ...next.map((m) => toItem(m, `${formatShortDate(m.match_date)} · ${formatTime(m.kickoff_time)}`)),
      ...done.map((m) => toItem(m, `${formatShortDate(m.match_date)} · Selesai`)),
    ];
  }, [matches]);

  if (!loaded || items.length === 0) return null;

  // Duplicated once so the -50% translate loops seamlessly
  const loop = [...items, ...items];
  const duration = Math.max(28, items.length * 11);

  return (
    <div className="rail-host relative border-y border-line bg-ink-sunken/80 backdrop-blur-sm">
      <div className="label-programme pointer-events-none absolute left-0 top-0 z-10 flex h-full items-center bg-gradient-to-r from-ink-sunken via-ink-sunken/90 to-transparent px-3 text-chalk-faint sm:px-4">
        Rail
      </div>

      <div className="rail-track overflow-hidden py-2 pl-16 sm:pl-20">
        <div
          className="animate-rail flex w-max items-center gap-6"
          style={{ ['--rail-duration' as string]: `${duration}s` }}
        >
          {loop.map((item, idx) => (
            <RailEntry key={`${item.key}-${idx}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RailEntry({ item }: { item: RailItem }) {
  const isLive = item.status === 'live' || item.status === 'halftime';
  const isDone = item.status === 'finished';
  const hasScore = item.scoreA !== null && item.scoreB !== null;

  return (
    <Link
      href={item.href}
      className="group flex shrink-0 items-center gap-2.5 whitespace-nowrap transition-opacity hover:opacity-100 opacity-80"
    >
      <span
        className={`label-programme flex items-center gap-1.5 ${
          isLive ? 'text-live-red' : isDone ? 'text-chalk-faint' : 'text-flood'
        }`}
      >
        {isLive && <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-live-pulse" />}
        {item.label}
      </span>

      <span className="font-display text-sm font-semibold tracking-wide text-chalk group-hover:text-flood transition-colors">
        {item.a}
        <span className="mx-1.5 text-chalk-faint">/</span>
        {item.b}
      </span>

      <span
        className={`score-plate text-sm ${
          isLive ? 'text-flood' : isDone ? 'text-chalk-dim' : 'text-chalk'
        }`}
      >
        {hasScore ? `${item.scoreA}–${item.scoreB}` : formatTime(item.meta.split('·').pop()?.trim() ?? '00:00')}
      </span>

      <span className="text-[11px] text-chalk-faint">{item.meta}</span>

      <span className="h-3 w-px bg-line" aria-hidden />
    </Link>
  );
}
