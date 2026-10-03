'use client';

import { useEffect, useState, useMemo } from 'react';
import type { ApiResponse, MatchWithTeams } from '@/lib/types';
import { formatShortDate, formatTime } from '@/lib/utils';
import { SEED_MATCHES } from '@/lib/seed';
import { useCategory } from '@/hooks/useCategory';
import MatchRow from '@/components/MatchRow';

const STAGE_LABEL: Record<string, string> = {
  grup: 'Grup',
  semifinal: 'Semifinal',
  final: 'Final',
};

function dayLabel(dateStr: string): string {
  const weekday = new Date(`${dateStr}T12:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
  });
  const short = formatShortDate(dateStr);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${short}`;
}

export default function JadwalPage() {
  const [matches, setMatches] = useState<MatchWithTeams[]>(SEED_MATCHES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useCategory();
  const [date, setDate] = useState('');
  const [stage, setStage] = useState('all');
  const [field, setField] = useState('all');
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
  const fields = useMemo(
    () => [...new Set(matches.map((m) => m.field).filter(Boolean) as string[])].sort(),
    [matches]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matches
      .filter((m) => {
        if (activeCategory !== 'Semua' && m.category !== activeCategory) return false;
        if (date && m.match_date !== date) return false;
        if (stage !== 'all' && m.stage !== stage && m.group_name !== stage) return false;
        if (field !== 'all' && m.field !== field) return false;
        if (q) {
          const hit =
            m.team_a?.name.toLowerCase().includes(q) ||
            m.team_b?.name.toLowerCase().includes(q) ||
            m.team_a?.short_name.toLowerCase().includes(q) ||
            m.team_b?.short_name.toLowerCase().includes(q);
          if (!hit) return false;
        }
        return true;
      })
      .sort((a, b) => `${a.match_date}${a.kickoff_time}`.localeCompare(`${b.match_date}${b.kickoff_time}`));
  }, [matches, activeCategory, date, stage, field, query]);

  const groups = useMemo(() => {
    const map = new Map<string, MatchWithTeams[]>();
    for (const m of filtered) {
      const key = `${m.match_date} ${m.kickoff_time}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()];
  }, [filtered]);

  const inputCls =
    'h-[52px] w-full rounded-[2px] border-[1.5px] border-rule bg-white px-3 text-base text-ink outline-none focus:border-blue';

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-8">
      <div className="rule-double pt-3">
        <h1 className="font-display text-[32px] font-extrabold leading-none text-ink md:text-[44px]">
          Jadwal pertandingan
        </h1>
      </div>

      {categories.length > 0 && (
        <div role="group" aria-label="Kategori" className="mt-4 grid grid-cols-3 border border-rule bg-white">
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

      {dates.length > 1 && (
        <div role="tablist" aria-label="Hari" className="mt-4 flex gap-6 overflow-x-auto border-b border-rule">
          {dates.map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={date === d}
              onClick={() => setDate(d)}
              className={`h-12 shrink-0 font-display text-base font-bold uppercase ${
                date === d ? 'border-b-[3px] border-blue text-blue' : 'text-muted'
              }`}
            >
              {dayLabel(d)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="j-q" className="label block text-ink">Cari tim</label>
          <input
            id="j-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nama tim"
            className={`${inputCls} mt-1.5`}
          />
        </div>
        <div>
          <label htmlFor="j-stage" className="label block text-ink">Fase</label>
          <select
            id="j-stage"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className={`${inputCls} mt-1.5`}
          >
            <option value="all">Semua fase</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s] ?? s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="j-field" className="label block text-ink">Lapangan</label>
          <select
            id="j-field"
            value={field}
            onChange={(e) => setField(e.target.value)}
            className={`${inputCls} mt-1.5`}
          >
            <option value="all">Semua lapangan</option>
            {fields.map((f) => (
              <option key={f} value={f}>
                Lapangan {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-alert bg-white px-4 py-3">
          <p className="text-sm text-alert">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="h-11 rounded-[4px] border-[1.5px] border-ink px-4 font-display text-sm font-bold uppercase text-ink"
          >
            Coba lagi
          </button>
        </div>
      )}

      <div className="mt-4 border-t border-rule">
        {loading && filtered.length === 0 ? (
          <div className="border-b border-rule bg-white px-4 py-8">
            <div className="h-8 w-1/2 bg-rule" />
            <div className="mt-3 h-4 w-1/3 bg-rule" />
          </div>
        ) : groups.length === 0 ? (
          <p className="border-b border-rule bg-white px-4 py-8 text-muted">
            {activeCategory === 'Semua' ? 'Jadwal belum diumumkan.' : `Jadwal ${activeCategory} belum diumumkan.`}
          </p>
        ) : (
          groups.map(([key, list]) => {
            const [d, t] = key.split(' ');
            return (
              <div key={key}>
                {activeCategory === 'Semua' && list.length > 1 && (
                  <p className="score-display border-b border-rule bg-white px-4 pt-4 text-3xl text-ink">
                    {formatTime(t)}
                    <span className="ml-3 align-middle font-mono text-xs font-medium text-muted">
                      {dayLabel(d)}
                    </span>
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
            );
          })
        )}
      </div>
    </div>
  );
}
