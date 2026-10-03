'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ApiResponse, MatchWithTeams } from '@/lib/types';
import { SEED_MATCHES } from '@/lib/seed';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';
import CategoryMark from '@/components/CategoryMark';
import StatusBadge from '@/components/StatusBadge';

export default function LivePage() {
  const [matches, setMatches] = useState<MatchWithTeams[]>(SEED_MATCHES);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [offline, setOffline] = useState(false);

  const fetchLiveScores = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await fetch('/api/matches', { cache: 'no-store' });
      if (!res.ok) throw new Error('Gagal memuat skor');
      const data: ApiResponse<MatchWithTeams[]> = await res.json();
      if (data.success && data.data) {
        setMatches(data.data);
        setLastUpdated(
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        );
      }
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveScores();
    const id = setInterval(() => {
      if (!document.hidden) fetchLiveScores(true);
    }, 5000);
    const onVisible = () => {
      if (!document.hidden) fetchLiveScores(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const live = matches.filter((m) => m.status === 'live' || m.status === 'halftime');
  const done = matches
    .filter((m) => m.status === 'finished')
    .sort((a, b) =>
      `${b.match_date}${b.kickoff_time}`.localeCompare(`${a.match_date}${a.kickoff_time}`)
    )
    .slice(0, 6);
  const next = matches
    .filter((m) => m.status === 'scheduled')
    .sort((a, b) => `${a.match_date}${a.kickoff_time}`.localeCompare(`${b.match_date}${b.kickoff_time}`))
    .slice(0, 1);

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-8">
      <div className="rule-double flex flex-wrap items-end justify-between gap-3 pt-3">
        <h1 className="font-display text-[32px] font-extrabold leading-none text-ink md:text-[44px]">
          Skor live
        </h1>
        <div className="flex items-center gap-3">
          <p className="font-mono text-[13px] text-muted">
            {lastUpdated ? `Diperbarui ${lastUpdated}` : 'Memuat…'}
          </p>
          <button
            onClick={() => fetchLiveScores()}
            aria-label="Muat ulang skor"
            className="h-11 rounded-[4px] border-[1.5px] border-ink px-4 font-display text-sm font-bold uppercase text-ink"
          >
            Muat ulang
          </button>
        </div>
      </div>

      {offline && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border border-rule bg-white px-4 py-2">
          <p className="text-sm text-muted">
            Koneksi terputus. Menampilkan data terakhir
            {lastUpdated ? ` (${lastUpdated})` : ''}.
          </p>
          <button onClick={() => fetchLiveScores()} className="h-11 font-display text-sm font-bold uppercase text-blue">
            Muat ulang
          </button>
        </div>
      )}

      {loading && matches.length === 0 ? (
        <div className="mt-4 border border-rule bg-white px-4 py-8">
          <div className="h-8 w-1/2 bg-rule" />
          <div className="mt-3 h-4 w-1/3 bg-rule" />
        </div>
      ) : (
        <div className="mt-6 space-y-10">
          <section aria-label="Sedang berlangsung">
            {live.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
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
                        className="score-display shrink-0 text-[64px] text-ink md:text-[96px]"
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
            ) : (
              <EmptyState
                title="Tidak ada pertandingan berlangsung"
                description={
                  next.length > 0
                    ? 'Skor akan muncul di sini begitu panitia memulai pertandingan.'
                    : 'Semua pertandingan sudah selesai.'
                }
                action={
                  next.length > 0 ? (
                    <div className="mx-auto max-w-sm">
                      <MatchCard match={next[0]} compact />
                    </div>
                  ) : (
                    <Link
                      href="/jadwal"
                      className="inline-flex h-12 items-center rounded-[4px] border-[1.5px] border-ink px-5 font-display text-base font-bold uppercase text-ink"
                    >
                      Lihat jadwal
                    </Link>
                  )
                }
              />
            )}
          </section>

          {done.length > 0 && (
            <section aria-label="Hasil terbaru">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl font-extrabold text-ink">Hasil terbaru</h2>
                <Link href="/klasemen" className="font-display text-base font-bold uppercase text-blue">
                  Klasemen
                </Link>
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {done.map((m) => (
                  <MatchCard key={m.id} match={m} compact />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
