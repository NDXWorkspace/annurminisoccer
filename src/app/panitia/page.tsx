'use client';

import { useState, useMemo, useRef } from 'react';
import type { MatchWithTeams } from '@/lib/types';
import { formatTime, todayWIB } from '@/lib/utils';
import {
  announceChangeEverywhere,
  matchesStore,
  useResource,
} from '@/lib/live-store';
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
  snapshot: { score_a: number; score_b: number; status: MatchWithTeams['status'] };
}

export default function SkorTab() {
  // Committee membaca store yang sama dengan halaman publik.Skor yang diinput
  //langsung terlihat di semua tab tanpa menunggu polling.
  const [matches, online, reload, loaded] = useResource(matchesStore);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('Semua');
  const [saveState, setSaveState] = useState<{ kind: 'idle' | 'saving' | 'saved' | 'error'; time: string }>({
    kind: 'idle',
    time: '',
  });
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [lastChange, setLastChange] = useState<string>('');
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoading = !loaded;

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
    const pool = matches.filter((m) => m.match_date === today);
    const source = pool.length > 0 ? pool : matches;
    const list = filter === 'Semua' ? source : source.filter((m) => m.category === filter);
    return [...list].sort((a, b) => {
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

  const push = async (id: string, body: Record<string, unknown>, undoable?: UndoState) => {
    setSaveState({ kind: 'saving', time: '' });
    try {
      const res = await fetch(`/api/matches/${id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setSaveState({ kind: 'saved', time: stamp(new Date()) });
      if (undoable) showUndo(undoable);
      // Segarkan store lokal lalu beritahukan SEMUA tab (publik dan panitia
      // lain) supaya angka berubah seketika, bukan setelah giliran polling.
      await matchesStore.refresh();
      announceChangeEverywhere();
    } catch {
      setSaveState({ kind: 'error', time: '' });
      reload();
    }
  };

  const changeScore = (m: MatchWithTeams, team: 'a' | 'b', delta: number) => {
    const next = team === 'a' ? m.score_a + delta : m.score_b + delta;
    if (next < 0 || next > 99) return;
    const teamId = team === 'a' ? m.team_a_id : m.team_b_id;
    const body = team === 'a' ? { score_a: next } : { score_b: next };
    const undoable =
      delta < 0
        ? {
            matchId: m.id,
            snapshot: { score_a: m.score_a, score_b: m.score_b, status: m.status },
          }
        : undefined;
    setLastChange(`${m.id}:${teamId}:${next}`);
    push(m.id, body, undoable);
  };

  const changeStatus = (m: MatchWithTeams, status: MatchWithTeams['status']) => {
    if (status === 'finished') {
      const ok = window.confirm(
        `Akhiri ${m.team_a?.name ?? 'Tim A'} ${m.score_a}–${m.score_b} ${m.team_b?.name ?? 'Tim B'}? Skor akhir dikunci di klasemen.`
      );
      if (!ok) return;
      push(
        m.id,
        { status },
        {
          matchId: m.id,
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
      <div className="h-40 animate-skeleton rounded-[28px] bg-raise" />
    );
  }

  const btn =
    'label h-14 rounded-full disabled:opacity-40';

  return (
    <div className="space-y-6 pb-20">
      {/* Dua slot lapangan */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SLOTS.map((s) => {
          const m = slotMatch(s.field);
          const active = m && selected?.id === m.id;
          return (
            <button
              key={s.field}
              onClick={() => m && setSelectedId(m.id)}
              disabled={!m}
              className={`panel px-5 py-4 text-left transition-colors ${
                active ? 'border-blue/60 bg-blue/10' : ''
              } disabled:opacity-40`}
            >
              <span className="label text-muted">
                Lapangan {s.field} · {s.category}
              </span>
              {m ? (
                <>
                  <span className="num mt-1.5 block text-2xl">
                    {m.team_a?.short_name ?? '?'} {m.score_a}–{m.score_b} {m.team_b?.short_name ?? '?'}
                  </span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    <span className="label text-muted">{formatTime(m.kickoff_time)}</span>
                  </span>
                </>
              ) : (
                <span className="mt-1.5 block text-sm text-muted">Tidak ada pertandingan.</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Layar input */}
      {selected ? (
        <section aria-label="Input skor" className="panel">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <CategoryMark category={selected.category ?? 'U10'} field={selected.field} />
            <StatusBadge status={selected.status} />
          </div>

          <div className="grid grid-cols-2" role="group" aria-label="Pilih lapangan">
            {SLOTS.map((s) => {
              const m = slotMatch(s.field);
              const on = selected.id === m?.id;
              return (
                <button
                  key={s.field}
                  disabled={!m}
                  onClick={() => m && setSelectedId(m.id)}
                  aria-pressed={on}
                  className={`label h-12 disabled:opacity-40 ${
                    on ? 'bg-blue text-ink' : 'text-muted'
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
                <div
                  key={side}
                  className="flex flex-col items-center border-r border-line px-2 py-6 last:border-0"
                >
                  <p className="line-clamp-2 min-h-[3.5rem] text-center font-display text-xl font-bold">
                    {team?.name ?? (side === 'a' ? 'Tim A' : 'Tim B')}
                  </p>
                  <span className="relative my-2 block text-[96px] leading-none" aria-live="polite">
                    <span key={score} className="num block animate-flip">
                      {score}
                    </span>
                    {lastChange === `${selected.id}:${team?.id ?? ''}:${score}` && (
                      <span
                        aria-hidden
                        className="animate-flash absolute inset-x-6 -bottom-1 h-1 rounded-full bg-yellow"
                      />
                    )}
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => changeScore(selected, side, -1)}
                      disabled={score <= 0}
                      aria-label={`Kurangi skor ${team?.name ?? ''}`}
                      className="num flex h-16 w-16 items-center justify-center rounded-full border border-line text-2xl font-bold disabled:opacity-30"
                    >
                      −
                    </button>
                    <button
                      onClick={() => changeScore(selected, side, 1)}
                      aria-label={`Tambah skor ${team?.name ?? ''}`}
                      className="num flex h-16 w-16 items-center justify-center rounded-full bg-blue text-3xl font-bold text-ink"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-line px-5 py-4">
            {selected.status === 'scheduled' && (
              <button onClick={() => changeStatus(selected, 'live')} className={`${btn} w-full bg-blue text-ink`}>
                Mulai pertandingan
              </button>
            )}
            {selected.status === 'live' && (
              <button onClick={() => changeStatus(selected, 'finished')} className={`${btn} w-full bg-blue text-ink`}>
                Akhiri pertandingan
              </button>
            )}
            {selected.status === 'halftime' && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => changeStatus(selected, 'live')} className={`${btn} bg-blue text-ink`}>
                  Lanjut babak 2
                </button>
                <button onClick={() => changeStatus(selected, 'finished')} className={`${btn} border border-line`}>
                  Akhiri
                </button>
              </div>
            )}
            {selected.status === 'finished' && (
              <p className="rounded-full bg-blue/15 px-5 py-3 text-center font-bold text-blue">
                Pertandingan selesai.
              </p>
            )}
            <p className="label mt-3 text-center text-muted" aria-live="polite">
              {saveState.kind === 'saving' && 'Menyimpan…'}
              {saveState.kind === 'saved' && `Tersimpan ${saveState.time}`}
              {saveState.kind === 'error' && (
                <>
                  Gagal menyimpan.{' '}
                  <button onClick={reload} className="text-blue underline">
                    Coba lagi
                  </button>
                </>
              )}
            </p>
          </div>
        </section>
      ) : (
        <p className="panel px-5 py-6 text-muted">
          Pilih pertandingan pada slot lapangan atau daftar di bawah untuk membuka input skor.
        </p>
      )}

      {/* Daftar hari ini */}
      <section aria-label="Pertandingan hari ini">
        <div className="flex items-center justify-between gap-3">
          <h2 className="rule-title font-display text-2xl font-extrabold">Hari ini</h2>
          <div className="pill gap-0.5 p-1" role="group" aria-label="Kategori">
            {['Semua', 'U10', 'U12'].map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                aria-pressed={filter === c}
                className={`label rounded-full px-4 py-2.5 ${
                  filter === c ? 'bg-text text-ink' : 'text-muted'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-[28px] border border-line">
          {todayList.length === 0 ? (
            <p className="bg-surface px-5 py-6 text-muted">Tidak ada pertandingan.</p>
          ) : (
            todayList.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`flex w-full items-center gap-3 border-b border-line bg-surface px-5 py-3 text-left last:border-0 ${
                  selectedId === m.id ? 'border-l-4 border-l-blue' : ''
                }`}
              >
                <span className="label w-14 flex-none text-muted">{formatTime(m.kickoff_time)}</span>
                <span className="min-w-0 flex-1 truncate text-base font-bold">
                  {m.team_a?.short_name ?? '?'} {m.score_a}–{m.score_b} {m.team_b?.short_name ?? '?'}
                </span>
                <StatusBadge status={m.status} />
                <span className="label hidden text-muted sm:inline">
                  M-{String(i + 1).padStart(2, '0')}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {undo && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface px-5 py-3">
          <div className="wrap flex items-center justify-between gap-3">
            <p className="text-sm text-muted">Perubahan terakhir bisa dibatalkan.</p>
            <button
              onClick={doUndo}
              className="label h-11 flex-none rounded-full bg-yellow px-5 text-ink"
            >
              Urungkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}