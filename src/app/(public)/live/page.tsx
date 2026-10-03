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

  const load = async (initial = false) => {
    try {
      if (initial) setLoading(true);
      const res = await fetch('/api/matches', { cache: 'no-store' });
      if (!res.ok) throw new Error('Gagal memuat skor');
      const data: ApiResponse<MatchWithTeams[]> = await res.json();
      if (data.success && data.data) {
        setMatches(data.data);
        setLastUpdated(
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        );
        setOffline(false);
      }
    } catch {
      setOffline(true);
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, 5000);
    const onVisible = () => {
      if (!document.hidden) load();
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
    <div className="wrap pt-12 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="rule-title font-display text-[30px] font-extrabold md:text-[46px]">
          Skor live
        </h1>
        <div className="flex items-center gap-3">
          <span className="label text-muted" aria-live="polite">
            {lastUpdated ? `Diperbarui ${lastUpdated}` : 'Memuat…'}
          </span>
          <button
            onClick={() => load()}
            className="label rounded-full border border-line px-4 py-2.5 text-muted transition-colors hover:border-blue/50 hover:text-text"
          >
            Muat ulang
          </button>
        </div>
      </div>

      {offline && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-full border border-line bg-surface px-5 py-2.5">
          <p className="text-sm text-muted">
            Koneksi terputus. Menampilkan data terakhir
            {lastUpdated ? ` (${lastUpdated})` : ''}.
          </p>
          <button onClick={() => load()} className="label text-blue">
            Muat ulang
          </button>
        </div>
      )}

      {loading && matches.length === 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-[32px] bg-raise" />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-12">
          <section aria-label="Sedang berlangsung">
            {live.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {live.map((m, i) => (
                  <article
                    key={m.id}
                    style={{ ['--i' as string]: i }}
                    className="animate-enter relative isolate overflow-hidden rounded-[32px] bg-gradient-to-bl from-raise to-ink p-6 before:absolute before:inset-0 before:-z-10 before:rounded-[32px] before:p-[1.5px] before:bg-[conic-gradient(from_var(--a),transparent_0_60%,var(--color-yellow)_82%,transparent_100%)] before:[-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] before:[mask-composite:exclude] before:[animation:spin_5s_linear_infinite]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {m.category ? (
                        <CategoryMark category={m.category} field={m.field} />
                      ) : (
                        <span className="label text-muted">
                          {m.field ? `Lapangan ${m.field}` : ''}
                        </span>
                      )}
                      <StatusBadge status={m.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <p className="truncate font-display text-[19px] font-bold leading-tight">
                        {m.team_a?.name ?? 'Tim A'}
                      </p>
                      <p
                        className="num flash flash-on flex items-center gap-2 text-[clamp(64px,18vw,112px)] leading-none"
                        aria-live="polite"
                        aria-label={`${m.team_a?.name ?? 'Tim A'} ${m.score_a ?? 0}, ${m.team_b?.name ?? 'Tim B'} ${m.score_b ?? 0}`}
                      >
                        {m.score_a ?? 0}
                        <span className="font-medium text-muted">–</span>
                        {m.score_b ?? 0}
                      </p>
                      <p className="truncate text-right font-display text-[19px] font-bold leading-tight">
                        {m.team_b?.name ?? 'Tim B'}
                      </p>
                    </div>
                    <p className="label mt-4 text-muted">
                      {m.match_date} · {m.kickoff_time.slice(0, 5)}
                    </p>
                  </article>
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
                    <div className="mx-auto max-w-sm text-left">
                      <MatchCard match={next[0]} compact />
                    </div>
                  ) : (
                    <Link
                      href="/jadwal"
                      className="label inline-flex h-12 items-center rounded-full border border-line px-6 text-text"
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
              <div className="flex items-center justify-between gap-3">
                <h2 className="rule-title font-display text-2xl font-extrabold">
                  Hasil terbaru
                </h2>
                <Link href="/klasemen" className="label text-blue">
                  Klasemen
                </Link>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
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