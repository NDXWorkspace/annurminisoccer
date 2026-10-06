import { calculateStandings } from './utils';
import type { Match, MatchStage, StandingRow, Team } from './types';

export type BracketCategory = 'U10' | 'U12';

/** Satu slot perempat final: juara grup `champ` melawan runner-up grup `runner`. */
interface QfDef {
  code: string;
  champ: string;
  runner: string;
  kickoff: string;
  field: string;
}

/** Satu slot semifinal: pemenang dua slot perempat final. */
interface SfDef {
  code: string;
  from: [string, string];
  kickoff: string;
  field: string;
}

interface BracketDef {
  date: string;
  groups: string[];
  qf: QfDef[];
  sf: SfDef[];
  finalDate: string;
  finalKickoff: string;
}

const U10_DEF: BracketDef = {
  date: '2026-10-09',
  groups: ['A', 'B', 'C', 'D'],
  qf: [
    { code: 'AA', champ: 'A', runner: 'B', kickoff: '14:00', field: '1' },
    { code: 'BB', champ: 'B', runner: 'C', kickoff: '14:00', field: '2' },
    { code: 'CC', champ: 'C', runner: 'D', kickoff: '14:30', field: '1' },
    { code: 'DD', champ: 'D', runner: 'A', kickoff: '14:30', field: '2' },
  ],
  sf: [
    { code: 'EE', from: ['AA', 'BB'], kickoff: '15:00', field: '1' },
    { code: 'FF', from: ['CC', 'DD'], kickoff: '15:00', field: '2' },
  ],
  finalDate: '2026-10-09',
  finalKickoff: '15:30',
};

const U12_DEF: BracketDef = {
  date: '2026-10-10',
  groups: ['W', 'X', 'Y', 'Z'],
  qf: [
    { code: 'WW', champ: 'W', runner: 'X', kickoff: '13:00', field: '1' },
    { code: 'XX', champ: 'X', runner: 'Y', kickoff: '13:00', field: '2' },
    { code: 'YY', champ: 'Y', runner: 'Z', kickoff: '13:30', field: '1' },
    { code: 'ZZ', champ: 'Z', runner: 'W', kickoff: '13:30', field: '2' },
  ],
  sf: [
    { code: 'EE', from: ['WW', 'XX'], kickoff: '14:00', field: '1' },
    { code: 'FF', from: ['YY', 'ZZ'], kickoff: '14:00', field: '2' },
  ],
  finalDate: '2026-10-10',
  finalKickoff: '14:30',
};

export const BRACKET_DEFS: Record<BracketCategory, BracketDef> = {
  U10: U10_DEF,
  U12: U12_DEF,
};

export interface Qualifiers {
  winnerId: string;
  runnerId: string;
}

export interface GroupState {
  group: string;
  complete: boolean;
  played: number;
  total: number;
  qualifiers: Qualifiers | null;
  blocked: string | null;
}

/** Jumlah laga penyisihan per grup pada format 4 tim setengah kompetisi.
 *  Syarat tuntas: minimal sebanyak ini laga grup sudah ada DAN semuanya
 *  finished. Angka ini mencegah mesin jalan saat jadwal grup belum lengkap
 *  (mis. baru sebagian laga yang dibuat panitia). */
const MIN_GRUP_MATCHES = 6;

function sameStats(a: StandingRow, b: StandingRow): boolean {
  return a.points === b.points && a.goal_difference === b.goal_difference && a.goals_for === b.goals_for;
}

/** Juara + runner-up grup. Imbang persis di batas lolos/seeding tidak ditebak — dikembalikan sebagai `blocked`. */
export function groupState(
  teams: Team[],
  matches: Match[],
  category: BracketCategory,
  group: string
): GroupState {
  const scoped = teams.filter((t) => (t.category ?? 'U10') === category);
  const grup = matches.filter(
    (m) => (m.category ?? 'U10') === category && m.stage === 'grup' && m.group_name === group
  );
  const played = grup.filter((m) => m.status === 'finished').length;
  if (grup.length < MIN_GRUP_MATCHES || played < grup.length) {
    return { group, complete: false, played, total: grup.length, qualifiers: null, blocked: null };
  }
  const rows = calculateStandings(scoped, matches, group);
  const [first, second, third] = rows;
  if (!first || !second) {
    return { group, complete: true, played, total: grup.length, qualifiers: null, blocked: 'Peserta grup kurang dari dua tim.' };
  }
  if (sameStats(first, second)) {
    return { group, complete: true, played, total: grup.length, qualifiers: null, blocked: 'Juara dan runner-up imbang di semua kriteria — tentukan manual.' };
  }
  if (third && sameStats(second, third)) {
    return { group, complete: true, played, total: grup.length, qualifiers: null, blocked: 'Peringkat 2 dan 3 imbang di semua kriteria — tentukan manual.' };
  }
  return {
    group,
    complete: true,
    played,
    total: grup.length,
    qualifiers: { winnerId: first.team.id, runnerId: second.team.id },
    blocked: null,
  };
}

