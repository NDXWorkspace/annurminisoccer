'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { MatchWithTeams } from '@/lib/types';
import { formatTime, todayWIB } from '@/lib/utils';
import CategoryMark from '@/components/CategoryMark';
import StatusBadge from '@/components/StatusBadge';

const SLOTS = [
  { field: '1', category: 'U10' },
  { field: '2', category: 'U12' },
];

function stamp(date: Date): string {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

interface UndoState {
  matchId: string;
  label: string;
  snapshot: { score_a: number; score_b: number; status: MatchWithTeams['status'] };
}

export default function SkorTab() {
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<{ kind: 'idle' | 'saving' | 'saved' | 'error'; time: string }>({
    kind: 'idle',
    time: '',
  });
  const [undo, setUndo] = useState<UndoState | null>(null);
  const savingRef = useRef<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const fetchMatches = async (initial = false) => {
    try {
      if (initial) setIsLoading(true);
      const res = await fetch('/api/matches', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.data && !savingRef.current) {
        setMatches(data.data);
      }
    } catch {
      // Abaikan: indikator offline ditangani tombol coba lagi.
    } finally {
      if (initial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(true);
    const id = setInterval(() => {
      if (!document.hidden) fetchMatches(false);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const slotMatch = (field: string): MatchWithTeams | undefined => {
    const inField = matches.filter((m) => m.field === field);
    const live = inField
      .filter((m) => m.status === 'live' || m.status === 'halftime')
      .sort((a, b) => a.kickoff_time.localeCompare(b.kickoff_time))[0];
    if (live) return live;
    return inField
      .filter((m) => m.status === 'scheduled')
      .sort((a, b) =>
        `${a.match_date}${a.kickoff_time}`.localeCompare(`${b.match_date}${b.kickoff_time}`)
      )[0];
  };

  const selected = matches.find((m) => m.id === selectedId) ?? null;

  const todayList = useMemo(() => {
    const today = todayWIB();
    const list = matches.filter((m) => m.match_date === today);
    const pool = list.length > 0 ? list : matches;
    const filtered = filter === 'Semua' ? pool : pool.filter((m) => m.category === filter);
    return [...filtered].sort((a, b) => {
      const liveA = a.status === 'live' || a.status === 'halftime';
      const liveB = b.status === 'live' || b.status === 'halftime';
      if (liveA !== liveB) return liveA ? -1 : 1;
      return `${a.match_date}${a.kickoff_time}`.localeCompare(`${b.match_date}${b.kickoff_time}`);
    });
  }, [matches, filter]);

  const showUndo = (u: UndoState) => {
    setUndo(u);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 6000);
  };

  const push = async (id: string, body: Partial<MatchWithTeams>, undoable?: UndoState) => {
    savingRef.current = id;
    setSaveState({ kind: 'saving', time: '' });
    // Optimistis.
    setMatches((cur) => cur.map((m) => (m.id === id ? { ...m, ...body } : m)));
    try {
      const res = await fetch(`/api/matches/${id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setSaveState({ kind: 'saved', time: stamp(new Date()) });
      if (undoable) showUndo(undoable);
      await fetchMatches(false);
    } catch {
      setSaveState({ kind: 'error', time: '' });
      await fetchMatches(false);
    } finally {
      savingRef.current = null;
    }
  };

  const changeScore = (m: MatchWithTeams, team: 'a' | 'b', delta: number) => {
    const next = team === 'a' ? m.score_a + delta : m.score_b + delta;
    if (next < 0 || next > 99) return;
    const body = team === 'a' ? { score_a: next } : { score_b: next };
    const undoable =
      delta < 0
        ? {
            matchId: m.id,
            label: 'Pengurangan skor dibatalkan.',
            snapshot: { score_a: m.score_a, score_b: m.score_b, status: m.status },
          }
        : undefined;
    push(m.id, body, undoable);
  };

  const changeStatus = (m: MatchWithTeams, status: MatchWithTeams['status']) => {
    if (status === 'finished') {
      const ok = window.confirm(
        `Akhiri pertandingan ${m.team_a?.name ?? 'Tim A'} ${m.score_a}–${m.score_b} ${m.team_b?.name ?? 'Tim B'}? Skor akhir akan dikunci di klasemen.`
      );
      if (!ok) return;
      push(
        m.id,
        { status },
        {
          matchId: m.id,
          label: 'Pengakhiran dibatalkan.',
          snapshot: { score_a: m.score_a, score_b: m.score_b, status: m.status },
        }
      );
      return;
    }
    push(m.id, { status });
  };

  const doUndo = async () => {
    if (!undo) return;
    const { matchId, snapshot } = undo;
    setUndo(null);
    await push(matchId, snapshot);
  };

  if (isLoading) {
    return (
      <div className="border border-rule bg-white px-4 py-8">
        <div className="h-8 w-1/2 bg-rule" />
        <div className="mt-3 h-4 w-1/3 bg-rule" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ===== Dua slot tetap ===== */}
      <div className="grid gap-px border border-rule bg-rule sm:grid-cols-2">
        {SLOTS.map((s) => {
          const m = slotMatch(s.field);
          const active = m && selected?.id === m.id;
          return (
            <button
              key={s.field}
              onClick={() => m && setSelectedId(m.id)}
              disabled={!m}
              className={`bg-white px-4 py-4 text-left ${active ? 'outline outline-2 outline-blue' : ''}`}
            >
              <span className="label text-muted">
                Lapangan {s.field} · {s.category}
              </span>
              {m ? (
                <span className="mt-1 block">
                  <span className="block truncate font-display text-xl font-bold text-ink">
                    {m.team_a?.short_name ?? '?'} {m.score_a}–{m.score_b} {m.team_b?.short_name ?? '?'}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    <span className="font-mono text-xs text-muted">{formatTime(m.kickoff_time)}</span>
                  </span>
                </span>
              ) : (
                <span className="mt-1 block text-sm text-muted">Tidak ada pertandingan.</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===== Layar input ===== */}
      {selected ? (
        <section aria-label="Input skor" className="border border-rule bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2">
            <CategoryMark category={selected.category ?? (selected.field === '2' ? 'U12' : 'U10')} field={selected.field} />
            <StatusBadge status={selected.status} />
          </div>

          {/* Pengalih lapangan satu ketukan */}
          <div className="grid grid-cols-2 border-b border-rule" role="group" aria-label="Pilih lapangan">
            {SLOTS.map((s) => {
              const m = slotMatch(s.field);
              const on = selected.id === m?.id;
              return (
                <button
                  key={s.field}
                  disabled={!m}
                  onClick={() => m && setSelectedId(m.id)}
                  aria-pressed={on}
                  className={`h-12 font-display text-base font-bold uppercase disabled:opacity-40 ${
                    on ? 'bg-blue text-white' : 'text-ink'
                  }`}
                >
                  L{s.field} · {s.category}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2">
            {(['a', 'b'] as const).map((side) => {
              const team = side === 'a' ? selected.team_a : selected.team_b;
              const score = side === 'a' ? selected.score_a : selected.score_b;
              return (
                <div key={side} className="flex flex-col items-center border-r border-rule px-2 py-6 last:border-0">
                  <p className="line-clamp-2 min-h-[3.5rem] text-center font-display text-xl font-bold text-ink">
                    {team?.name ?? (side === 'a' ? 'Tim A' : 'Tim B')}
                  </p>
                  <p className="score-display my-2 text-[96px] text-ink" aria-live="polite">
                    {score}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => changeScore(selected, side, -1)}
                      disabled={score <= 0}
                      aria-label={`Kurangi skor ${team?.name ?? ''}`}
                      className="flex h-16 w-16 items-center justify-center rounded-[4px] border-[1.5px] border-ink font-display text-2xl font-bold text-ink disabled:opacity-30"
                    >
                      −
                    </button>
                    <button
                      onClick={() => changeScore(selected, side, 1)}
                      aria-label={`Tambah skor ${team?.name ?? ''}`}
                      className="flex h-16 w-16 items-center justify-center rounded-[4px] bg-blue font-display text-2xl font-bold text-white hover:bg-ink"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-rule px-4 py-4">
            {selected.status === 'scheduled' && (
              <button
                onClick={() => changeStatus(selected, 'live')}
                className="h-14 w-full rounded-[4px] bg-blue font-display text-base font-bold uppercase text-white hover:bg-ink"
              >
                Mulai pertandingan
              </button>
            )}
            {selected.status === 'live' && (
              <button
                onClick={() => changeStatus(selected, 'finished')}
                className="h-14 w-full rounded-[4px] bg-blue font-display text-base font-bold uppercase text-white hover:bg-ink"
              >
                Akhiri pertandingan
              </button>
            )}
            {selected.status === 'halftime' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => changeStatus(selected, 'live')}
                  className="h-14 rounded-[4px] bg-blue font-display text-base font-bold uppercase text-white hover:bg-ink"
                >
                  Lanjut babak 2
                </button>
                <button
                  onClick={() => changeStatus(selected, 'finished')}
                  className="h-14 rounded-[4px] border-[1.5px] border-ink font-display text-base font-bold uppercase text-ink"
                >
                  Akhiri
                </button>
              </div>
            )}
            {selected.status === 'finished' && (
              <p className="bg-blue-tint px-4 py-3 text-center font-bold text-blue">
                Pertandingan selesai.
              </p>
            )}
            <p className="mt-2 text-center font-mono text-[13px] text-muted" aria-live="polite">
              {saveState.kind === 'saving' && 'Menyimpan…'}
              {saveState.kind === 'saved' && `Tersimpan ${saveState.time}`}
              {saveState.kind === 'error' && (
                <>
                  Gagal menyimpan.{' '}
                  <button onClick={() => fetchMatches(false)} className="text-blue underline">
                    Coba lagi
                  </button>
                </>
              )}
            </p>
          </div>
        </section>
      ) : (
        <p className="border border-rule bg-white px-4 py-6 text-muted">
          Pilih pertandingan pada slot lapangan atau daftar di bawah untuk membuka input skor.
        </p>
      )}

      {/* ===== Daftar hari ini ===== */}
      <section aria-label="Pertandingan hari ini">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold text-ink">Hari ini</h2>
          <div className="flex border border-rule bg-white" role="group" aria-label="Kategori">
            {['Semua', 'U10', 'U12'].map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                aria-pressed={filter === c}
                className={`h-11 px-4 font-display text-sm font-bold uppercase ${
                  filter === c ? 'bg-blue text-white' : 'text-ink'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 border-t border-rule">
          {todayList.length === 0 ? (
            <p className="border-b border-rule bg-white px-4 py-6 text-muted">
              Tidak ada pertandingan.
            </p>
          ) : (
            todayList.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`flex w-full items-center gap-3 border-b border-rule bg-white px-4 py-3 text-left ${
                  selectedId === m.id ? 'border-l-4 border-l-blue' : ''
                }`}
              >
                <span className="tnum w-14 shrink-0 font-mono text-[13px] text-muted">
                  {formatTime(m.kickoff_time)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">
                  {m.team_a?.short_name ?? '?'} {m.score_a}–{m.score_b} {m.team_b?.short_name ?? '?'}
                </span>
                <StatusBadge status={m.status} />
                <span className="hidden font-mono text-xs text-muted sm:inline">
                  M-{String(i + 1).padStart(2, '0')}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* ===== Toast urungkan ===== */}
      {undo && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-ink px-4 py-3">
          <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3">
            <p className="text-sm text-white">{undo.label}</p>
            <button
              onClick={doUndo}
              className="h-11 shrink-0 rounded-[4px] bg-whistle px-5 font-display text-sm font-bold uppercase text-ink"
            >
              Urungkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
