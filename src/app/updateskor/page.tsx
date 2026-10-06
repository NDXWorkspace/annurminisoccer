'use client';

import { useEffect, useState } from 'react';
import type { MatchWithTeams } from '@/lib/types';
import MatchRow from '@/components/MatchRow';
import EmptyState from '@/components/EmptyState';
import { announceChangeEverywhere, matchesStore, useResource } from '@/lib/live-store';

/** Papan skor lapangan: satu layar untuk wasit di dua lapangan. */
export default function UpdateSkorPage() {
  // Papan wasit memakai store yang sama dengan halaman publik, jadi skor
  // yang diketik di sini muncul seketika di semua tab.
  const [matches, online, reload, loaded] = useResource(matchesStore);
  const [selectedField, setSelectedField] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const loading = !loaded;

  useEffect(() => {
    if (!online) return;
    setLastUpdated(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
  }, [matches, online]);

  const fields = [...new Set(matches.map((m) => m.field).filter(Boolean))] as string[];

  const shown = matches
    .filter((m) => m.status === 'live' || m.status === 'halftime')
    .filter((m) => (selectedField === 'all' ? true : m.field === selectedField))
    .sort((a, b) => a.kickoff_time.localeCompare(b.kickoff_time));

  const update = async (m: MatchWithTeams, body: Record<string, unknown>) => {
    try {
      setSaving(m.id);
      const res = await fetch(`/api/updateskor?id=${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      // Segarkan store lokal lalu siarkan ke semua tab terbuka.
      await matchesStore.refresh();
      announceChangeEverywhere();
    } catch {
      reload();
    } finally {
      setSaving(null);
    }
  };

  const bump = (m: MatchWithTeams, side: 'a' | 'b', delta: number) => {
    const next = side === 'a' ? m.score_a + delta : m.score_b + delta;
    if (next < 0 || next > 99) return;
    update(m, side === 'a' ? { score_a: next } : { score_b: next });
  };

  const setStatus = (m: MatchWithTeams, status: MatchWithTeams['status']) => {
    if (status === 'finished') {
      const ok = window.confirm(
        `Akhiri ${m.team_a?.name ?? 'Tim A'} ${m.score_a}–${m.score_b} ${m.team_b?.name ?? 'Tim B'}? Skor akhir dikunci di klasemen.`
      );
      if (!ok) return;
    }
    update(m, { status });
  };

  return (
    <div className="min-h-screen bg-ink pb-12">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="wrap flex h-14 items-center justify-between gap-3">
          <span className="font-display text-[17px] font-extrabold">Update skor</span>
          <span className="label text-muted" aria-live="polite">
            {saving ? 'Menyimpan…' : lastUpdated ? `Diperbarui ${lastUpdated}` : 'Memuat…'}
          </span>
        </div>
        <div className="wrap pb-2.5">
          <div className="pill gap-0.5 p-1" role="group" aria-label="Lapangan">
            {['all', ...fields].map((f) => (
              <button
                key={f}
                aria-pressed={selectedField === f}
                onClick={() => setSelectedField(f)}
                className={`label flex-1 rounded-full px-4 py-2.5 transition-colors ${
                  selectedField === f ? 'bg-text text-ink' : 'text-muted'
                }`}
              >
                {f === 'all' ? 'Semua' : `Lapangan ${f}`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {!online && (
        <div className="wrap pt-3">
          <p className="rounded-full border border-line bg-surface px-5 py-2 text-sm text-muted">
            Koneksi terputus. Menampilkan data terakhir.
          </p>
        </div>
      )}

      <main className="wrap pt-6">
        {loading ? (
          <div className="space-y-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 animate-skeleton rounded-[26px] bg-raise" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            title="Tidak ada pertandingan berlangsung"
            description={
              selectedField !== 'all'
                ? `Tidak ada pertandingan di lapangan ${selectedField}.`
                : 'Semua pertandingan sudah selesai atau belum dimulai.'
            }
          />
        ) : (
          <div className="space-y-2.5">
            {shown.map((m, i) => (
              <div key={m.id}>
                <MatchRow
                  match={m}
                  code={`Lapangan ${m.field}`}
                  showCategory={Boolean(m.category)}
                />
                <div className="mb-3 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => bump(m, 'a', 1)}
                    disabled={saving === m.id}
                    className="label h-14 rounded-full bg-blue text-ink disabled:opacity-50"
                  >
                    +1 {m.team_a?.short_name ?? 'Tim A'}
                  </button>
                  <button
                    onClick={() => bump(m, 'b', 1)}
                    disabled={saving === m.id}
                    className="label h-14 rounded-full bg-blue text-ink disabled:opacity-50"
                  >
                    +1 {m.team_b?.short_name ?? 'Tim B'}
                  </button>
                  <button
                    onClick={() => bump(m, 'a', -1)}
                    disabled={saving === m.id || m.score_a === 0}
                    className="label h-14 rounded-full border border-line text-muted disabled:opacity-40"
                  >
                    −1 {m.team_a?.short_name ?? 'Tim A'}
                  </button>
                  <button
                    onClick={() => bump(m, 'b', -1)}
                    disabled={saving === m.id || m.score_b === 0}
                    className="label h-14 rounded-full border border-line text-muted disabled:opacity-40"
                  >
                    −1 {m.team_b?.short_name ?? 'Tim B'}
                  </button>
                  {m.status === 'live' && (
                    <>
                      <button
                        onClick={() => setStatus(m, 'halftime')}
                        disabled={saving === m.id}
                        className="label col-span-2 h-14 rounded-full border border-line text-text disabled:opacity-50"
                      >
                        Istirahat
                      </button>
                      <button
                        onClick={() => setStatus(m, 'finished')}
                        disabled={saving === m.id}
                        className="label col-span-2 h-14 rounded-full bg-yellow text-ink disabled:opacity-50"
                      >
                        Akhiri pertandingan
                      </button>
                    </>
                  )}
                  {m.status === 'halftime' && (
                    <>
                      <button
                        onClick={() => setStatus(m, 'live')}
                        disabled={saving === m.id}
                        className="label col-span-2 h-14 rounded-full bg-blue text-ink disabled:opacity-50"
                      >
                        Lanjut babak 2
                      </button>
                      <button
                        onClick={() => setStatus(m, 'finished')}
                        disabled={saving === m.id}
                        className="label col-span-2 h-14 rounded-full bg-yellow text-ink disabled:opacity-50"
                      >
                        Akhiri pertandingan
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}