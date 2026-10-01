// =============================================
// Seed data — render instan tanpa menunggu jaringan
// =============================================
// DIJEMPUT OTOMATIS oleh `npm run seed:refresh`. Jangan disunting manual
// tanpa sengaja: file ini menentukan apa yang tampil sebelum API menjawab.
//
// Kalau data resmi berubah, jalankan skrip itu — jangan menebak angka.
//
// Terakhir disegarkan: 2026-10-01
// =============================================

import { EventSettings, MatchWithTeams, Team } from './types';

const CREATED_AT = "2026-09-30T14:48:51.262284+00:00";
const UPDATED_AT = "2026-09-30T14:48:51.262284+00:00";

export const SEED_TEAMS: Team[] = [
  { id: "a2222222-2222-2222-2222-222222222222", name: "Bintang Timur FC", short_name: "BTM", logo_url: null, group_name: "A", color: "#1E63D6", created_at: CREATED_AT },
  { id: "a3333333-3333-3333-3333-333333333333", name: "Elang Perkasa", short_name: "ELG", logo_url: null, group_name: "A", color: "#2563EB", created_at: CREATED_AT },
  { id: "a1111111-1111-1111-1111-111111111111", name: "Garuda Muda FC", short_name: "GAR", logo_url: null, group_name: "A", color: "#0B3D91", created_at: CREATED_AT },
  { id: "a4444444-4444-4444-4444-444444444444", name: "Rajawali Sakti", short_name: "RJW", logo_url: null, group_name: "A", color: "#0284C7", created_at: CREATED_AT },
  { id: "b4444444-4444-4444-4444-444444444444", name: "An-Nur All Star", short_name: "ANN", logo_url: null, group_name: "B", color: "#7C3AED", created_at: CREATED_AT },
  { id: "b3333333-3333-3333-3333-333333333333", name: "Badak Mandiri", short_name: "BDK", logo_url: null, group_name: "B", color: "#DC2626", created_at: CREATED_AT },
  { id: "b1111111-1111-1111-1111-111111111111", name: "Harimau Putih", short_name: "HMP", logo_url: null, group_name: "B", color: "#059669", created_at: CREATED_AT },
  { id: "b2222222-2222-2222-2222-222222222222", name: "Singa Muda", short_name: "SGM", logo_url: null, group_name: "B", color: "#D97706", created_at: CREATED_AT },
];

const RAW_MATCHES = [
  { id: "c2222222-2222-2222-2222-222222222222", team_a_id: "a3333333-3333-3333-3333-333333333333", team_b_id: "a4444444-4444-4444-4444-444444444444", score_a: 1, score_b: 0, status: "finished", match_date: "2026-10-09", kickoff_time: "09:00:00", field: "A", stage: "grup", group_name: "A" },
  { id: "c3333333-3333-3333-3333-333333333333", team_a_id: "b1111111-1111-1111-1111-111111111111", team_b_id: "b2222222-2222-2222-2222-222222222222", score_a: 8, score_b: 1, status: "finished", match_date: "2026-10-09", kickoff_time: "10:00:00", field: "B", stage: "grup", group_name: "B" },
  { id: "c4444444-4444-4444-4444-444444444444", team_a_id: "b3333333-3333-3333-3333-333333333333", team_b_id: "b4444444-4444-4444-4444-444444444444", score_a: 0, score_b: 17, status: "finished", match_date: "2026-10-09", kickoff_time: "11:00:00", field: "B", stage: "grup", group_name: "B" },
] as const;

/** Pertandingan yang sudah dilektor tim A dan B, sama seperti output API. */
export const SEED_MATCHES: MatchWithTeams[] = RAW_MATCHES.flatMap((m) => {
  const team_a = SEED_TEAMS.find((t) => t.id === m.team_a_id);
  const team_b = SEED_TEAMS.find((t) => t.id === m.team_b_id);
  if (!team_a || !team_b) return [];
  return [{ ...m, team_a, team_b, updated_at: UPDATED_AT }];
});

/** Urutan nama A–Z untuk halaman daftar tim (API mengembalikan group_name, name; halaman mengurutkan ulang by name). */
export const SEED_TEAMS_SORTED: Team[] = [...SEED_TEAMS].sort(
  (a, b) => a.name.localeCompare(b.name)
);

/** Pertandingan seorang tim, terbaru lebih dulu — sama seperti halaman detail. */
export function seedTeamMatches(teamId: string): MatchWithTeams[] {
  return SEED_MATCHES.filter((m) => m.team_a_id === teamId || m.team_b_id === teamId).sort((a, b) =>
    `${b.match_date}${b.kickoff_time}`.localeCompare(`${a.match_date}${a.kickoff_time}`)
  );
}

export const SEED_SETTINGS: EventSettings = {
  id: "8f32c29f-934b-4387-9fc4-8784359235d6",
  event_name: "An-Nur Mini Soccer",
  start_date: "2026-10-09",
  end_date: "2026-10-10",
  location: "Lapangan An-Nur",
  map_url: null,
  rules_text: null,
  tiebreak_rules: "poin → selisih gol → gol masuk",
  contact_info: null,
};
