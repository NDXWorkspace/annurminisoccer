'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ApiResponse, EventSettings, MatchWithTeams } from '@/lib/types';
import { SEED_MATCHES, SEED_SETTINGS } from '@/lib/seed';
import { formatShortDate, formatTime, todayWIB } from '@/lib/utils';
import { useCategory } from '@/hooks/useCategory';
import MatchRow from '@/components/MatchRow';
import CategoryMark from '@/components/CategoryMark';
import StatusBadge from '@/components/StatusBadge';
import LiveCard from '@/components/LiveCard';
import Countdown from '@/components/Countdown';
import PitchGraphic from '@/components/PitchGraphic';

function stamp(date: Date): string {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(dateStr: string): string {
  const weekday = new Date(`${dateStr}T12:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
  });
  const short = formatShortDate(dateStr);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${short}`;
}

export default function BerandaPage() {
  const [matches, setMatches] = useState<MatchWithTeams[]>(SEED_MATCHES);
  const [settings, setSettings] = useState<EventSettings | null>(SEED_SETTINGS);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [offline, setOffline] = useState(false);
  const [category, setCategory] = useCategory();

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

  const days = useMemo(() => [...new Set(matches.map((m) => m.match_date))].sort(), [matches]);

  const [day, setDay] = useState('');
  useEffect(() => {
    if (!day && days.length > 0) {
      const today = todayWIB();
      setDay(days.includes(today) ? today : days[0]);
    }
  }, [days, day]);

  const groups = useMemo(() => {
    const list = matches
      .filter((m) => (day ? m.match_date === day : true))
      .filter((m) => activeCategory === 'Semua' || m.category === activeCategory)
      .sort(byKickoff);
    const map = new Map<string, MatchWithTeams[]>();
    for (const m of list) {
      const key = m.kickoff_time;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()];
  }, [matches, day, activeCategory]);

  const start = settings?.start_date || '2026-10-09';
  const end = settings?.end_date || '2026-10-10';
  const [sy, sm] = start.split('-');
  const [ey, em] = end.split('-');
  const sameMonth = sy === ey && sm === em;
  const dayEnd = Number(end.split('-')[2]);
  const monthYear = formatShortDate(end).split(' ').slice(1).join(' ');
  const topLine = sameMonth ? `${Number(start.split('-')[2])}–${dayEnd} ${monthYear.split(' ')[0].toUpperCase()}` : formatShortDate(start).toUpperCase();

  return (
    <>
      {/* ============ HERO papan skor ============ */}
      <section className="relative -mt-[76px] overflow-hidden rounded-b-[44px] border-b border-line pb-7 pt-[150px]">
        <PitchGraphic />
        <div className="wrap relative z-10">
          <h1 className="num text-[clamp(54px,15.5vw,132px)] leading-none">
            <span className="hero-line">
              <b>{topLine}</b>
            </span>
            <span className="hero-line">
              <b>{sameMonth ? monthYear.split(' ')[1] : formatShortDate(start).split(' ')[1]}</b>
            </span>
          </h1>
          <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-muted">
            Turnamen mini soccer An-Nur. Jadwal dan skor diperbarui langsung oleh panitia.
          </p>
          <Countdown target={`${start}T09:00:00+07:00`} />
          {updatedAt && (
            <p className="label mt-4 text-muted/70">Diperbarui {updatedAt}</p>
          )}
        </div>
      </section>

      {offline && (
        <div className="wrap pt-4">
          <div className="flex items-center justify-between gap-3 rounded-full border border-line bg-surface px-5 py-2.5">
            <p className="text-sm text-muted">Koneksi terputus. Menampilkan data terakhir.</p>
            <Link href="/" className="label text-blue">
              Muat ulang
            </Link>
          </div>
        </div>
      )}

      {/* ============ SEDANG BERLANGSUNG ============ */}
      {live.length > 0 && (
        <section aria-label="Sedang berlangsung" className="pt-12">
          <h2 className="rule-title font-display text-[30px] font-extrabold md:text-[46px]">
            Sedang berlangsung
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {live.map((m, i) => (
              <LiveCard key={m.id} match={m} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ============ JADWAL ============ */}
      <section aria-label="Jadwal pertandingan" className="pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="rule-title font-display text-[30px] font-extrabold md:text-[46px]">
            Jadwal
          </h2>
          {categories.length > 0 && (
            <CategoryFilter
              categories={categories}
              active={activeCategory}
              onChange={setCategory}
            />
          )}
        </div>

        {days.length > 1 && (
          <div role="tablist" aria-label="Hari" className="pill mt-4 gap-1 p-1.5">
            {days.map((d) => (
              <button
                key={d}
                role="tab"
                aria-selected={day === d}
                onClick={() => setDay(d)}
                className={`label rounded-full px-4 py-2.5 transition-colors ${
                  day === d
                    ? 'bg-blue/20 text-text shadow-[inset_0_0_0_1px_rgba(91,141,255,.45)]'
                    : 'text-muted'
                }`}
              >
                {dayLabel(d)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4" aria-live="polite">
          {groups.length === 0 ? (
            <p className="py-6 text-muted">
              {activeCategory === 'Semua'
                ? 'Jadwal belum diumumkan.'
                : `Jadwal ${activeCategory} belum diumumkan.`}
            </p>
          ) : (
            groups.map(([time, list]) => (
              <div key={time}>
                {activeCategory === 'Semua' && list.length > 1 && (
                  <div className="flex items-center gap-3.5 pb-3 pt-6">
                    <span className="num text-[28px]">{formatTime(time)}</span>
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-blue" aria-hidden />
                    <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" aria-hidden />
                  </div>
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
    </>
  );
}

/** Filter kategori: pil, pilihan aktif jadi latar terang. */
function CategoryFilter({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (c: string) => void;
}) {
  const options = ['Semua', ...categories];

  return (
    <div className="pill gap-0.5 p-1" role="group" aria-label="Kategori">
      {options.map((c) => (
        <button
          key={c}
          aria-pressed={active === c}
          onClick={() => onChange(c)}
          className={`label rounded-full px-5 py-2.5 transition-colors ${
            active === c ? 'bg-text text-ink' : 'text-muted hover:text-text'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}