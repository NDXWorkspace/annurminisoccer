'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ApiResponse, Team } from '@/lib/types';
import { SEED_TEAMS_SORTED } from '@/lib/seed';
import Monogram from '@/components/Monogram';

export default function TimPage() {
  const [teams, setTeams] = useState<Team[]>(SEED_TEAMS_SORTED);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (initial = false) => {
      try {
        if (initial) setLoading(true);
        const res = await fetch('/api/teams', { cache: 'no-store' });
        if (!res.ok) throw new Error('Gagal memuat tim');
        const data: ApiResponse<Team[]> = await res.json();
        if (data.success && data.data) {
          setTeams([...data.data].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setError(null);
      } catch {
        if (initial) setError('Data tidak dapat dimuat.');
      } finally {
        if (initial) setLoading(false);
      }
    };
    load(true);
    const id = setInterval(() => load(false), 15_000);
    return () => clearInterval(id);
  }, []);

  const sections = useMemo(() => {
    const cats = [...new Set(teams.map((t) => t.category).filter(Boolean))] as string[];
    if (cats.length === 0) return [{ title: '', list: teams }];
    return cats.sort().map((c) => ({
      title: c,
      list: teams.filter((t) => t.category === c),
    }));
  }, [teams]);

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-8">
      <div className="rule-double pt-3">
        <h1 className="font-display text-[32px] font-extrabold leading-none text-ink md:text-[44px]">
          Tim
        </h1>
        <p className="mt-2 font-mono text-[13px] text-muted">{teams.length} tim</p>
      </div>

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
        {sections.map((s) => (
          <section key={s.title || 'all'} aria-label={s.title || 'Daftar tim'}>
            {s.title && (
              <h2 className="font-display text-2xl font-extrabold text-ink">{s.title}</h2>
            )}
            <div className="mt-3 grid grid-cols-2 gap-px border border-rule bg-rule lg:grid-cols-4">
              {s.list.map((team) => (
                <Link
                  key={team.id}
                  href={`/tim/${team.id}`}
                  className="flex min-h-[44px] flex-col items-center gap-2 bg-white px-3 py-5 text-center"
                >
                  <Monogram
                    name={team.name}
                    shortName={team.short_name}
                    color={team.color}
                  />
                  <span className="line-clamp-2 font-display text-lg font-bold leading-tight text-ink">
                    {team.name}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {team.group_name ? `Grup ${team.group_name}` : ''}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {teams.length === 0 && !loading && (
          <p className="border border-rule bg-white px-4 py-8 text-muted">
            Belum ada tim yang terdaftar.
          </p>
        )}
      </div>
    </div>
  );
}
