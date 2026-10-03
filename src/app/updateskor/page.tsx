'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import CategoryMark from '@/components/CategoryMark';
import StatusBadge from '@/components/StatusBadge';

interface Team {
  id: string;
  name: string;
  short_name: string;
}

interface Match {
  id: string;
  team_a_id: string;
  team_b_id: string;
  team_a: Team;
  team_b: Team;
  score_a: number;
  score_b: number;
  status: 'scheduled' | 'live' | 'halftime' | 'finished';
  match_date: string;
  kickoff_time: string;
  field: string;
  stage: string;
  group_name: string | null;
  category?: string | null;
}

export default function UpdateSkorPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedField, setSelectedField] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches', { cache: 'no-store' });
      const data = await res.json();
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(() => {
      if (!document.hidden) fetchMatches();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fields = useMemo(() => {
    const f = matches.map((m) => m.field).filter(Boolean) as string[];
    return [...new Set(f)].sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    let list = matches.filter((m) => m.status === 'live' || m.status === 'halftime');
    if (selectedField !== 'all') list = list.filter((m) => m.field === selectedField);
    return list.sort((a, b) => a.kickoff_time.localeCompare(b.kickoff_time));
  }, [matches, selectedField]);

  const updateScore = async (id: string, team: 'a' | 'b', delta: number) => {
    const match = matches.find((m) => m.id === id);
    if (!match) return;
    const newScoreA = team === 'a' ? match.score_a + delta : match.score_a;
    const newScoreB = team === 'b' ? match.score_b + delta : match.score_b;
    if (newScoreA < 0 || newScoreB < 0) return;
    try {
      setSaving(id);
      await fetch(`/api/updateskor?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score_a: newScoreA, score_b: newScoreB }),
      });
      fetchMatches();
    } catch {
      setOffline(true);
    } finally {
      setSaving(null);
    }
  };

  const updateStatus = async (match: Match, newStatus: Match['status']) => {
    if (newStatus === 'finished') {
      const ok = window.confirm(
        `Akhiri pertandingan ${match.team_a.name} ${match.score_a}–${match.score_b} ${match.team_b.name}? Skor akhir akan dikunci di klasemen.`
      );
      if (!ok) return;
    }
    try {
      setSaving(match.id);
      await fetch(`/api/updateskor?id=${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchMatches();
    } catch {
      setOffline(true);
    } finally {
      setSaving(null);
    }
  };

  const liveByField = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    filteredMatches.forEach((m) => {
      if (!groups[m.field]) groups[m.field] = [];
      groups[m.field].push(m);
    });
    return groups;
  }, [filteredMatches]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="header-shadow border-b border-rule bg-white">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">Update skor</h1>
            <p className="mt-1 text-sm text-muted">
              Halaman wasit. Tanpa masuk. Perubahan tampil di publik dalam beberapa detik.
            </p>
          </div>
          <p className="font-mono text-[13px] text-muted" aria-live="polite">
            {saving ? 'Menyimpan…' : lastUpdated ? `Diperbarui ${lastUpdated}` : 'Memuat…'}
          </p>
        </div>
        {fields.length > 0 && (
          <div className="mx-auto w-full max-w-[1080px] px-4 pb-3">
            <div className="grid grid-cols-3 border border-rule bg-white" role="group" aria-label="Lapangan">
              {['all', ...fields].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedField(f)}
                  aria-pressed={selectedField === f}
                  className={`h-12 font-display text-base font-bold uppercase ${
                    selectedField === f ? 'bg-blue text-white' : 'text-ink'
                  }`}
                >
                  {f === 'all' ? 'Semua' : `Lap ${f}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {offline && (
        <div className="border-b border-rule bg-white">
          <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-2 px-4 py-2">
            <p className="text-sm text-muted">Koneksi terputus. Menampilkan data terakhir.</p>
            <button
              onClick={fetchMatches}
              className="h-11 font-display text-sm font-bold uppercase text-blue"
            >
              Muat ulang
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1080px] px-4 py-6">
        {loading ? (
          <div className="border border-rule bg-white px-4 py-8">
            <div className="h-8 w-1/2 bg-rule" />
            <div className="mt-3 h-4 w-1/3 bg-rule" />
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="border border-rule bg-white px-4 py-10 text-center">
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Tidak ada pertandingan berlangsung
            </h2>
            <p className="mx-auto mt-2 max-w-[65ch] text-sm text-muted">
              {selectedField !== 'all'
                ? `Tidak ada pertandingan di lapangan ${selectedField}.`
                : 'Semua pertandingan sudah selesai atau belum dimulai.'}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(liveByField).map(([field, list]) => (
              <section key={field} aria-label={`Lapangan ${field}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-2xl font-extrabold text-ink">
                    Lapangan {field}
                  </h2>
                  <p className="font-mono text-[13px] text-muted">
                    {list.length} berlangsung
                  </p>
                </div>
                <div className="mt-3 grid gap-6 lg:grid-cols-2">
                  {list.map((m) => (
                    <div key={m.id} className="border border-rule bg-white">
                      <div className="flex items-center justify-between gap-2 border-b border-rule px-4 py-2">
                        {m.category ? (
                          <CategoryMark category={m.category} field={m.field} />
                        ) : (
                          <span className="font-mono text-xs text-muted">
                            {m.kickoff_time.slice(0, 5)}
                          </span>
                        )}
                        <StatusBadge status={m.status} />
                      </div>

                      <div className="grid grid-cols-2">
                        {(['a', 'b'] as const).map((side) => {
                          const team = side === 'a' ? m.team_a : m.team_b;
                          const score = side === 'a' ? m.score_a : m.score_b;
                          return (
                            <div
                              key={side}
                              className="flex flex-col items-center border-r border-rule px-2 py-5 last:border-0"
                            >
                              <p className="line-clamp-2 min-h-[3rem] text-center font-display text-lg font-bold text-ink">
                                {team.name}
                              </p>
                              <p className="score-display my-1 text-[64px] text-ink" aria-live="polite">
                                {score}
                              </p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => updateScore(m.id, side, -1)}
                                  disabled={score <= 0 || saving === m.id}
                                  aria-label={`Kurangi skor ${team.name}`}
                                  className="flex h-16 w-16 items-center justify-center rounded-[4px] border-[1.5px] border-ink font-display text-2xl font-bold text-ink disabled:opacity-30"
                                >
                                  −
                                </button>
                                <button
                                  onClick={() => updateScore(m.id, side, 1)}
                                  disabled={saving === m.id}
                                  aria-label={`Tambah skor ${team.name}`}
                                  className="flex h-16 w-16 items-center justify-center rounded-[4px] bg-blue font-display text-2xl font-bold text-white hover:bg-ink disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-0 border-t border-rule">
                        {m.status === 'live' && (
                          <>
                            <button
                              onClick={() => updateStatus(m, 'halftime')}
                              disabled={saving === m.id}
                              className="h-14 font-display text-base font-bold uppercase text-ink hover:bg-blue-tint disabled:opacity-50"
                            >
                              Istirahat
                            </button>
                            <button
                              onClick={() => updateStatus(m, 'finished')}
                              disabled={saving === m.id}
                              className="h-14 border-l border-rule font-display text-base font-bold uppercase text-alert disabled:opacity-50"
                            >
                              Selesai
                            </button>
                          </>
                        )}
                        {m.status === 'halftime' && (
                          <>
                            <button
                              onClick={() => updateStatus(m, 'live')}
                              disabled={saving === m.id}
                              className="h-14 bg-blue font-display text-base font-bold uppercase text-white hover:bg-ink disabled:opacity-50"
                            >
                              Lanjut
                            </button>
                            <button
                              onClick={() => updateStatus(m, 'finished')}
                              disabled={saving === m.id}
                              className="h-14 border-l border-rule font-display text-base font-bold uppercase text-alert disabled:opacity-50"
                            >
                              Selesai
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-rule bg-white">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-6">
          <p className="max-w-[65ch] text-sm text-muted">
            Skor diinput manual oleh panitia. Jika ada selisih, keputusan panitia yang
            berlaku.{' '}
            <Link href="/live" className="font-bold text-blue">
              Lihat halaman live
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
