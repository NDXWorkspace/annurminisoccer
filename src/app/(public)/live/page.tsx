'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MatchWithTeams, ApiResponse } from '@/lib/types';
import { SEED_MATCHES } from '@/lib/seed';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';

export default function LivePage() {
  const [matches, setMatches] = useState<MatchWithTeams[]>(SEED_MATCHES);
  const [loading, setLoading] = useState(true);
  // `new Date()` at render time differs between the server and the browser,
  // which throws a hydration mismatch. Start null and fill it on the first
  // successful fetch so the server and client agree on the first paint.
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  const fetchLiveScores = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setIsRefreshing(true);

      const res = await fetch('/api/matches', { cache: 'no-store' });
      if (!res.ok) throw new Error('Gagal memuat skor');

      const data: ApiResponse<MatchWithTeams[]> = await res.json();
      // `data.success` dicek supaya seed tidak terkosongkan oleh payload
      // kosong yang dikirim endpoint ketika database tidak bisa dihubungi.
      if (data.success && data.data) setMatches(data.data);
      setLastUpdated(new Date());
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchLiveScores();
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchLiveScores(true);
      }
    }, 5000);

    const onVisible = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchLiveScores(true);
      }
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Broadcast header bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="label-programme flex items-center gap-2 text-live-red">
            <span className="h-2 w-2 rounded-full bg-live-red animate-live-pulse animate-live-ring" />
            {(live.length > 0 ? 'Sedang berlangsung' : 'Papan skor') as string}
          </span>
          <h1 className="mt-1.5 font-display text-4xl font-extrabold uppercase tracking-[0.02em] text-chalk sm:text-5xl">
            Skor <span className="text-flood">Live</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="label-programme block text-chalk-faint">Pembaruan terakhir</span>
            <span className="score-plate tnum text-lg text-chalk">
              {lastUpdated
                ? lastUpdated.toLocaleTimeString('id-ID', { hour12: false })
                : '--:--:--'}
            </span>
          </div>
          <button
            onClick={() => fetchLiveScores()}
            disabled={isRefreshing}
            aria-label="Muat ulang skor"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-ink-raised text-chalk-dim transition-colors hover:border-flood/40 hover:text-flood disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-flood' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {offline && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber">
          <span className="h-1.5 w-1.5 rounded-full bg-amber" />
          Koneksi terputus. Menampilkan data terakhir yang diterima.
        </div>
      )}

      {loading && matches.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-line bg-ink-raised" />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          <section>
            {live.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {live.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Tidak ada pertandingan berlangsung"
                description={
                  next.length > 0
                    ? 'Skor akan muncul di sini begitu panitia mengubah status laga menjadi live.'
                    : 'Semua laga pada turnamen sudah selesai.'
                }
                action={
                  next.length > 0 ? (
                    <div className="mx-auto max-w-sm text-left">
                      <span className="label-programme mb-2.5 block text-chalk-faint"> Selanjutnya</span>
                      <MatchCard match={next[0]} compact />
                    </div>
                  ) : (
                    <Link
                      href="/jadwal"
                      className="inline-flex items-center gap-2 rounded-lg border border-line-bright px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[0.12em] text-chalk transition-colors hover:border-flood/50 hover:text-flood"
                    >
                      Lihat jadwal
                    </Link>
                  )
                }
              />
            )}
          </section>

          {done.length > 0 && (
            <section>
              <div className="mb-4 flex items-end justify-between border-b border-line pb-3">
                <div>
                  <span className="label-programme text-chalk-faint">Usai</span>
                  <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-[0.04em] text-chalk">
                    Hasil terbaru
                  </h2>
                </div>
                <Link href="/klasemen" className="label-programme text-chalk-faint transition-colors hover:text-flood">
                  Klasemen →
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
