'use client';

import { useEffect, useState, useMemo } from 'react';
import { MatchWithTeams, ApiResponse } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { SEED_MATCHES } from '@/lib/seed';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';

const STAGE_LABEL: Record<string, string> = {
  grup: 'Penyisian grup',
  semifinal: 'Semifinal',
  final: 'Final',
};

export default function JadwalPage() {
  const [matches, setMatches] = useState<MatchWithTeams[]>(SEED_MATCHES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [stage, setStage] = useState('all');
  const [field, setField] = useState('all');

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
        if (initial) setError('Gagal memuat data. Silakan coba lagi.');
      } finally {
        if (initial) setLoading(false);
      }
    };

    load(true);
    const id = setInterval(() => load(false), 10_000);
    return () => clearInterval(id);
  }, []);

  const dates = useMemo(() => [...new Set(matches.map((m) => m.match_date))].sort(), [matches]);
  const stages = useMemo(() => [...new Set(matches.map((m) => m.stage))].sort(), [matches]);
  const fields = useMemo(
    () => [...new Set(matches.map((m) => m.field).filter(Boolean) as string[])].sort(),
    [matches]
  );

  const filtered = useMemo(
    () =>
      matches
        .filter((m) => {
          if (date && m.match_date !== date) return false;
          if (stage !== 'all' && m.stage !== stage && m.group_name !== stage) return false;
          if (field !== 'all' && m.field !== field) return false;
          return true;
        })
        .sort((a, b) => `${a.match_date}${a.kickoff_time}`.localeCompare(`${b.match_date}${b.kickoff_time}`)),
    [matches, date, stage, field]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <span className="label-programme text-flood">Programme</span>
        <h1 className="mt-1.5 font-display text-4xl font-extrabold uppercase tracking-[0.02em] text-chalk sm:text-5xl">
          Jadwal <span className="text-flood">Pertandingan</span>
        </h1>
      </header>

      {/* Filter console */}
      <div className="mb-8 rounded-[14px] border border-line bg-ink-raised p-4 sm:p-5">
        {dates.length > 0 && (
          <div className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto pb-1">
            {dates.map((d) => (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={`shrink-0 rounded-lg border px-3.5 py-2 font-display text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
                  date === d
                    ? 'border-flood bg-flood text-ink'
                    : 'border-line bg-ink-sunken text-chalk-dim hover:border-line-bright hover:text-chalk'
                }`}
              >
                {formatDate(d)}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label-programme mb-1.5 block text-chalk-faint">Fase / Grup</span>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full rounded-lg border border-line bg-ink-sunken px-3 py-2.5 text-sm text-chalk outline-none transition-colors focus:border-flood/50"
            >
              <option value="all">Semua fase</option>
              {stages.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s] ?? s}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="label-programme mb-1.5 block text-chalk-faint">Lapangan</span>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full rounded-lg border border-line bg-ink-sunken px-3 py-2.5 text-sm text-chalk outline-none transition-colors focus:border-flood/50"
            >
              <option value="all">Semua lapangan</option>
              {fields.map((f) => (
                <option key={f} value={f}>
                  Lapangan {f}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-live-red/30 bg-live-red/10 px-4 py-3 text-sm text-live-red">
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="label-programme shrink-0 hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      {loading && matches.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-flood border-t-transparent" />
        </div>
      ) : filtered.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between border-b border-line pb-2.5">
            <span className="label-programme text-chalk-faint">
              {filtered.length} laga
              {date ? ` · ${formatDate(date)}` : ''}
            </span>
            {(stage !== 'all' || field !== 'all') && (
              <button
                onClick={() => {
                  setStage('all');
                  setField('all');
                }}
                className="label-programme text-flood hover:underline"
              >
                Reset filter
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="Tidak ada jadwal"
          description="Tidak ditemukan pertandingan dengan filter yang dipilih."
        />
      )}
    </div>
  );
}
