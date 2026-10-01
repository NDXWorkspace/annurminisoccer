'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Team, MatchWithTeams, GroupStandings, ApiResponse } from '@/lib/types';
import { calculateAllStandings } from '@/lib/utils';
import { SEED_TEAMS, SEED_MATCHES } from '@/lib/seed';
import TeamBadge from '@/components/TeamBadge';
import EmptyState from '@/components/EmptyState';

const STATS: { key: string; label: string; tone: string }[] = [
  { key: 'played', label: 'M', tone: 'text-chalk' },
  { key: 'won', label: 'M', tone: 'text-turf' },
  { key: 'drawn', label: 'S', tone: 'text-amber' },
  { key: 'lost', label: 'K', tone: 'text-live-red' },
];

export default function KlasemenPage() {
  // Klasemen dihitung dari seed memakai fungsi yang sama dengan produksi,
  // jadi angkanya identik dengan hasil hitung dari API.
  const [standings, setStandings] = useState<GroupStandings[]>(
    calculateAllStandings(SEED_TEAMS, SEED_MATCHES)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (initial = false) => {
      try {
        if (initial) setLoading(true);
        const [teamsRes, matchesRes] = await Promise.all([
          fetch('/api/teams', { cache: 'no-store' }),
          fetch('/api/matches', { cache: 'no-store' }),
        ]);
        if (!teamsRes.ok || !matchesRes.ok) throw new Error('Gagal memuat klasemen');

        const teamsData: ApiResponse<Team[]> = await teamsRes.json();
        const matchesData: ApiResponse<MatchWithTeams[]> = await matchesRes.json();
        if (teamsData.success && matchesData.success && teamsData.data && matchesData.data) {
          setStandings(calculateAllStandings(teamsData.data, matchesData.data));
        }
        setError(null);
      } catch {
        if (initial) setError('Gagal memuat data klasemen.');
      } finally {
        if (initial) setLoading(false);
      }
    };

    load(true);
    const id = setInterval(() => load(false), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label-programme text-flood">Tabel grup</span>
          <h1 className="mt-1.5 font-display text-4xl font-extrabold uppercase tracking-[0.02em] text-chalk sm:text-5xl">
            Klasemen
          </h1>
        </div>
        <p className="max-w-xs text-xs leading-relaxed text-chalk-faint">
          Dihitung otomatis dari pertandingan berstatus selesai.
        </p>
      </header>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-live-red/30 bg-live-red/10 px-4 py-3 text-sm text-live-red">
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="label-programme shrink-0 hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      {loading && standings.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-flood border-t-transparent" />
        </div>
      ) : standings.length > 0 ? (
        <div className="space-y-8">
          {standings.map((group) => (
            <section key={group.group_name} className="overflow-hidden rounded-[14px] border border-line bg-ink-raised">
              <header className="flex items-center justify-between border-b border-line bg-ink-sunken/60 px-4 py-3">
                <h2 className="font-display text-lg font-bold uppercase tracking-[0.12em] text-chalk">
                  Grup <span className="text-flood">{group.group_name}</span>
                </h2>
                <span className="label-programme text-chalk-faint">{group.rows.length} tim</span>
              </header>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="label-programme w-10 px-3 py-2.5 text-center text-chalk-faint">#</th>
                      <th className="label-programme px-2 py-2.5 text-chalk-faint">Tim</th>
                      {STATS.map((s, i) => (
                        <th
                          key={`${s.label}${i}`}
                          title={['Main', 'Menang', 'Seri', 'Kalah'][i]}
                          className={`label-programme w-9 px-1 py-2.5 text-center ${s.tone}`}
                        >
                          {s.label}
                        </th>
                      ))}
                      <th className="label-programme hidden w-10 px-1 py-2.5 text-center text-chalk-faint md:table-cell">GM</th>
                      <th className="label-programme hidden w-10 px-1 py-2.5 text-center text-chalk-faint md:table-cell">GK</th>
                      <th className="label-programme w-11 px-1 py-2.5 text-center text-chalk-faint">SG</th>
                      <th className="label-programme w-14 px-3 py-2.5 text-right text-flood">P</th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.rows.map((row, i) => (
                      <tr
                        key={row.team.id}
                        className={`border-b border-line/60 transition-colors last:border-0 hover:bg-white/[0.03] ${
                          i < 2 ? 'bg-flood/[0.045]' : ''
                        }`}
                      >
                        <td className="relative px-3 py-2.5 text-center">
                          {i < 2 && (
                            <span className="absolute inset-y-0 left-0 w-[2px] bg-flood" aria-hidden />
                          )}
                          <span
                            className={`score-plate text-sm ${
                              i === 0 ? 'text-flood' : i < 2 ? 'text-chalk' : 'text-chalk-faint'
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>

                        <td className="px-2 py-2.5">
                          <Link href={`/tim/${row.team.id}`} className="group flex items-center gap-2.5">
                            <TeamBadge team={row.team} size="sm" />
                            <span className="truncate font-medium text-chalk transition-colors group-hover:text-flood">
                              {row.team.name}
                            </span>
                          </Link>
                        </td>

                        {STATS.map((s, k) => (
                          <td key={k} className="score-plate px-1 py-2.5 text-center text-sm text-chalk-dim">
                            {row[s.key as keyof typeof row] as number}
                          </td>
                        ))}

                        <td className="score-plate hidden px-1 py-2.5 text-center text-sm text-chalk-faint md:table-cell">
                          {row.goals_for}
                        </td>
                        <td className="score-plate hidden px-1 py-2.5 text-center text-sm text-chalk-faint md:table-cell">
                          {row.goals_against}
                        </td>
                        <td
                          className={`score-plate px-1 py-2.5 text-center text-sm ${
                            row.goal_difference > 0
                              ? 'text-turf'
                              : row.goal_difference < 0
                                ? 'text-live-red'
                                : 'text-chalk-faint'
                          }`}
                        >
                          {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="score-plate rounded-md bg-flood/12 px-2 py-1 text-base text-flood">
                            {row.points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <footer className="flex items-center gap-2 border-t border-line bg-ink-sunken/60 px-4 py-2.5">
                <span className="h-3 w-[2px] bg-flood" aria-hidden />
                <span className="text-[11px] text-chalk-faint">
                  Peringkat 1–2 melaju ke babak berikutnya.
                </span>
              </footer>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada klasemen"
          description="Klasemen muncul setelah pertandingan pertama selesai."
        />
      )}
    </div>
  );
}
