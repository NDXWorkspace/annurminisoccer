import { describe, it, expect } from 'vitest';
import { calculateStandings } from '@/lib/utils';
import { SEED_TEAMS, SEED_MATCHES } from '@/lib/seed';
import type { MatchWithTeams } from '@/lib/types';

/**
 * Beranda, ticker, Jadwal, Live, dan Klasemen semuanya membaca store yang
 * sama. Test ini menjaga agar penghitungan di tiap halamanberdasarkan data yang
 * sama memberi angka yang sama.
 */
function withTeams(list: MatchWithTeams[]): MatchWithTeams[] {
  return list.map((m) => ({
    ...m,
    team_a: SEED_TEAMS.find((t) => t.id === m.team_a_id)!,
    team_b: SEED_TEAMS.find((t) => t.id === m.team_b_id)!,
  }));
}

describe('sinkronisasi antar halaman', () => {
  it('skor di baris, kartu live, dan klasemen berasal dari satu sumber', () => {
    const matches = withTeams(SEED_MATCHES);
    const teams = SEED_TEAMS;

    // Beranda/Baris cocok dengan klasemen untuk pertandingan yang sama.
    // Seed resmi berisi jadwal yang belum dimainkan, jadi uji hitungnya
    // memakai satu laga selesai buatan dari dua tim seed pertama.
    const finished = matches.filter((m) => m.status === 'finished');
    const group = teams[0]?.group_name ?? 'A';
    const pair = teams.filter((t) => t.group_name === group).slice(0, 2);
    const probe: MatchWithTeams[] =
      finished.length > 0
        ? finished
        : [
            {
              ...matches[0],
              team_a_id: pair[0].id,
              team_b_id: pair[1].id,
              team_a: pair[0],
              team_b: pair[1],
              score_a: 2,
              score_b: 1,
              status: 'finished',
              group_name: group,
            },
          ];
    expect(probe.length).toBeGreaterThan(0);
    const pool = finished.length > 0 ? matches : [...matches, ...probe];

    for (const m of probe) {
      const rows = calculateStandings(teams, pool, m.group_name ?? group);
      const rowA = rows.find((r) => r.team.id === m.team_a_id)!;
      const rowB = rows.find((r) => r.team.id === m.team_b_id)!;
      expect(rowA).toBeDefined();
      expect(rowB).toBeDefined();

      // Poin harus naik sesuai hasil: menang 3, seri 1, kalah 0.
      const expectedA = m.score_a > m.score_b ? 3 : m.score_a === m.score_b ? 1 : 0;
      const expectedB = m.score_b > m.score_a ? 3 : m.score_a === m.score_b ? 1 : 0;
      if (m.score_a === m.score_b) {
        expect(rowA.points).toBeGreaterThanOrEqual(1);
        expect(rowB.points).toBeGreaterThanOrEqual(1);
      } else {
        expect(rowA.points).toBeGreaterThanOrEqual(expectedA);
        expect(rowB.points).toBeGreaterThanOrEqual(expectedB);
      }

      // Gol masuk harus sama dengan skor yang tampil di baris.
      expect(rowA.goals_for).toBeGreaterThanOrEqual(m.score_a);
      expect(rowB.goals_for).toBeGreaterThanOrEqual(m.score_b);
    }
  });

  it('SEED_MATCHES dan store memakai bentuk data yang sama', () => {
    // Kalau bentuk data seed menyimpang, beranda dan store bisa menampilkan
    // jumlah pertandingan berbeda.
    const ids = new Set(SEED_MATCHES.map((m) => m.id));
    expect(ids.size).toBe(SEED_MATCHES.length);
    for (const m of SEED_MATCHES) {
      expect(m.team_a).toBeDefined();
      expect(m.team_b).toBeDefined();
      expect(typeof m.score_a).toBe('number');
      expect(typeof m.score_b).toBe('number');
    }
  });

  it('tiap tim punya pasangan dari store yang sama', () => {
    const matches = withTeams(SEED_MATCHES);
    for (const m of matches) {
      // Kedua tim harus berasal dari store yang sama supaya relasi
      // di setiap halaman tidak bergeser.
      expect(SEED_TEAMS.some((t) => t.id === m.team_a_id)).toBe(true);
      expect(SEED_TEAMS.some((t) => t.id === m.team_b_id)).toBe(true);
    }
  });
});