/** Pemenang laga gugur yang sudah selesai. Seri dikembalikan null — skor imbang tidak menunjuk pemenang. */
export function knockoutResult(m: Match): { winnerId: string; loserId: string } | null {
  if (m.status !== 'finished' || m.score_a === m.score_b) return null;
  return m.score_a > m.score_b
    ? { winnerId: m.team_a_id, loserId: m.team_b_id }
    : { winnerId: m.team_b_id, loserId: m.team_a_id };
}

export interface PlannedMatch {
  team_a_id: string;
  team_b_id: string;
  match_date: string;
  kickoff_time: string;
  field: string;
  stage: MatchStage;
  group_name: string;
  category: BracketCategory;
  /** Keterangan asal slot, mis. "J:A vs R:B". */
  label: string;
}

export type SlotState = 'created' | 'ready' | 'waiting' | 'blocked';

export interface SlotInfo {
  code: string;
  stage: MatchStage;
  label: string;
  state: SlotState;
  detail: string;
}

export interface CategoryPlan {
  category: BracketCategory;
  groups: GroupState[];
  slots: SlotInfo[];
  creations: PlannedMatch[];
}

function findKnockout(matches: Match[], category: BracketCategory, stage: MatchStage, code: string): Match | undefined {
  return matches.find(
    (m) => (m.category ?? 'U10') === category && m.stage === stage && m.group_name === code
  );
}

/** Ada laga setara yang dibuat manual (tim sama, fase sama) — jangan menduplikasi. */
function pairExists(matches: Match[], category: BracketCategory, stage: MatchStage, a: string, b: string): boolean {
  return matches.some(
    (m) =>
      (m.category ?? 'U10') === category &&
      m.stage === stage &&
      ((m.team_a_id === a && m.team_b_id === b) || (m.team_a_id === b && m.team_b_id === a))
  );
}

