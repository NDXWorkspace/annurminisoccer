'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Team, ApiResponse } from '@/lib/types';
import { SEED_TEAMS_SORTED } from '@/lib/seed';
import TeamBadge from '@/components/TeamBadge';
import EmptyState from '@/components/EmptyState';

export default function TimPage() {
  const [teams, setTeams] = useState<Team[]>(SEED_TEAMS_SORTED);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState('all');

  useEffect(() => {
    const load = async (initial = false) => {
      try {
        if (initial) setLoading(true);
        const res = await fetch('/api/teams', { cache: 'no-store' });
        if (!res.ok) throw new Error('Gagal memuat tim');
        const data: ApiResponse<Team[]> = await res.json();
        if (data.success && data.data) setTeams([...data.data].sort((a, b) => a.name.localeCompare(b.name)));
        setError(null);
      } catch {
        if (initial) setError('Gagal memuat data tim.');
      } finally {
        if (initial) setLoading(false);
      }
    };

    load(true);
    const id = setInterval(() => load(false), 15_000);
    return () => clearInterval(id);
  }, []);

  const groups = useMemo(
    () => [...new Set(teams.map((t) => t.group_name).filter(Boolean) as string[])].sort(),
    [teams]
  );
  const visible = group === 'all' ? teams : teams.filter((t) => t.group_name === group);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label-programme text-flood">Peserta</span>
          <h1 className="mt-1.5 font-display text-4xl font-extrabold uppercase tracking-[0.02em] text-chalk sm:text-5xl">
            Tim <span className="text-flood">Turnamen</span>
          </h1>
        </div>
        <span className="label-programme text-chalk-faint">{visible.length} tim</span>
      </header>

      {groups.length > 0 && (
        <div className="scrollbar-hide mb-8 flex gap-2 overflow-x-auto pb-1">
          {[{ g: 'all', label: 'Semua' }, ...groups.map((g) => ({ g, label: `Grup ${g}` }))].map(
            (item) => (
              <button
                key={item.g}
                onClick={() => setGroup(item.g)}
                className={`shrink-0 rounded-lg border px-3.5 py-2 font-display text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
                  group === item.g
                    ? 'border-flood bg-flood text-ink'
                    : 'border-line bg-ink-raised text-chalk-dim hover:border-line-bright hover:text-chalk'
                }`}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-live-red/30 bg-live-red/10 px-4 py-3 text-sm text-live-red">
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="label-programme shrink-0 hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      {loading && visible.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-flood border-t-transparent" />
        </div>
      ) : visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((team, i) => (
            <Link
              key={team.id}
              href={`/tim/${team.id}`}
              className="animate-rise group relative overflow-hidden rounded-[14px] border border-line bg-ink-raised p-5 text-center transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-line-bright"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              {/* club colour bleeds up from the crest */}
              <span
                className="pointer-events-none absolute -top-16 left-1/2 h-32 w-40 -translate-x-1/2 rounded-full opacity-[0.16] blur-2xl transition-opacity duration-500 group-hover:opacity-30"
                style={{ backgroundColor: team.color || '#d3ff3f' }}
                aria-hidden
              />

              <span
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                style={{ backgroundColor: team.color || '#d3ff3f' }}
                aria-hidden
              />

              <div className="relative flex flex-col items-center">
                <TeamBadge
                  team={team}
                  size="lg"
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                <h3 className="mt-4 line-clamp-2 font-display text-base font-bold uppercase leading-tight tracking-wide text-chalk transition-colors group-hover:text-flood">
                  {team.name}
                </h3>
                <span className="label-programme mt-2.5 text-chalk-faint">
                  {team.group_name ? `Grup ${team.group_name}` : 'Tim'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Tidak ada tim" description="Belum ada tim yang terdaftar." />
      )}
    </div>
  );
}
