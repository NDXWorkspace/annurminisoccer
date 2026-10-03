'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ApiResponse, MatchWithTeams } from '@/lib/types';
import { formatTime, formatShortDate } from '@/lib/utils';
import { SEED_MATCHES } from '@/lib/seed';

interface RailItem {
  key: string;
  status: MatchWithTeams['status'];
  label: string;
  a: string;
  b: string;
  scoreA: number | null;
  scoreB: number | null;
  meta: string;
}

/**
 * Ticker hasil: apa yang sudah dimuatultimate, berjalan pelan di bawah header.
 * Berhenti saat kursor mendekat supaya angka masih bisa dibaca.
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
        // strip ini informatif; kegagalan poll membiarkan snapshot terakhir
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
      status: m.status,
      label:
        m.status === 'halftime'
          ? 'Istirahat'
          : m.status === 'finished'
            ? 'Selesai'
            : m.status === 'live'
              ? 'Live'
              : 'Kickoff',
      a: m.team_a?.short_name ?? '?',
      b: m.team_b?.short_name ?? '?',
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

  // Digandakan sekali supaya -50% berputar tanpa sambungan
  const loop = [...items, ...items];

  return (
    <div className="rail-host relative mt-3.5 overflow-hidden whitespace-nowrap rounded-full border border-line bg-white/[0.025] [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="animate-marquee inline-flex">
        {loop.map((item, idx) => {
          const isLive = item.status === 'live' || item.status === 'halftime';
          const hasScore = item.scoreA !== null && item.scoreB !== null;
          return (
            <Link
              key={`${item.key}-${idx}`}
              href="/live"
              className="inline-flex items-center gap-2 px-5 py-3"
            >
              <span
                className={`label ${isLive ? 'text-yellow' : 'text-muted'}`}
              >
                {isLive && (
                  <span
                    className="mr-1.5 inline-block h-[7px] w-[7px] rounded-full bg-yellow animate-pulse-dot align-middle"
                    aria-hidden
                  />
                )}
                {item.label}
              </span>
              <span className="text-sm font-semibold text-muted">
                {item.a}
                <span className="num mx-1.5 text-base text-text">
                  {hasScore ? `${item.scoreA}–${item.scoreB}` : formatTime(item.meta.split('·').pop()?.trim() ?? '00:00')}
                </span>
                {item.b}
              </span>
              <span className="label text-muted/70">{item.meta}</span>
              <span className="h-3 w-px bg-line" aria-hidden />
            </Link>
          );
        })}
      </div>
    </div>
  );
}