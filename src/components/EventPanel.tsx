'use client';

import { useState } from 'react';
import type { MatchEventType, MatchWithTeams } from '@/lib/types';
import { EVENT_LABEL, MATCH_EVENT_TYPES, eventNeedsTeam } from '@/lib/events';
import EventChips from './EventChips';

/** Draft form yang dikirim ke POST /api/updateskor. */
export interface EventDraft {
  event_type: MatchEventType;
  team_id: string;
  player_name: string;
  minute: string;
  note: string;
}

const inputClass =
  'h-11 w-full rounded-full border border-line bg-surface px-4 text-sm text-text outline-none transition-colors placeholder:text-muted focus:border-blue';

/**
 * Panel "Kartu & catatan" per pertandingan di /updateskor: daftar kejadian
 * yang sudah tercatat (+ tombol hapus untuk koreksi) dan form cepat untuk
 * mencatat kartu kuning/merah serta kejadian lapangan lainnya.
 */
export default function EventPanel({
  match,
  disabled = false,
  onAdd,
  onRemove,
}: {
  match: MatchWithTeams;
  disabled?: boolean;
  onAdd: (draft: EventDraft) => Promise<string | null>;
  onRemove: (eventId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MatchEventType>('kartu_kuning');
  const [teamId, setTeamId] = useState('');
  const [player, setPlayer] = useState('');
  const [minute, setMinute] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const teams = [match.team_a, match.team_b].filter(Boolean);

  const close = () => {
    setOpen(false);
    setError('');
  };

  const submit = async () => {
    setBusy(true);
    const err = await onAdd({
      event_type: type,
      team_id: teamId,
      player_name: player,
      minute,
      note,
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setPlayer('');
    setMinute('');
    setNote('');
    setTeamId('');
    setError('');
    setOpen(false);
  };

  return (
    <div className="mb-3 rounded-[26px] border border-line bg-white/[0.025] px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="label text-muted">Kartu &amp; catatan</span>
        <button
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          className={`label rounded-full px-4 py-2 transition-colors ${
            open ? 'bg-text text-ink' : 'border border-line text-text hover:border-blue/50'
          }`}
        >
          {open ? 'Tutup' : '+ Catat'}
        </button>
      </div>

      <EventChips match={match} onDelete={onRemove} disabled={disabled || busy} />

      {open && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Jenis kejadian">
            {MATCH_EVENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={type === t}
                onClick={() => {
                  setType(t);
                  setError('');
                }}
                className={`label rounded-full border px-3.5 py-2 transition-colors ${
                  type === t
                    ? 'border-blue/60 bg-blue/15 text-text'
                    : 'border-line text-muted hover:text-text'
                }`}
              >
                {EVENT_LABEL[t]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label text-muted">Tim{eventNeedsTeam(type) ? ' *' : ''}</span>
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={teamId === t.id}
                onClick={() => {
                  setTeamId(teamId === t.id ? '' : t.id);
                  setError('');
                }}
                className={`label rounded-full border px-3.5 py-2 transition-colors ${
                  teamId === t.id
                    ? 'border-blue/60 bg-blue/15 text-text'
                    : 'border-line text-muted hover:text-text'
                }`}
              >
                {t.short_name}
              </button>
            ))}
            {teamId && (
              <button
                type="button"
                onClick={() => setTeamId('')}
                className="label px-2 py-2 text-muted underline-offset-4 hover:text-text hover:underline"
              >
                Tanpa tim
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={120}
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              placeholder="Menit"
              aria-label="Menit kejadian"
              className={inputClass}
            />
            <input
              type="text"
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
              maxLength={60}
              placeholder="Nama pemain"
              aria-label="Nama pemain"
              className={inputClass}
            />
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="Keterangan (opsional), mis. pelanggaran keras"
            aria-label="Keterangan"
            className={inputClass}
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy || disabled}
              className="label h-12 rounded-full bg-blue text-ink disabled:opacity-50"
            >
              {busy ? 'Menyimpan…' : 'Simpan catatan'}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="label h-12 rounded-full border border-line text-muted disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
