'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ApiResponse, GroupStandings, MatchWithTeams, Team } from '@/lib/types';
import { calculateAllStandings, calculateStandings } from '@/lib/utils';
import { SEED_TEAMS, SEED_MATCHES } from '@/lib/seed';
import { useCategory } from '@/hooks/useCategory';
import Monogram from '@/components/Monogram';

const COLS: { key: string; label: string; title: string }[] = [
  { key: 'played', label: 'M', title: 'Main' },
  { key: 'won', label: 'M', title: 'Menang' },
  { key: 'drawn', label: 'S', title: 'Seri' },
  { key: 'lost', label: 'K', title: 'Kalah' },
];

export default function KlasemenPage() {
  const [standings, setStandings] = useState<GroupStandings[]>(() =>
    calculateAllStandings(SEED_TEAMS, SEED_MATCHES)
  );
  const [teams, setTeams] = useState<Team[]>(SEED_TEAMS);
  const [matches, setMatches] = useState<MatchWithTeams[]>(SEED_MATCHES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useCategory('U10');

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
          setTeams(teamsData.data);
          setMatches(matchesData.data);
          setStandings(calculateAllStandings(teamsData.data, matchesData.data));
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
    const cats = [...new Set(teams.map((t) => t.category).filter(Boolean))] as string[];
    return cats.sort();
  }, [teams]);

  const activeCategory = categories.includes(category)
    ? category
    : (categories[0] ?? '');

  const visible = useMemo(() => {
    if (!activeCategory) return standings;
    const teamIds = new Set(teams.filter((t) => t.category === activeCategory).map((t) => t.id));
    const groupNames = [
      ...new Set(teams.filter((t) => teamIds.has(t.id)).map((t) => t.group_name)),
    ].sort();
    // Hitung ulang hanya untuk tim kategori aktif.
    return groupNames.map((g) => ({
      group_name: g,
      rows: calculateStandings(
        teams.filter((t) => teamIds.has(t.id)),
        matches,
        g
      ),
    }));
  }, [standings, teams, matches, activeCategory]);

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-8">
      <div className="rule-double pt-3">
        <h1 className="font-display text-[32px] font-extrabold leading-none text-ink md:text-[44px]">
          Klasemen
        </h1>
        <p className="mt-2 max-w-[65ch] text-sm text-muted">
          Dihitung otomatis dari pertandingan berstatus selesai.
        </p>
      </div>

      {categories.length > 1 && (
        <div
          role="group"
          aria-label="Kategori"
          className="mt-4 grid grid-cols-2 border border-rule bg-white"
        >
          {categories.map((c) => (
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

      <div className="mt-6 space-y-10">
        {visible.map((group) => (
          <section key={group.group_name} aria-label={`Grup ${group.group_name}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-extrabold text-ink">
                Grup {group.group_name}
              </h2>
              <p className="font-mono text-[13px] text-muted">{group.rows.length} tim</p>
            </div>

            <div className="mt-2 overflow-x-auto border border-rule bg-white">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="bg-ink text-white">
                    <th scope="col" className="label sticky left-0 bg-ink px-3 py-2.5 text-center">
                      #
                    </th>
                    <th scope="col" className="label sticky left-10 bg-ink px-2 py-2.5">
                      Tim
                    </th>
                    {COLS.map((c, i) => (
                      <th
                        key={`${c.label}${i}`}
                        scope="col"
                        title={c.title}
                        className="label w-9 px-1 py-2.5 text-center"
                      >
                        {c.label}
                      </th>
                    ))}
                    <th scope="col" className="label hidden w-10 px-1 py-2.5 text-center md:table-cell">
                      GM
                    </th>
                    <th scope="col" className="label hidden w-10 px-1 py-2.5 text-center md:table-cell">
                      GK
                    </th>
                    <th scope="col" className="label w-11 px-1 py-2.5 text-center">
                      SG
                    </th>
                    <th scope="col" className="label sticky right-0 w-14 bg-ink px-3 py-2.5 text-right">
                      Poin
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row, i) => (
                    <tr key={row.team.id} className="border-b border-rule last:border-0">
                      <td className="sticky left-0 bg-white px-3 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1.5">
                          {i === 0 && (
                            <span className="inline-block h-1.5 w-1.5 bg-whistle" aria-hidden />
                          )}
                          <span className="tnum text-sm text-ink">{i + 1}</span>
                        </span>
                      </td>
                      <td className="sticky left-10 bg-white px-2 py-2.5">
                        <Link href={`/tim/${row.team.id}`} className="flex items-center gap-2">
                          <Monogram
                            name={row.team.name}
                            shortName={row.team.short_name}
                            color={row.team.color}
                            size={32}
                          />
                          <span className="truncate text-[15px] font-bold text-ink">
                            {row.team.name}
                          </span>
                        </Link>
                      </td>
                      {COLS.map((c, k) => (
                        <td key={k} className="tnum px-1 py-2.5 text-center text-sm text-ink">
                          {row[c.key as keyof typeof row] as number}
                        </td>
                      ))}
                      <td className="tnum hidden px-1 py-2.5 text-center text-sm text-muted md:table-cell">
                        {row.goals_for}
                      </td>
                      <td className="tnum hidden px-1 py-2.5 text-center text-sm text-muted md:table-cell">
                        {row.goals_against}
                      </td>
                      <td className="tnum px-1 py-2.5 text-center text-sm text-ink">
                        {row.goal_difference > 0
                          ? `+${row.goal_difference}`
                          : row.goal_difference}
                      </td>
                      <td className="tnum sticky right-0 bg-white px-3 py-2.5 text-right text-base font-extrabold text-ink">
                        {row.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {visible.length === 0 && !loading && (
          <p className="border border-rule bg-white px-4 py-8 text-muted">
            Klasemen muncul setelah pertandingan pertama selesai.
          </p>
        )}
      </div>
    </div>
  );
}
