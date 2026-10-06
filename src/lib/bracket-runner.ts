import { planBracket } from './bracket';
import type { Match, Team } from './types';

type QueryResult = { data: unknown; error: unknown };

/** Bentuk minimal klien admin yang dipakai mesin braket (cukup untuk
 *  Supabase server maupun ganda uji). */
type AdminClient = {
  from: (table: string) => {
    select: (cols: string) => PromiseLike<QueryResult>;
    insert: (rows: Record<string, unknown>[]) => PromiseLike<QueryResult>;
  };
};

/**
 * Jalankan satu putaran pemajuan braket: hitung slot yang pesertanya sudah
 * lengkap lalu sisipkan ke `matches`. Idempoten — slot yang sudah ada
 * (atau pasangan tim yang sama di fase yang sama) dilewati.
 *
 * Mengembalikan jumlah laga yang dibuat, untuk log/telemetri.
 */
export async function advanceBracket(admin: AdminClient): Promise<number> {
  const [{ data: teams }, { data: matches }] = await Promise.all([
    admin.from('teams').select('*'),
    admin.from('matches').select('*'),
  ]);
  if (!teams || !matches) return 0;

  const plans = planBracket(teams as Team[], matches as Match[]);
  const creations = plans.flatMap((p) => p.creations);
  if (creations.length === 0) return 0;

  const rows = creations.map((c) => ({
    team_a_id: c.team_a_id,
    team_b_id: c.team_b_id,
    match_date: c.match_date,
    kickoff_time: c.kickoff_time,
    field: c.field,
    status: 'scheduled',
    score_a: 0,
    score_b: 0,
    stage: c.stage,
    group_name: c.group_name,
    category: c.category,
  }));
  const { error } = await admin.from('matches').insert(rows);
  if (error) throw error;
  return rows.length;
}
