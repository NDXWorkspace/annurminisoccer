import type { MatchEventType } from './types';

/**
 * Kejadian pertandingan: kartu kuning/merah plus hal yang wajar terjadi
 * di lapangan (pelanggaran, penalti, cedera, catatan bebas).
 *
 * Validasi murni tanpa Supabase supaya bisa diuji unit test dan dipakai
 * bersama oleh route API dan panel /updateskor.
 */

export const MATCH_EVENT_TYPES: readonly MatchEventType[] = [
  'kartu_kuning',
  'kartu_merah',
  'pelanggaran',
  'penalti',
  'cedera',
  'lainnya',
];

export const EVENT_LABEL: Record<MatchEventType, string> = {
  kartu_kuning: 'Kartu kuning',
  kartu_merah: 'Kartu merah',
  pelanggaran: 'Pelanggaran',
  penalti: 'Penalti',
  cedera: 'Cedera',
  lainnya: 'Catatan',
};

/** Kartu selalu melekat pada tim — wajib pilih tim. */
export function eventNeedsTeam(type: MatchEventType): boolean {
  return type === 'kartu_kuning' || type === 'kartu_merah';
}

/**
 * Urut tampilan: kejadian yang punya menit dulu (urut menit), sisanya di
 * belakang mengikuti waktu pencatatan.
 */
export function sortMatchEvents<T extends { minute: number | null; created_at: string }>(
  events: T[]
): T[] {
  return [...events].sort((a, b) => {
    const am = a.minute ?? Number.MAX_SAFE_INTEGER;
    const bm = b.minute ?? Number.MAX_SAFE_INTEGER;
    if (am !== bm) return am - bm;
    return a.created_at.localeCompare(b.created_at);
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PLAYER = 60;
const MAX_NOTE = 200;

export interface ParsedMatchEvent {
  match_id: string;
  team_id: string | null;
  event_type: MatchEventType;
  player_name: string | null;
  minute: number | null;
  note: string | null;
}

export type ParseMatchEventResult =
  | { ok: true; value: ParsedMatchEvent }
  | { ok: false; error: string };

const asTrimmed = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/**
 * Validasi input kejadian dari /updateskor.
 * `ctx` diambil dari baris pertandingan asli supaya tim yang dipilih pasti
 * peserta laga itu (bukan tim acak dari kategori lain).
 */
export function parseMatchEvent(
  body: Record<string, unknown> | null | undefined,
  ctx: { matchId: string; teamAId: string; teamBId: string }
): ParseMatchEventResult {
  const matchId = asTrimmed(body?.match_id);
  if (!UUID_RE.test(matchId) || matchId !== ctx.matchId) {
    return { ok: false, error: 'ID pertandingan tidak valid.' };
  }

  const eventType = asTrimmed(body?.event_type) as MatchEventType;
  if (!MATCH_EVENT_TYPES.includes(eventType)) {
    return { ok: false, error: 'Jenis kejadian tidak valid.' };
  }

  const teamIdRaw = asTrimmed(body?.team_id);
  let teamId: string | null = null;
  if (teamIdRaw) {
    if (!UUID_RE.test(teamIdRaw) || (teamIdRaw !== ctx.teamAId && teamIdRaw !== ctx.teamBId)) {
      return { ok: false, error: 'Tim harus salah satu dari kedua tim yang bertanding.' };
    }
    teamId = teamIdRaw;
  } else if (eventNeedsTeam(eventType)) {
    return { ok: false, error: 'Pilih dulu tim untuk kartu ini.' };
  }

  const playerName = asTrimmed(body?.player_name);
  if (playerName.length > MAX_PLAYER) {
    return { ok: false, error: `Nama pemain maksimal ${MAX_PLAYER} karakter.` };
  }

  const minuteRaw = body?.minute;
  let minute: number | null = null;
  if (minuteRaw !== undefined && minuteRaw !== null) {
    const s = typeof minuteRaw === 'number' ? String(minuteRaw) : String(minuteRaw).trim();
    if (s !== '') {
      const n = Number(s);
      if (!Number.isInteger(n) || n < 0 || n > 120) {
        return { ok: false, error: 'Menit harus bilangan bulat 0-120.' };
      }
      minute = n;
    }
  }

  const note = asTrimmed(body?.note);
  if (note.length > MAX_NOTE) {
    return { ok: false, error: `Keterangan maksimal ${MAX_NOTE} karakter.` };
  }

  return {
    ok: true,
    value: {
      match_id: matchId,
      team_id: teamId,
      event_type: eventType,
      player_name: playerName || null,
      minute,
      note: note || null,
    },
  };
}
