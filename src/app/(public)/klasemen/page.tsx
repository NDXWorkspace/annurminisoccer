'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { calculateStandings } from '@/lib/utils';
import { useCategory } from '@/hooks/useCategory';
import { matchesStore, teamsStore, useResource } from '@/lib/live-store';

const COLS: { key: string; label: string; title: string }[] = [
  { key: 'played', label: 'M', title: 'Main' },
  { key: 'won', label: 'M', title: 'Menang' },
  { key: 'drawn', label: 'S', title: 'Seri' },
  { key: 'lost', label: 'K', title: 'Kalah' },
];

export default function KlasemenPage() {
  // Klasemen dihitung dari store yang sama dengan halaman lain, jadi
  // angka Poin di sini dijamin cocok dengan skor di Beranda dan Jadwal.
  const [teams] = useResource(teamsStore);
  const [matches, online, reload, loaded] = useResource(matchesStore);
  const [category, setCategory] = useCategory('U10');

  const categories = useMemo(() => {
    const cats = [...new Set(teams.map((t) => t.category).filter(Boolean))] as string[];
    return cats.sort();
  }, [teams]);

  const activeCategory = categories.includes(category) ? category : (categories[0] ?? '');

  // Hanya tim kategori aktif yang dihitung — dua kategori tidak pernah tercampur.
  const visible = useMemo(() => {
    if (!activeCategory) return [];
    const scoped = teams.filter((t) => (t.category ?? 'U10') === activeCategory);
    const groupNames = [...new Set(scoped.map((t) => t.group_name))].sort();
    return groupNames.map((g) => ({
      group_name: g,
      rows: calculateStandings(scoped, matches, g),
    }));
  }, [teams, matches, activeCategory]);

  return (
    <div className="wrap pt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="rule-title font-display text-[30px] font-extrabold md:text-[46px]">
          Klasemen
        </h1>
        {categories.length > 0 && (
          <div className="pill gap-0.5 p-1" role="group" aria-label="Kategori">
            {categories.map((c) => (
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

      {!online && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-full border border-danger/40 bg-danger/10 px-5 py-3">
          <p className="text-sm text-danger">Data tidak dapat dimuat.</p>
          <button onClick={reload} className="label text-text">
            Coba lagi
          </button>
        </div>
      )}

      <div className="mt-6 space-y-10 pb-8">
        {visible.map((group) => (
          <section key={group.group_name} aria-label={`Grup ${group.group_name}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-extrabold">Grup {group.group_name}</h2>
              <p className="label text-muted">{group.rows.length} tim</p>
            </div>

            <div className="mt-3 overflow-x-auto rounded-[28px] border border-line bg-surface">
              <table className="w-full min-w-[580px] border-collapse">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="label w-14 px-4 py-4 text-center text-muted">
                      #
                    </th>
                    <th
                      scope="col"
                      className="label sticky left-0 bg-surface px-4 py-4 text-left"
                    >
                      Tim
                    </th>
                    {COLS.map((c, i) => (
                      <th
                        key={`${c.label}${i}`}
                        scope="col"
                        title={c.title}
                        className="label w-9 px-1 py-4 text-center text-muted"
                      >
                        {c.label}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="label hidden w-10 px-1 py-4 text-center text-muted md:table-cell"
                    >
                      GM
                    </th>
                    <th
                      scope="col"
                      className="label hidden w-10 px-1 py-4 text-center text-muted md:table-cell"
                    >
                      GK
                    </th>
                    <th scope="col" className="label w-11 px-1 py-4 text-center text-muted">
                      SG
                    </th>
                    <th
                      scope="col"
                      className="label sticky right-0 bg-surface px-4 py-4 text-right"
                    >
                      Poin
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row, i) => (
                    <tr
                      key={row.team.id}
                      style={{ ['--i' as string]: i }}
                      className={`animate-reveal border-b border-line transition-colors last:border-0 hover:bg-raise ${
                        i === 0 ? 'bg-[#0E1832]' : ''
                      }`}
                    >
                      <td className="num sticky left-0 w-14 bg-inherit px-4 py-3.5 text-center text-lg">
                        <span className="inline-flex items-center gap-1.5">
                          {i === 0 && (
                            <span
                              className="inline-block h-2 w-2 rounded-full bg-yellow"
                              aria-hidden
                            />
                          )}
                          {i + 1}
                        </span>
                      </td>
                      <td className="sticky left-0 bg-inherit px-4 py-3.5">
                        <Link
                          href={`/tim/${row.team.id}`}
                          className="font-display text-[19px] font-bold leading-tight hover:text-blue"
                        >
                          {row.team.name}
                        </Link>
                      </td>
                      {COLS.map((c, k) => (
                        <td key={k} className="num px-1 py-3.5 text-center text-base text-text">
                          {row[c.key as keyof typeof row] as number}
                        </td>
                      ))}
                      <td className="num hidden px-1 py-3.5 text-center text-base text-muted md:table-cell">
                        {row.goals_for}
                      </td>
                      <td className="num hidden px-1 py-3.5 text-center text-base text-muted md:table-cell">
                        {row.goals_against}
                      </td>
                      <td className="num px-1 py-3.5 text-center text-base text-text">
                        {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                      </td>
                      <td className="num sticky right-0 bg-inherit px-4 py-3.5 text-right text-[28px]">
                        {row.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {visible.length === 0 && loaded && (
          <p className="py-8 text-muted">
            Klasemen muncul setelah pertandingan pertama selesai.
          </p>
        )}
      </div>
    </div>
  );
}