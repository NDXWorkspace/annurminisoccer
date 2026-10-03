'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ApiResponse, MatchWithTeams } from '@/lib/types';
import { formatShortDate, formatTime } from '@/lib/utils';
import { SEED_MATCHES } from '@/lib/seed';
import { useCategory } from '@/hooks/useCategory';
import MatchRow from '@/components/MatchRow';
import Reveal from '@/components/Reveal';

const STAGE_LABEL: Record<string, string> = {
  grup: 'Grup',
  semifinal: 'Semifinal',
  final: 'Final',
};

function dayLabel(dateStr: string): string {
  const weekday = new Date(`${dateStr}T12:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
  });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${formatShortDate(dateStr)}`;
}

export default function JadwalPage() {
  const [matches, setMatches] = useState<MatchWithTeams[]>(SEED_MATCHES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useCategory();
  const [date, setDate] = useState('');
  const [stage, setStage] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async (initial = false) => {
      try {
        if (initial) setLoading(true);
        const res = await fetch('/api/matches', { cache: 'no-store' });
        if (!res.ok) throw new Error('Gagal memuat jadwal');
        const data: ApiResponse<MatchWithTeams[]> = await res.json();
        if (data.success && data.data) {
          setMatches(data.data);
          const first = [...new Set(data.data.map((m) => m.match_date))].sort()[0];
          if (first) setDate((d) => d || first);
        }
        setError(null);
      } catch {
        if (initial) setError('Data tidak dapat dimuat.');
      } finally {
        if (initial) setLoading(false);
      }
    };
    load(true);
    const id = setInterval(() => load(false), 10_000);
    return () => clearInterval(id);
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(matches.map((m) => m.category).filter(Boolean))] as string[];
    return cats.sort();
  }, [matches]);
  const activeCategory = categories.includes(category) ? category : 'Semua';

  const dates = useMemo(() => [...new Set(matches.map((m) => m.match_date))].sort(), [matches]);
  const stages = useMemo(() => [...new Set(matches.map((m) => m.stage))].sort(), [matches]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = matches
      .filter((m) => (activeCategory === 'Semua' ? true : m.category === activeCategory))
      .filter((m) => (date ? m.match_date === date : true))
      .filter((m) => (stage === 'all' ? true : m.stage === stage))
      .filter((m) => {
        if (!q) return true;
        return (
          m.team_a?.name.toLowerCase().includes(q) ||
          m.team_b?.name.toLowerCase().includes(q) ||
          m.team_a?.short_name.toLowerCase().includes(q) ||
          m.team_b?.short_name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        `${a.match_date}${a.kickoff_time}`.localeCompare(`${b.match_date}${b.kickoff_time}`)
      );
    const map = new Map<string, MatchWithTeams[]>();
    for (const m of list) {
      const key = `${m.match_date} ${m.kickoff_time}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()];
  }, [matches, activeCategory, date, stage, query]);

  const select =
    'h-12 rounded-full border border-line bg-surface px-4 text-base text-text outline-none transition-colors focus:border-blue';

  return (
    <div className="wrap pt-12 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Reveal as="h1" className="rule-title font-display text-[30px] font-extrabold md:text-[46px]">
          Jadwal
        </Reveal>
        {categories.length > 0 && (
          <div className="pill gap-0.5 p-1" role="group" aria-label="Kategori">
            {['Semua', ...categories].map((c) => (
              <button
                key={c}
                aria-pressed={activeCategory === c}
                onClick={() => setCategory(c)}
                className={`label rounded-full px-5 py-2.5 transition-colors ${
                  activeCategory === c ? 'bg-text text-ink' : 'text-muted hover:text-text'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {dates.length > 1 && (
        <div role="tablist" aria-label="Hari" className="pill mt-5 gap-0.5 p-1">
          {dates.map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={date === d}
              onClick={() => setDate(d)}
              className={`label shrink-0 rounded-full px-4 py-2.5 transition-colors ${
                date === d
                  ? 'bg-blue/20 text-text shadow-[inset_0_0_0_1px_rgba(91,141,255,.45)]'
                  : 'text-muted'
              }`}
            >
              {dayLabel(d)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="j-q" className="label mb-1.5 block text-muted">
            Cari tim
          </label>
          <input
            id="j-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nama atau singkatan"
            className={`${select} w-full`}
          />
        </div>
        <div>
          <label htmlFor="j-stage" className="label mb-1.5 block text-muted">
            Fase
          </label>
          <select
            id="j-stage"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className={`${select} w-full`}
          >
            <option value="all">Semua fase</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s] ?? s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-full border border-danger/40 bg-danger/10 px-5 py-3">
          <p className="text-sm text-danger">{error}</p>
          <button onClick={() => window.location.reload()} className="label text-text">
            Coba lagi
          </button>
        </div>
      )}

      <div className="mt-6" aria-live="polite">
        {loading && groups.length === 0 ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-skeleton rounded-[26px] bg-raise" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="py-6 text-muted">
            {activeCategory === 'Semua'
              ? 'Jadwal belum diumumkan.'
              : `Jadwal ${activeCategory} belum diumumkan.`}
          </p>
        ) : (
          groups.map(([key, list]) => {
            const [d, t] = key.split(' ');
            return (
              <div key={key}>
                {activeCategory === 'Semua' && list.length > 1 && (
                  <div className="flex items-center gap-3.5 pb-3 pt-6">
                    <span className="num text-[28px]">{formatTime(t)}</span>
                    <span className="slot-dot flex-none" aria-hidden />
                    <span
                      className="h-px flex-1 bg-gradient-to-r from-line to-transparent"
                      aria-hidden
                    />
                    <span className="label text-muted">{dayLabel(d)}</span>
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
            );
          })
        )}
      </div>
    </div>
  );
}