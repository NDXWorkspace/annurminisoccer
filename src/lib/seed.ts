// =============================================
// Seed data — render instan tanpa menunggu jaringan
// =============================================
// DIJEMPUT OTOMATIS oleh `npm run seed:refresh`. Jangan disunting manual
// tanpa sengaja: file ini menentukan apa yang tampil sebelum API menjawab.
//
// Kalau data resmi berubah, jalankan skrip itu — jangan menebak angka.
//
// Terakhir disegarkan: 2026-10-02
// =============================================

import { EventSettings, MatchWithTeams, Team } from './types';

const CREATED_AT = "2026-10-01T10:20:19.117504+00:00";
const UPDATED_AT = "2026-10-01T10:21:11.011165+00:00";

export const SEED_TEAMS: Team[] = [
  { id: "9a69f05c-7507-485b-8051-b7b1f9a6fa69", name: "Annur All Star", short_name: "ALS", logo_url: null, group_name: "A", color: "#ec22e5", created_at: CREATED_AT },
  { id: "e3360791-ec71-454d-8304-cfb8cc53e2e3", name: "Argentina Football Club", short_name: "AFA", logo_url: null, group_name: "A", color: "#0561ff", created_at: CREATED_AT },
  { id: "9243cec0-de54-4aa2-a469-bda99b7f9cbc", name: "Dungong FC", short_name: "GFC", logo_url: null, group_name: "A", color: "#0B3D91", created_at: CREATED_AT },
  { id: "05545541-ba92-4ffa-bbad-fb302569e101", name: "Kasap FC", short_name: "KFC", logo_url: null, group_name: "A", color: "#e91616", created_at: CREATED_AT },
];

const RAW_MATCHES = [
  { id: "f30b8d86-eae7-4e8b-9074-492786e30e88", team_a_id: "9a69f05c-7507-485b-8051-b7b1f9a6fa69", team_b_id: "05545541-ba92-4ffa-bbad-fb302569e101", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-01", kickoff_time: "19:00:00", field: "1", stage: "grup", group_name: null },
  { id: "646f811a-cf89-4e38-a158-ddabcf67aa9c", team_a_id: "9a69f05c-7507-485b-8051-b7b1f9a6fa69", team_b_id: "e3360791-ec71-454d-8304-cfb8cc53e2e3", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-01", kickoff_time: "19:00:00", field: "1", stage: "grup", group_name: null },
  { id: "c8456dc5-457b-4ded-8eee-740f868788d1", team_a_id: "e3360791-ec71-454d-8304-cfb8cc53e2e3", team_b_id: "9a69f05c-7507-485b-8051-b7b1f9a6fa69", score_a: 0, score_b: 12, status: "finished", match_date: "2026-10-01", kickoff_time: "19:00:00", field: "1", stage: "grup", group_name: null },
  { id: "8a87ce14-d436-4fee-9699-3fbdc62e52e0", team_a_id: "e3360791-ec71-454d-8304-cfb8cc53e2e3", team_b_id: "9243cec0-de54-4aa2-a469-bda99b7f9cbc", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-01", kickoff_time: "19:00:00", field: "1", stage: "grup", group_name: null },
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
  tiebreak_rules: "poin ??? selisih gol ??? gol masuk",
  contact_info: null,
};
