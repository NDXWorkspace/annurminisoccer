import { describe, it, expect } from 'vitest';
import { calculateStandings, calculateAllStandings, getInitials, getStatusLabel } from '@/lib/utils';
import type { Team, Match } from '@/lib/types';

const teams: Team[] = [
  { id: 'a', name: 'Alpha', short_name: 'ALP', group_name: 'A', logo_url: null, color: null, created_at: '' },
  { id: 'b', name: 'Beta', short_name: 'BET', group_name: 'A', logo_url: null, color: null, created_at: '' },
  { id: 'c', name: 'Gamma', short_name: 'GAM', group_name: 'B', logo_url: null, color: null, created_at: '' },
];

const matches: Match[] = [
  { id: '1', team_a_id: 'a', team_b_id: 'b', score_a: 3, score_b: 1, status: 'finished', group_name: 'A', match_date: '', kickoff_time: '', field: '', stage: 'grup', updated_at: '' },
  { id: '2', team_a_id: 'a', team_b_id: 'b', score_a: 0, score_b: 0, status: 'finished', group_name: '', match_date: '', kickoff_time: '', field: '', stage: 'grup', updated_at: '' },
  { id: '3', team_a_id: 'a', team_b_id: 'b', score_a: 2, score_b: 2, status: 'live', group_name: 'A', match_date: '', kickoff_time: '', field: '', stage: 'grup', updated_at: '' },
];

describe('calculateStandings', () => {
  it('menghitung poin, GD, dan urutan dengan benar', () => {
    const rows = calculateStandings(teams, matches, 'A');
    const alpha = rows.find((r) => r.team.id === 'a')!;
    const beta = rows.find((r) => r.team.id === 'b')!;
    expect(alpha.played).toBe(2);
    expect(alpha.won).toBe(1);
    expect(alpha.drawn).toBe(1);
    expect(alpha.goals_for).toBe(3);
    expect(alpha.goals_against).toBe(1);
    expect(alpha.goal_difference).toBe(2);
    expect(alpha.points).toBe(4);
    expect(beta.points).toBe(1);
    expect(rows[0].team.id).toBe('a');
  });

  it('mengabaikan pertandingan yang belum selesai', () => {
    const rows = calculateStandings(teams, matches, 'A');
    const alpha = rows.find((r) => r.team.id === 'a')!;
    expect(alpha.played).toBe(2); // laga live tidak dihitung
  });

  it('fallback ke grup tim saat match.group_name kosong', () => {
    const rows = calculateStandings(teams, matches, 'A');
    const beta = rows.find((r) => r.team.id === 'b')!;
    expect(beta.played).toBe(2); // match id=2 (group_name kosong) tetap dihitung
  });
});

describe('calculateAllStandings', () => {
  it('memisahkan grup A dan B', () => {
    const groups = calculateAllStandings(teams, matches);
    expect(groups.map((g) => g.group_name)).toEqual(['A', 'B']);
    const b = groups.find((g) => g.group_name === 'B')!;
    expect(b.rows[0].played).toBe(0);
  });
});

describe('helpers', () => {
  it('getInitials', () => {
    expect(getInitials('Annur All Star')).toBe('AA');
  });
  it('getStatusLabel', () => {
    expect(getStatusLabel('live')).toBe('LIVE');
  });
});