/** Rencana braket satu kategori: murni fungsi, tanpa efek samping. */
export function planCategory(teams: Team[], matches: Match[], category: BracketCategory): CategoryPlan {
  const def = BRACKET_DEFS[category];
  const groups = def.groups.map((g) => groupState(teams, matches, category, g));
  const byGroup = new Map(groups.map((g) => [g.group, g]));
  const slots: SlotInfo[] = [];
  const creations: PlannedMatch[] = [];

  const pushSlot = (info: SlotInfo) => slots.push(info);
  const propose = (p: PlannedMatch) => {
    if (findKnockout(matches, p.category, p.stage, p.group_name)) return;
    if (pairExists(matches, p.category, p.stage, p.team_a_id, p.team_b_id)) return;
    creations.push(p);
  };

  for (const q of def.qf) {
    const champ = byGroup.get(q.champ)!;
    const runner = byGroup.get(q.runner)!;
    const label = `J:${q.champ} vs R:${q.runner}`;
    const existing = findKnockout(matches, category, 'perempat-final', q.code);
    if (existing) {
      pushSlot({ code: q.code, stage: 'perempat-final', label, state: 'created', detail: 'Sudah terjadwal.' });
      continue;
    }
    const block = champ.blocked ?? runner.blocked;
    if (block) {
      pushSlot({ code: q.code, stage: 'perempat-final', label, state: 'blocked', detail: block });
      continue;
    }
    if (!champ.qualifiers || !runner.qualifiers) {
      const pending = [champ, runner]
        .filter((g) => !g.qualifiers)
        .map((g) => `Grup ${g.group} (${g.played}/${g.total})`)
        .join(', ');
      pushSlot({ code: q.code, stage: 'perempat-final', label, state: 'waiting', detail: `Menunggu ${pending}.` });
      continue;
    }
    propose({
      team_a_id: champ.qualifiers.winnerId,
      team_b_id: runner.qualifiers.runnerId,
      match_date: def.date,
      kickoff_time: q.kickoff,
      field: q.field,
      stage: 'perempat-final',
      group_name: q.code,
      category,
      label,
    });
    pushSlot({ code: q.code, stage: 'perempat-final', label, state: 'ready', detail: 'Peserta lengkap — dibuat otomatis.' });
  }

  const qfResult = (code: string) => {
    const m = findKnockout(matches, category, 'perempat-final', code);
    if (!m) return { status: 'waiting' as const, detail: `Menunggu laga ${code}.` };
    if (m.status !== 'finished') return { status: 'waiting' as const, detail: `Laga ${code} belum selesai.` };
    const r = knockoutResult(m);
    if (!r) return { status: 'blocked' as const, detail: `Laga ${code} seri — tentukan pemenang manual.`, result: null };
    return { status: 'ready' as const, detail: '', result: r };
  };

  for (const s of def.sf) {
    const [ra, rb] = [qfResult(s.from[0]), qfResult(s.from[1])];
    const label = `W:${s.from[0]} vs W:${s.from[1]}`;
    const existing = findKnockout(matches, category, 'semifinal', s.code);
    if (existing) {
      pushSlot({ code: s.code, stage: 'semifinal', label, state: 'created', detail: 'Sudah terjadwal.' });
      continue;
    }
    if (ra.status !== 'ready' || rb.status !== 'ready') {
      const first = ra.status !== 'ready' ? ra : rb;
      pushSlot({ code: s.code, stage: 'semifinal', label, state: first.status, detail: first.detail });
      continue;
    }
    propose({
      team_a_id: ra.result!.winnerId,
      team_b_id: rb.result!.winnerId,
      match_date: def.date,
      kickoff_time: s.kickoff,
      field: s.field,
      stage: 'semifinal',
      group_name: s.code,
      category,
      label,
    });
    pushSlot({ code: s.code, stage: 'semifinal', label, state: 'ready', detail: 'Peserta lengkap — dibuat otomatis.' });
  }

  const sfResult = (code: string) => {
    const m = findKnockout(matches, category, 'semifinal', code);
    if (!m) return { status: 'waiting' as const, detail: `Menunggu laga ${code}.` };
    if (m.status !== 'finished') return { status: 'waiting' as const, detail: `Laga ${code} belum selesai.` };
    const r = knockoutResult(m);
    if (!r) return { status: 'blocked' as const, detail: `Laga ${code} seri — tentukan pemenang manual.` };
    return { status: 'ready' as const, detail: '', result: r };
  };

  const [ee, ff] = [sfResult('EE'), sfResult('FF')];
  for (const fin of [
    { code: 'F', losers: false, label: 'Final' },
    { code: 'P3', losers: true, label: 'Perebutan juara 3' },
  ]) {
    const existing = findKnockout(matches, category, 'final', fin.code);
    if (existing) {
      pushSlot({ code: fin.code, stage: 'final', label: fin.label, state: 'created', detail: 'Sudah terjadwal.' });
      continue;
    }
    if (ee.status !== 'ready' || ff.status !== 'ready') {
      const first = ee.status !== 'ready' ? ee : ff;
      pushSlot({ code: fin.code, stage: 'final', label: fin.label, state: first.status, detail: first.detail });
      continue;
    }
    propose({
      team_a_id: fin.losers ? ee.result!.loserId : ee.result!.winnerId,
      team_b_id: fin.losers ? ff.result!.loserId : ff.result!.winnerId,
      match_date: def.finalDate,
      kickoff_time: def.finalKickoff,
      field: fin.losers ? '2' : '1',
      stage: 'final',
      group_name: fin.code,
      category,
      label: fin.label,
    });
    pushSlot({ code: fin.code, stage: 'final', label: fin.label, state: 'ready', detail: 'Peserta lengkap — dibuat otomatis.' });
  }

  return { category, groups, slots, creations };
}

/** Rencana braket kedua kategori sekaligus. */
export function planBracket(teams: Team[], matches: Match[]): CategoryPlan[] {
  return (Object.keys(BRACKET_DEFS) as BracketCategory[]).map((c) => planCategory(teams, matches, c));
}
