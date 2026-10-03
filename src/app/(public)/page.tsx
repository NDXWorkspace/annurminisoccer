'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ApiResponse, EventSettings, MatchWithTeams } from '@/lib/types';
import { SEED_MATCHES, SEED_SETTINGS } from '@/lib/seed';
import { formatShortDate, formatTime, todayWIB } from '@/lib/utils';
import { useCategory } from '@/hooks/useCategory';
import MatchRow from '@/components/MatchRow';
import CategoryMark from '@/components/CategoryMark';
import StatusBadge from '@/components/StatusBadge';

function dayLabel(dateStr: string): string {
  const weekday = new Date(`${dateStr}T12:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
  });
  const short = formatShortDate(dateStr);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${short}`;
}

function stamp(date: Date): string {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function BerandaPage() {
  const [matches, setMatches] = useState<MatchWithTeams[]>(SEED_MATCHES);
  const [settings, setSettings] = useState<EventSettings | null>(SEED_SETTINGS);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [offline, setOffline] = useState(false);
  const [category, setCategory] = useCategory();
  const [day, setDay] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [m, s] = await Promise.all([
          fetch('/api/matches', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
        ]);
        const mData: ApiResponse<MatchWithTeams[]> = await m.json().catch(() => ({}));
        const sData: ApiResponse<EventSettings> = await s.json().catch(() => ({}));
        if (cancelled) return;
        if (mData.success && mData.data) {
          setMatches(mData.data);
          setUpdatedAt(stamp(new Date()));
          setOffline(false);
        }
        if (sData.success && sData.data) setSettings(sData.data);
      } catch {
        if (!cancelled) setOffline(true);
      }
    };
    load();
    const id = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(matches.map((m) => m.category).filter(Boolean))] as string[];
    return cats.sort();
  }, [matches]);

  const activeCategory = categories.includes(category) ? category : 'Semua';

  const days = useMemo(
    () => [...new Set(matches.map((m) => m.match_date))].sort(),
    [matches]
  );

  useEffect(() => {
    if (!day && days.length > 0) {
      const today = todayWIB();
      setDay(days.includes(today) ? today : days[0]);
    }
  }, [days, day]);

  const byKickoff = (a: MatchWithTeams, b: MatchWithTeams) =>
    `${a.match_date}${a.kickoff_time}`.localeCompare(`${b.match_date}${b.kickoff_time}`);

  const live = useMemo(
    () =>
      matches
        .filter((m) => m.status === 'live' || m.status === 'halftime')
        .filter((m) => activeCategory === 'Semua' || m.category === activeCategory)
        .sort(byKickoff)
        .slice(0, 2),
    [matches, activeCategory]
  );

  const dayMatches = useMemo(
    () =>
      matches
        .filter((m) => (day ? m.match_date === day : true))
        .filter((m) => activeCategory === 'Semua' || m.category === activeCategory)
        .sort(byKickoff),
    [matches, day, activeCategory]
  );

  const groups = useMemo(() => {
    const map = new Map<string, MatchWithTeams[]>();
    for (const m of dayMatches) {
      const key = m.kickoff_time;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [dayMatches]);

  const dateLabel = (() => {
    const start = settings?.start_date || '2026-10-09';
    const end = settings?.end_date || '2026-10-10';
    if (start === end) return formatShortDate(start);
    return `${formatShortDate(start)}–${formatShortDate(end)}`;
  })();
  const location = settings?.location || 'Lapangan An-Nur';

  return (
    <>
      {/* ============ HERO papan skor ============ */}
      <section className="relative overflow-hidden bg-ink text-white">
        {/* Motif garis lapangan: setengah lingkaran + garis tengah, terpotong tepi */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[1.5px] border-white/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-12 h-px w-72 bg-white/20"
        />
        <div className="relative mx-auto w-full max-w-[1080px] px-4 py-10">
          <p className="font-mono text-[13px] text-white/70">
            9–10 Oktober 2026 · {location}
          </p>
          <h1 className="mt-1 font-display text-[56px] font-extrabold leading-[0.95] md:text-[96px]">
            {dateLabel}
          </h1>
          <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-white/80">
            Turnamen mini soccer An-Nur. Jadwal dan skor diperbarui langsung oleh
            panitia.
          </p>
          {updatedAt && (
            <p className="mt-4 font-mono text-[13px] text-white/70">
              Diperbarui {updatedAt}
            </p>
          )}
        </div>
      </section>

      {offline && (
        <div className="border-b border-rule bg-white">
          <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-2 px-4 py-2">
            <p className="text-sm text-muted">
              Koneksi terputus. Menampilkan data terakhir
              {updatedAt ? ` (${updatedAt})` : ''}.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="h-11 rounded-[4px] border-[1.5px] border-ink px-4 font-display text-sm font-bold uppercase text-ink"
            >
              Muat ulang
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[1080px] px-4 py-8">
        {/* ============ SEDANG BERLANGSUNG (hanya jika ada) ============ */}
        {live.length > 0 && (
          <section aria-label="Sedang berlangsung" className="mb-10">
            <div className="rule-double pt-3">
              <h2 className="font-display text-[32px] font-extrabold leading-none text-ink md:text-[44px]">
                Sedang berlangsung
              </h2>
            </div>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {live.map((m) => (
                <div key={m.id} className="border border-rule bg-white">
                  <div className="flex items-center justify-between gap-2 border-b border-rule px-4 py-2">
                    {m.category ? (
                      <CategoryMark category={m.category} field={m.field} />
                    ) : (
                      <span className="font-mono text-xs text-muted">
                        {m.field ? `Lapangan ${m.field}` : ''}
                      </span>
                    )}
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="flex items-center gap-3 px-4 py-4">
                    <p className="min-w-0 flex-1 truncate font-display text-2xl font-bold text-ink">
                      {m.team_a?.name ?? 'Tim A'}
                    </p>
                    <p
                      className="score-display shrink-0 text-[96px] text-ink md:text-[144px]"
                      aria-live="polite"
                      aria-label={`${m.team_a?.name ?? 'Tim A'} ${m.score_a ?? 0}, ${m.team_b?.name ?? 'Tim B'} ${m.score_b ?? 0}`}
                    >
                      {m.score_a ?? 0}–{m.score_b ?? 0}
                    </p>
                    <p className="min-w-0 flex-1 truncate text-right font-display text-2xl font-bold text-ink">
                      {m.team_b?.name ?? 'Tim B'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ JADWAL ============ */}
        <section aria-label="Jadwal pertandingan">
          <div className="rule-double pt-3">
            <h2 className="font-display text-[32px] font-extrabold leading-none text-ink md:text-[44px]">
              Jadwal
            </h2>
          </div>

          {categories.length > 0 && (
            <div
              role="group"
              aria-label="Kategori"
              className="mt-4 grid grid-cols-3 border border-rule bg-white"
            >
              {['Semua', ...categories].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  aria-pressed={activeCategory === c}
                  className={`h-12 font-display text-base font-bold uppercase ${
                    activeCategory === c ? 'bg-blue text-white' : 'text-ink'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {days.length > 1 && (
            <div role="tablist" aria-label="Hari" className="mt-4 flex gap-6 border-b border-rule">
              {days.map((d) => (
                <button
                  key={d}
                  role="tab"
                  aria-selected={day === d}
                  onClick={() => setDay(d)}
                  className={`h-12 font-display text-base font-bold uppercase ${
                    day === d
                      ? 'border-b-[3px] border-blue text-blue'
                      : 'text-muted'
                  }`}
                >
                  {dayLabel(d)}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 border-t border-rule">
            {groups.length === 0 ? (
              <p className="border-b border-rule bg-white px-4 py-8 text-muted">
                {activeCategory === 'Semua'
                  ? 'Jadwal belum diumumkan.'
                  : `Jadwal ${activeCategory} belum diumumkan.`}
              </p>
            ) : (
              groups.map(([time, list]) => (
                <div key={time}>
                  {activeCategory === 'Semua' && list.length > 1 && (
                    <p className="score-display border-b border-rule bg-white px-4 pt-4 text-3xl text-ink">
                      {formatTime(time)}
                    </p>
                  )}
                  {list.map((m, i) => (
                    <MatchRow
                      key={m.id}
                      match={m}
                      code={`M-${String(i + 1).padStart(2, '0')}`}
                      showCategory={activeCategory === 'Semua'}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
