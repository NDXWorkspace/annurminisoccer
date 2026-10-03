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
      list: teams.filter((t) => (t.category ?? 'U10') === c),
    }));
  }, [teams]);

  return (
    <div className="wrap pt-12">
      <div className="flex items-end justify-between gap-3">
        <h1 className="rule-title font-display text-[30px] font-extrabold md:text-[46px]">
          Tim
        </h1>
        <p className="label text-muted">{teams.length} tim</p>
      </div>

      {error && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-full border border-danger/40 bg-danger/10 px-5 py-3">
          <p className="text-sm text-danger">{error}</p>
          <button onClick={() => window.location.reload()} className="label text-text">
            Coba lagi
          </button>
        </div>
      )}

      <div className="mt-6 space-y-10 pb-8">
        {sections.map((s) => (
          <section key={s.title || 'all'} aria-label={s.title || 'Daftar tim'}>
            {s.title && (
              <h2 className="rule-title font-display text-2xl font-extrabold">{s.title}</h2>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {s.list.map((team, i) => (
                <Link
                  key={team.id}
                  href={`/tim/${team.id}`}
                  style={{ ['--i' as string]: i }}
                  className="animate-reveal group flex flex-col items-center gap-3 rounded-[28px] border border-line bg-gradient-to-bl from-raise to-ink p-5 text-center transition-colors duration-300 hover:border-blue/50"
                >
                  <Monogram
                    name={team.name}
                    shortName={team.short_name}
                    color={team.color}
                    size={56}
                  />
                  <span className="font-display text-[19px] font-bold leading-tight group-hover:text-blue">
                    {team.name}
                  </span>
                  <span className="label text-muted">
                    {team.group_name ? `Grup ${team.group_name}` : ''}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {teams.length === 0 && !loading && (
          <p className="py-8 text-muted">Belum ada tim yang terdaftar.</p>
        )}
      </div>
    </div>
  );
}