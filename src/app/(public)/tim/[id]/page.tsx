'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Team, MatchWithTeams, GroupStandings, ApiResponse } from '@/lib/types';
import { calculateAllStandings } from '@/lib/utils';
import { SEED_TEAMS, SEED_MATCHES, seedTeamMatches } from '@/lib/seed';
import TeamBadge from '@/components/TeamBadge';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  // Seed diturunkan dari `id` agar halaman detail tim juga terisi instan.
  const seedTeam = SEED_TEAMS.find((t) => t.id === id) ?? null;
  const [team, setTeam] = useState<Team | null>(seedTeam);
  const [matches, setMatches] = useState<MatchWithTeams[]>(seedTeamMatches(id));
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
        if (!teamsRes.ok || !matchesRes.ok) throw new Error('Gagal memuat data');

        const teamsData: ApiResponse<Team[]> = await teamsRes.json();
        const matchesData: ApiResponse<MatchWithTeams[]> = await matchesRes.json();
        if (teamsData.success && teamsData.data) {
          const found = teamsData.data.find((t) => t.id === id);
          if (!found) throw new Error('Tim tidak ditemukan');
          setTeam(found);
        } else {
          throw new Error('Tim tidak ditemukan');
        }

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

  // Seed sudah menyediakan tim bila `id`-nya cocok, jadi jangan tutup
  // halaman dengan spinner kalau datanya sebenarnya sudah ada.
  if (loading && !team) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-flood border-t-transparent" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState title="Tim tidak ditemukan" description={error ?? undefined} />
        <div className="mt-5 text-center">
          <Link
            href="/tim"
            className="label-programme inline-block text-flood transition-colors hover:underline"
          >
            ← Kembali ke daftar tim
          </Link>
        </div>
      </div>
    );
  }

  const row = standings.find((g) => g.group_name === team.group_name)?.rows.find((r) => r.team.id === team.id);
  const hex = team.color || '#d3ff3f';

  const figures = row
    ? [
        { label: 'Main', value: String(row.played) },
        { label: 'Menang', value: String(row.won) },
        { label: 'Selisih gol', value: `${row.goal_difference > 0 ? '+' : ''}${row.goal_difference}` },
        { label: 'Poin', value: String(row.points), accent: true },
      ]
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/tim"
        className="label-programme mb-6 inline-flex items-center gap-2 text-chalk-faint transition-colors hover:text-flood"
      >
        ← Semua tim
      </Link>

      {/* Crest header — colour bleeds behind the badge */}
      <header
        className="grain relative mb-10 overflow-hidden rounded-[14px] border border-line bg-ink-raised px-6 py-8 sm:px-8"
        style={{ ['--accent' as string]: hex }}
      >
        <span
          className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full opacity-25 blur-3xl"
          style={{ backgroundColor: hex }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
          style={{ backgroundColor: hex }}
          aria-hidden
        />

        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          <TeamBadge team={team} size="lg" className="h-24 w-24 text-3xl sm:h-28 sm:w-28" />

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <span className="label-programme text-chalk-faint">
              {team.group_name ? `Grup ${team.group_name}` : 'Tim peserta'}
            </span>
            <h1 className="mt-1.5 font-display text-4xl font-extrabold uppercase leading-none tracking-[0.01em] text-chalk sm:text-5xl">
              {team.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="label-programme rounded-full border border-line bg-ink-sunken px-2.5 py-1 text-chalk-dim">
                {team.short_name}
              </span>
              <span className="label-programme flex items-center gap-1.5 rounded-full border border-line bg-ink-sunken px-2.5 py-1 text-chalk-dim">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
                {hex.toUpperCase()}
              </span>
            </div>

            {figures.length > 0 && (
              <div className="mt-7 grid max-w-md grid-cols-4 gap-px overflow-hidden rounded-xl border border-line bg-line">
                {figures.map((f) => (
                  <div key={f.label} className="bg-ink-sunken px-2 py-3 text-center">
                    <div
                      className={`score-plate text-2xl ${
                        f.accent ? 'text-flood' : 'text-chalk'
                      }`}
                    >
                      {f.value}
                    </div>
                    <div className="label-programme mt-1 text-chalk-faint">{f.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <section>
        <div className="mb-4 border-b border-line pb-3">
          <span className="label-programme text-flood">Riwayat</span>
          <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-[0.04em] text-chalk">
            Jadwal &amp; hasil
          </h2>
        </div>

        {matches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Belum ada pertandingan"
            description="Tim ini belum punya jadwal pertandingan."
          />
        )}
      </section>
    </div>
  );
}
