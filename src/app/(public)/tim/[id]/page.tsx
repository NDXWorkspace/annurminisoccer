'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ApiResponse, GroupStandings, MatchWithTeams, Team } from '@/lib/types';
import { calculateAllStandings } from '@/lib/utils';
import { SEED_TEAMS, SEED_MATCHES, seedTeamMatches } from '@/lib/seed';
import Monogram from '@/components/Monogram';
import CategoryMark from '@/components/CategoryMark';
import MatchRow from '@/components/MatchRow';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const seedTeam = SEED_TEAMS.find((t) => t.id === id) ?? null;
  const [team, setTeam] = useState<Team | null>(seedTeam);
  const [matches, setMatches] = useState<MatchWithTeams[]>(seedTeamMatches(id));
  const [standings, setStandings] = useState<GroupStandings[]>(() =>
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
        if (!teamsRes.ok || !matchesRes.ok) throw new Error('Gagal memuat data');
        const teamsData: ApiResponse<Team[]> = await teamsRes.json();
        const matchesData: ApiResponse<MatchWithTeams[]> = await matchesRes.json();
        if (!teamsData.success || !teamsData.data) throw new Error('Tim tidak ditemukan');
        const found = teamsData.data.find((t) => t.id === id);
        if (!found) throw new Error('Tim tidak ditemukan');
        setTeam(found);
        if (matchesData.success && matchesData.data) {
          setMatches(
            matchesData.data
              .filter((m) => m.team_a_id === id || m.team_b_id === id)
              .sort((a, b) =>
                `${b.match_date}${b.kickoff_time}`.localeCompare(`${a.match_date}${a.kickoff_time}`)
              )
          );
          setStandings(calculateAllStandings(teamsData.data, matchesData.data));
        }
        setError(null);
      } catch (e) {
        if (initial) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (initial) setLoading(false);
      }
    };
    load(true);
    const i = setInterval(() => load(false), 10_000);
    return () => clearInterval(i);
  }, [id]);

  if (loading && !team) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-4 py-8">
        <div className="border border-rule bg-white px-4 py-8">
          <div className="h-10 w-2/3 bg-rule" />
          <div className="mt-3 h-4 w-1/3 bg-rule" />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-4 py-8">
        <p className="border border-rule bg-white px-4 py-8 text-muted">
          {error || 'Tim tidak ditemukan.'}
        </p>
        <Link
          href="/tim"
          className="mt-4 inline-flex h-12 items-center rounded-[4px] border-[1.5px] border-ink px-5 font-display text-base font-bold uppercase text-ink"
        >
          Kembali ke daftar tim
        </Link>
      </div>
    );
  }

  const row = standings
    .find((g) => g.group_name === team.group_name)
    ?.rows.find((r) => r.team.id === team.id);

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-8">
      <Link href="/tim" className="font-display text-base font-bold uppercase text-blue">
        ← Semua tim
      </Link>

      <header className="mt-4 border border-rule bg-white px-4 py-6">
        <div className="flex items-center gap-4">
          <Monogram
            name={team.name}
            shortName={team.short_name}
            color={team.color}
            size={56}
          />
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl font-extrabold text-ink">
              {team.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[13px] text-muted">
              {team.category && <CategoryMark category={team.category} />}
              {team.group_name ? <span>Grup {team.group_name}</span> : null}
            </p>
          </div>
        </div>

        {row && (
          <dl className="mt-6 grid grid-cols-4 border border-rule">
            {[
              { label: 'Main', value: String(row.played) },
              { label: 'Menang', value: String(row.won) },
              {
                label: 'Selisih gol',
                value: `${row.goal_difference > 0 ? '+' : ''}${row.goal_difference}`,
              },
              { label: 'Poin', value: String(row.points) },
            ].map((f) => (
              <div key={f.label} className="border-r border-rule px-2 py-3 text-center last:border-0">
                <dd className="score-display text-3xl text-ink">{f.value}</dd>
                <dt className="label mt-1 text-muted">{f.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </header>

      <section aria-label="Jadwal dan hasil" className="mt-8">
        <div className="rule-double pt-3">
          <h2 className="font-display text-2xl font-extrabold text-ink">
            Jadwal dan hasil
          </h2>
        </div>
        <div className="mt-3 border-t border-rule">
          {matches.length > 0 ? (
            matches.map((m, i) => (
              <MatchRow
                key={m.id}
                match={m}
                code={`M-${String(i + 1).padStart(2, '0')}`}
                showCategory={false}
              />
            ))
          ) : (
            <p className="border-b border-rule bg-white px-4 py-8 text-muted">
              Tim ini belum punya jadwal pertandingan.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
