import { describe, it, expect } from 'vitest';
import {
  EVENT_LABEL,
  MATCH_EVENT_TYPES,
  eventNeedsTeam,
  parseMatchEvent,
  sortMatchEvents,
} from '@/lib/events';

const MATCH = '11111111-1111-4111-8111-111111111111';
const TEAM_A = '22222222-2222-4222-8222-222222222222';
const TEAM_B = '33333333-3333-4333-8333-333333333333';
const OTHER = '44444444-4444-4444-8444-444444444444';
const ctx = { matchId: MATCH, teamAId: TEAM_A, teamBId: TEAM_B };

describe('parseMatchEvent', () => {
  it('menerima kartu kuning lengkap dan merapikan nilai', () => {
    const r = parseMatchEvent(
      {
        match_id: MATCH,
        event_type: 'kartu_kuning',
        team_id: TEAM_A,
        player_name: '  Rian  ',
        minute: '12',
        note: '',
      },
      ctx
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual({
        match_id: MATCH,
        team_id: TEAM_A,
        event_type: 'kartu_kuning',
        player_name: 'Rian',
        minute: 12,
        note: null,
      });
    }
  });

  it('kartu wajib memilih tim', () => {
    const r = parseMatchEvent({ match_id: MATCH, event_type: 'kartu_merah' }, ctx);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/tim/i);
  });

  it('menolak tim di luar peserta laga', () => {
    const r = parseMatchEvent(
      { match_id: MATCH, event_type: 'kartu_kuning', team_id: OTHER },
      ctx
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/bertanding/i);
  });

  it('menolak jenis kejadian tak dikenal', () => {
    const r = parseMatchEvent({ match_id: MATCH, event_type: 'offside' }, ctx);
    expect(r.ok).toBe(false);
  });

  it('menolak match_id yang bukan milik konteks', () => {
    const r = parseMatchEvent({ match_id: OTHER, event_type: 'lainnya' }, ctx);
    expect(r.ok).toBe(false);
  });

  it('menolak menit di luar 0-120, desimal, dan bukan angka', () => {
    for (const bad of ['-1', '121', '12.5', 'abc']) {
      const r = parseMatchEvent({ match_id: MATCH, event_type: 'lainnya', minute: bad }, ctx);
      expect(r.ok, `menit ${bad} harus ditolak`).toBe(false);
    }
  });

  it('menit kosong atau spasi menjadi null', () => {
    for (const blank of ['', '   ', null, undefined]) {
      const r = parseMatchEvent({ match_id: MATCH, event_type: 'lainnya', minute: blank }, ctx);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.value.minute).toBeNull();
    }
  });

  it('catatan bebas tanpa tim diperbolehkan', () => {
    const r = parseMatchEvent(
      { match_id: MATCH, event_type: 'lainnya', note: ' WASIT: laga dihentikan sejenak' },
      ctx
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.team_id).toBeNull();
      expect(r.value.note).toBe('WASIT: laga dihentikan sejenak');
    }
  });

  it('menolak nama pemain dan keterangan yang kepanjangan', () => {
    const long = 'x'.repeat(300);
    expect(
      parseMatchEvent({ match_id: MATCH, event_type: 'lainnya', player_name: long }, ctx).ok
    ).toBe(false);
    expect(parseMatchEvent({ match_id: MATCH, event_type: 'lainnya', note: long }, ctx).ok).toBe(
      false
    );
  });
});

describe('sortMatchEvents', () => {
  it('urut menit naik; kejadian tanpa menit di belakang', () => {
    const arr = [
      { minute: null, created_at: '2026-10-09T10:00:00+00:00' },
      { minute: 30, created_at: '2026-10-09T09:00:00+00:00' },
      { minute: 12, created_at: '2026-10-09T11:00:00+00:00' },
    ];
    expect(sortMatchEvents(arr).map((e) => e.minute)).toEqual([12, 30, null]);
  });
});

describe('label dan aturan tipe', () => {
  it('semua tipe punya label berbahasa Indonesia', () => {
    expect(MATCH_EVENT_TYPES).toHaveLength(6);
    for (const t of MATCH_EVENT_TYPES) expect(EVENT_LABEL[t]).toBeTruthy();
    expect(EVENT_LABEL.kartu_merah).toBe('Kartu merah');
  });

  it('hanya kartu yang wajib memilih tim', () => {
    expect(eventNeedsTeam('kartu_kuning')).toBe(true);
    expect(eventNeedsTeam('kartu_merah')).toBe(true);
    expect(eventNeedsTeam('penalti')).toBe(false);
    expect(eventNeedsTeam('cedera')).toBe(false);
  });
});
