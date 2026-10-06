import { describe, it, expect } from 'vitest';
import { planCategory } from '@/lib/bracket';
import type { Match, Team } from '@/lib/types';

let n = 0;

function team(id: string, group: string, category = 'U10'): Team {
  return {
    id,
    name: `Tim ${id}`,
    short_name: id.slice(0, 3).toUpperCase(),
    logo_url: null,
    group_name: group,
    color: null,
    created_at: '',
    category,
  };
}

function grupMatch(a: string, b: string, sa: number, sb: number, group: string, status: Match['status'] = 'finished'): Match {
  return {
    id: `m${++n}`,
    team_a_id: a,
    team_b_id: b,
    score_a: sa,
    score_b: sb,
    status,
    match_date: '2026-10-09',
    kickoff_time: '07:00',
    field: '1',
    stage: 'grup',
    group_name: group,
    updated_at: '',
    category: 'U10',
  };
}

function knockout(code: string, a: string, b: string, sa: number, sb: number, stage: Match['stage'] = 'perempat-final'): Match {
  return {
    id: `k${++n}`,
    team_a_id: a,
    team_b_id: b,
    score_a: sa,
    score_b: sb,
    status: 'finished',
    match_date: '2026-10-09',
    kickoff_time: '14:00',
    field: '1',
    stage,
    group_name: code,
    updated_at: '',
    category: 'U10',
  };
}

// Grup A tuntas: t1 juara (7 poin, +5), t3 runner-up (7 poin, +2).
function groupA(): { teams: Team[]; matches: Match[] } {
  const teams = ['t1', 't2', 't3', 't4'].map((id) => team(id, 'A'));
  const matches = [
    grupMatch('t1', 't2', 2, 0, 'A'),
    grupMatch('t1', 't3', 1, 1, 'A'),
    grupMatch('t1', 't4', 3, 0, 'A'),
    grupMatch('t2', 't3', 0, 1, 'A'),
    grupMatch('t2', 't4', 2, 2, 'A'),
    grupMatch('t3', 't4', 1, 0, 'A'),
  ];
  return { teams, matches };
}

function groupB(): { teams: Team[]; matches: Match[] } {
  const teams = ['u1', 'u2', 'u3', 'u4'].map((id) => team(id, 'B'));
  const matches = [
    grupMatch('u1', 'u2', 1, 0, 'B'),
    grupMatch('u1', 'u3', 1, 0, 'B'),
    grupMatch('u1', 'u4', 1, 0, 'B'),
    grupMatch('u2', 'u3', 0, 0, 'B'),
    grupMatch('u2', 'u4', 2, 0, 'B'),
    grupMatch('u3', 'u4', 0, 3, 'B'),
  ];
  return { teams, matches };
}

describe('braket gugur otomatis', () => {
  it('grup belum tuntas → tidak ada laga dibuat', () => {
    const { teams, matches } = groupA();
    const partial = matches.map((m, i) => (i < 4 ? m : { ...m, status: 'scheduled' as const }));
    const plan = planCategory(teams, partial, 'U10');
    expect(plan.creations).toHaveLength(0);
    const g = plan.groups.find((gr) => gr.group === 'A')!;
    expect(g.complete).toBe(false);
    expect(g.played).toBe(4);
  });

  it('grup A dan B tuntas → slot AA dibuat (J:A vs R:B)', () => {
    const a = groupA();
    const b = groupB();
    const plan = planCategory([...a.teams, ...b.teams], [...a.matches, ...b.matches], 'U10');
    expect(plan.creations).toHaveLength(1);
    const [qf] = plan.creations;
    expect(qf.stage).toBe('perempat-final');
    expect(qf.group_name).toBe('AA');
    expect(qf.team_a_id).toBe('t1'); // juara A
    expect(qf.team_b_id).toBe('u2'); // runner-up B (u1 juara: 9 poin)
    expect(plan.slots.find((s) => s.code === 'BB')?.state).toBe('waiting');
  });

  it('imbang persis di batas lolos → slot diblokir, tidak ditebak', () => {
    // a juara mutlak; b dan c imbang persis (4 poin, -1, 2 gol).
    const teams = ['a', 'b', 'c', 'd'].map((id) => team(id, 'A'));
    const matches = [
      grupMatch('a', 'b', 2, 0, 'A'),
      grupMatch('a', 'c', 2, 0, 'A'),
      grupMatch('a', 'd', 2, 0, 'A'),
      grupMatch('b', 'c', 1, 1, 'A'),
      grupMatch('b', 'd', 1, 0, 'A'),
      grupMatch('c', 'd', 1, 0, 'A'),
    ];
    const plan = planCategory(teams, matches, 'U10');
    expect(plan.creations).toHaveLength(0);
    const g = plan.groups.find((gr) => gr.group === 'A')!;
    expect(g.complete).toBe(true);
    expect(g.qualifiers).toBeNull();
    expect(g.blocked).toBeTruthy();
  });

  it('8 besar selesai → semifinal dibuat', () => {
    const a = groupA();
    const b = groupB();
    const teams = [...a.teams, ...b.teams];
    const matches = [...a.matches, ...b.matches, knockout('AA', 't1', 'u2', 2, 1), knockout('BB', 'u1', 't3', 0, 0)];
    // BB seri → semifinal EE menunggu, FF menunggu CC/DD
    const plan = planCategory(teams, matches, 'U10');
    expect(plan.creations).toHaveLength(0);
    const ee = plan.slots.find((s) => s.code === 'EE')!;
    expect(ee.state).toBe('blocked');
    expect(ee.detail).toContain('BB');
  });

  it('semifinal selesai → final dan perebutan juara 3 dibuat', () => {
    const teams = ['e1', 'e2', 'f1', 'f2'].map((id) => team(id, 'A'));
    const matches = [
      knockout('EE', 'e1', 'e2', 3, 1, 'semifinal'),
      knockout('FF', 'f1', 'f2', 0, 2, 'semifinal'),
    ];
    const plan = planCategory(teams, matches, 'U10');
    expect(plan.creations).toHaveLength(2);
    const fin = plan.creations.find((c) => c.group_name === 'F')!;
    const p3 = plan.creations.find((c) => c.group_name === 'P3')!;
    expect([fin.team_a_id, fin.team_b_id].sort()).toEqual(['e1', 'f2']);
    expect([p3.team_a_id, p3.team_b_id].sort()).toEqual(['e2', 'f1']);
  });

  it('slot yang sudah ada tidak dibuat ulang', () => {
    const a = groupA();
    const b = groupB();
    const teams = [...a.teams, ...b.teams];
    const matches = [...a.matches, ...b.matches, knockout('AA', 't1', 'u2', 0, 0)];
    // AA sudah ada (status live) → tidak ada kreasi, slot bertanda created
    const live = matches.map((m) => (m.group_name === 'AA' ? { ...m, status: 'live' as const } : m));
    const plan = planCategory(teams, live, 'U10');
    expect(plan.creations).toHaveLength(0);
    expect(plan.slots.find((s) => s.code === 'AA')?.state).toBe('created');
  });
});
