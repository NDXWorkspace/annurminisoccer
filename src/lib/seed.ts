// =============================================
// Seed data — render instan tanpa menunggu jaringan
// =============================================
// DIJEMPUT OTOMATIS oleh `npm run seed:refresh`. Jangan disunting manual
// tanpa sengaja: file ini menentukan apa yang tampil sebelum API menjawab.
//
// Kalau data resmi berubah, jalankan skrip itu — jangan menebak angka.
//
// Terakhir disegarkan: 2026-10-07
// =============================================

import { EventSettings, MatchWithTeams, Player, Team } from './types';

const CREATED_AT = "2026-10-06T08:25:16.419942+00:00";
const UPDATED_AT = "2026-10-06T08:26:10.844248+00:00";

export const SEED_TEAMS: Team[] = [
  { id: "a6e96822-f831-4f9a-a0a3-ef38a76156bc", name: "Dakota", short_name: "DKT", logo_url: "/teams/dakota-fc-kedensari.jpg", group_name: "A", color: null, category: "U10", created_at: CREATED_AT },
  { id: "3a3825b8-e665-4851-9020-e7e9df275e50", name: "New Star Salam", short_name: "NSS", logo_url: "/teams/new-star-salam.jpg", group_name: "A", color: null, category: "U10", created_at: CREATED_AT },
  { id: "91087982-6024-44c7-92cf-b9f7ea22dd3a", name: "Sekolah Sepak Bola Bligo Putra", short_name: "BLI", logo_url: "/teams/ssb-bligo-putra.jpg", group_name: "A", color: null, category: "U10", created_at: CREATED_AT },
  { id: "6bd29faf-bb34-4c01-b0fc-07bc98a5a044", name: "Singoloyo", short_name: "SGO", logo_url: "/teams/putra-singoloyo-fc.jpg", group_name: "A", color: null, category: "U10", created_at: CREATED_AT },
  { id: "a6cb2826-5c22-4fbc-aaa4-2ee92969e377", name: "SSB Arebo Muda", short_name: "ARE", logo_url: "/teams/ssb-arebo-muda.jpg", group_name: "A", color: null, category: "U10", created_at: CREATED_AT },
  { id: "5498d61b-5309-44ac-869c-16e3207b3444", name: "Tiga Putra Agung FC", short_name: "TPA", logo_url: "/teams/tiga-putra-agung-fc.jpg", group_name: "A", color: null, category: "U10", created_at: CREATED_AT },
  { id: "bbdcda96-9b69-41f7-b28f-7913ca456f11", name: "Bola FC", short_name: "BFC", logo_url: "/teams/bola-football-akademi.jpg", group_name: "B", color: null, category: "U10", created_at: CREATED_AT },
  { id: "28dcd130-1b5b-44d4-b9f1-7f9599594d0e", name: "Gelora Putra Delta Sidoarjo", short_name: "GPD", logo_url: "/teams/gelora-putra-delta-sidoarjo.jpg", group_name: "B", color: null, category: "U10", created_at: CREATED_AT },
  { id: "0577085d-2f0d-4c94-aa6f-e3d57d9ca308", name: "Pendowo Candi", short_name: "PDC", logo_url: null, group_name: "B", color: null, category: "U10", created_at: CREATED_AT },
  { id: "f04bf325-c8bf-4d05-8c94-9473d77aeda6", name: "Porsid FC", short_name: "POR", logo_url: "/teams/porsid-fc.jpg", group_name: "B", color: null, category: "U10", created_at: CREATED_AT },
  { id: "93138b00-cf3c-4a9f-9782-deddebad8c94", name: "Forsgi", short_name: "FRS", logo_url: "/teams/forsgi-football-academy.jpg", group_name: "C", color: null, category: "U10", created_at: CREATED_AT },
  { id: "9068fbef-c3be-4246-9cfb-1f13e96c7b89", name: "PS Pemuda", short_name: "PPM", logo_url: "/teams/ps-pemuda-surabaya.jpg", group_name: "C", color: null, category: "U10", created_at: CREATED_AT },
  { id: "25ab9066-901b-4c3b-bc20-1b161d1a20cc", name: "PSAD Sidoarjo", short_name: "PSD", logo_url: "/teams/psad-sidoarjo.jpg", group_name: "C", color: null, category: "U10", created_at: CREATED_AT },
  { id: "43927958-0c3f-401d-8f3b-b6aa99c7008e", name: "Sekolah Sepak Bola Putra Kasap", short_name: "KAS", logo_url: "/teams/sekolah-sepak-bola-putra-kasap.jpg", group_name: "C", color: null, category: "U10", created_at: CREATED_AT },
  { id: "8ef0363f-419b-4601-9d9b-a9a980114f50", name: "Baja Putra", short_name: "BJP", logo_url: "/teams/baja-putra-fc.jpg", group_name: "D", color: null, category: "U10", created_at: CREATED_AT },
  { id: "ae0a907b-4857-4967-b6a4-44ffd1fefc7d", name: "PS Bintang Timur", short_name: "BTM", logo_url: "/teams/ps-bintang-timur.jpg", group_name: "D", color: null, category: "U10", created_at: CREATED_AT },
  { id: "9ce6af20-8851-455e-aba5-7b6fd7a6c93c", name: "Sigres", short_name: "SGR", logo_url: "/teams/sigres-fc.jpg", group_name: "D", color: null, category: "U10", created_at: CREATED_AT },
  { id: "ee299fc0-78c2-478a-b8cf-e51b304dcd42", name: "Sikatan Muda", short_name: "SKT", logo_url: "/teams/sikatan-muda-cemandi-sidoarjo.jpg", group_name: "D", color: null, category: "U10", created_at: CREATED_AT },
  { id: "1d6447fb-66c5-4097-b9b9-1b51cb50de02", name: "An-Nur", short_name: "ANR", logo_url: null, group_name: "W", color: null, category: "U12", created_at: CREATED_AT },
  { id: "56e1811f-fd0a-40fe-9efb-8a1889bcbb18", name: "Dporta", short_name: "DPR", logo_url: "/teams/dborta-sidoarjo.jpg", group_name: "W", color: null, category: "U12", created_at: CREATED_AT },
  { id: "edbb20eb-c023-4499-ac40-b4c28d6c2f08", name: "Gelora Putra Delta Sidoarjo", short_name: "GPD", logo_url: "/teams/gelora-putra-delta-sidoarjo.jpg", group_name: "W", color: null, category: "U12", created_at: CREATED_AT },
  { id: "3b6b8390-bd9a-4137-b15a-11a106c5dfd5", name: "Putra Tunas Jaya", short_name: "PTJ", logo_url: "/teams/putra-tunas-jaya.jpg", group_name: "W", color: null, category: "U12", created_at: CREATED_AT },
  { id: "ca5083d8-4094-498c-bad5-df8b7b638d20", name: "Forsgi", short_name: "FRS", logo_url: "/teams/forsgi-football-academy.jpg", group_name: "X", color: null, category: "U12", created_at: CREATED_AT },
  { id: "9e564a65-460b-4494-89a3-63e544ddcb09", name: "Porsid FC", short_name: "POR", logo_url: "/teams/porsid-fc.jpg", group_name: "X", color: null, category: "U12", created_at: CREATED_AT },
  { id: "eb5cb306-81f6-4575-9eb4-4a20ba8b3d7a", name: "PS Pemuda", short_name: "PPM", logo_url: "/teams/ps-pemuda-surabaya.jpg", group_name: "X", color: null, category: "U12", created_at: CREATED_AT },
  { id: "f086e33a-8b75-496c-9ef6-daae2dc8a4ec", name: "Watesnegoro Soccer School", short_name: "WSS", logo_url: "/teams/watesnegoro-soccer-school.jpg", group_name: "X", color: null, category: "U12", created_at: CREATED_AT },
  { id: "5388187f-2344-4868-a17e-9e8f4665dad4", name: "Bridora", short_name: "BRD", logo_url: "/teams/bridora.jpg", group_name: "Y", color: null, category: "U12", created_at: CREATED_AT },
  { id: "b34b9563-5163-4735-af0b-026f30e64b77", name: "New Star Salam", short_name: "NSS", logo_url: "/teams/new-star-salam.jpg", group_name: "Y", color: null, category: "U12", created_at: CREATED_AT },
  { id: "0bf506f3-0b9d-4f32-b1ee-6d19d4661bb4", name: "Pendowo", short_name: "PND", logo_url: "/teams/pendowo-fc-sukodono.jpg", group_name: "Y", color: null, category: "U12", created_at: CREATED_AT },
  { id: "8d4cb741-dd7d-41a8-acbd-63d9fb8d50bc", name: "PS Bintang Timur", short_name: "BTM", logo_url: "/teams/ps-bintang-timur.jpg", group_name: "Y", color: null, category: "U12", created_at: CREATED_AT },
  { id: "c5738d7a-96be-4e3c-bc2f-ff7ca1066695", name: "Baja Putra", short_name: "BJP", logo_url: "/teams/baja-putra-fc.jpg", group_name: "Z", color: null, category: "U12", created_at: CREATED_AT },
  { id: "627392e1-4344-47ab-b556-3d287ed6ae89", name: "Bajol Nusantara FC", short_name: "BJL", logo_url: "/teams/bajol-nusantara-fc.jpg", group_name: "Z", color: null, category: "U12", created_at: CREATED_AT },
  { id: "a7fcfa4a-42a5-49e9-b806-041115daa6d5", name: "Persatuan Sepak Bola Tropis", short_name: "TRP", logo_url: "/teams/psb-tropis-sudimoro-tulangan.jpg", group_name: "Z", color: null, category: "U12", created_at: CREATED_AT },
  { id: "a48f6b14-fbee-4bfb-aa8e-26583670d86e", name: "Sekolah Sepak Bola Putra Kasap", short_name: "KAS", logo_url: "/teams/sekolah-sepak-bola-putra-kasap.jpg", group_name: "Z", color: null, category: "U12", created_at: CREATED_AT },
];

const RAW_MATCHES = [
  { id: "5c3238df-8616-4e51-9634-e9951b36f212", team_a_id: "5498d61b-5309-44ac-869c-16e3207b3444", team_b_id: "6bd29faf-bb34-4c01-b0fc-07bc98a5a044", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "07:00:00", field: "1", stage: "grup", group_name: "A", category: "U10" },
  { id: "2584e3fc-8910-4f8e-9231-e19cad8868e7", team_a_id: "3a3825b8-e665-4851-9020-e7e9df275e50", team_b_id: "a6e96822-f831-4f9a-a0a3-ef38a76156bc", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "07:00:00", field: "2", stage: "grup", group_name: "A", category: "U10" },
  { id: "22ab6a78-3144-411c-bfac-b3a8f9a4d4ff", team_a_id: "28dcd130-1b5b-44d4-b9f1-7f9599594d0e", team_b_id: "bbdcda96-9b69-41f7-b28f-7913ca456f11", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "07:30:00", field: "1", stage: "grup", group_name: "B", category: "U10" },
  { id: "76c6d487-ba4e-4b90-b564-62a5fee355b3", team_a_id: "0577085d-2f0d-4c94-aa6f-e3d57d9ca308", team_b_id: "f04bf325-c8bf-4d05-8c94-9473d77aeda6", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "07:30:00", field: "2", stage: "grup", group_name: "B", category: "U10" },
  { id: "e93fdae4-8559-47e9-a3e7-3b060d2eb4f5", team_a_id: "25ab9066-901b-4c3b-bc20-1b161d1a20cc", team_b_id: "43927958-0c3f-401d-8f3b-b6aa99c7008e", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "08:00:00", field: "2", stage: "grup", group_name: "C", category: "U10" },
  { id: "38884abb-6554-473c-aec9-0bfbddb0429e", team_a_id: "93138b00-cf3c-4a9f-9782-deddebad8c94", team_b_id: "9068fbef-c3be-4246-9cfb-1f13e96c7b89", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "08:00:00", field: "1", stage: "grup", group_name: "C", category: "U10" },
  { id: "3dcf29bc-fd17-4e6f-9556-a7c19a11f61d", team_a_id: "ae0a907b-4857-4967-b6a4-44ffd1fefc7d", team_b_id: "ee299fc0-78c2-478a-b8cf-e51b304dcd42", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "08:30:00", field: "2", stage: "grup", group_name: "D", category: "U10" },
  { id: "a4bc5346-307f-48f4-a5e6-eb5bc2148b8d", team_a_id: "9ce6af20-8851-455e-aba5-7b6fd7a6c93c", team_b_id: "8ef0363f-419b-4601-9d9b-a9a980114f50", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "08:30:00", field: "1", stage: "grup", group_name: "D", category: "U10" },
  { id: "88cb9ea5-966a-4582-8832-f69b5efd9661", team_a_id: "6bd29faf-bb34-4c01-b0fc-07bc98a5a044", team_b_id: "a6e96822-f831-4f9a-a0a3-ef38a76156bc", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "09:00:00", field: "2", stage: "grup", group_name: "A", category: "U10" },
  { id: "81b31f4a-545d-4975-a938-8e4fabbb5572", team_a_id: "5498d61b-5309-44ac-869c-16e3207b3444", team_b_id: "3a3825b8-e665-4851-9020-e7e9df275e50", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "09:00:00", field: "1", stage: "grup", group_name: "A", category: "U10" },
  { id: "876c8624-6468-41fe-9cd3-91ba964ec536", team_a_id: "bbdcda96-9b69-41f7-b28f-7913ca456f11", team_b_id: "f04bf325-c8bf-4d05-8c94-9473d77aeda6", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "09:30:00", field: "2", stage: "grup", group_name: "B", category: "U10" },
  { id: "f0141717-e49a-49ad-8ae3-1deb04120ee4", team_a_id: "28dcd130-1b5b-44d4-b9f1-7f9599594d0e", team_b_id: "0577085d-2f0d-4c94-aa6f-e3d57d9ca308", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "09:30:00", field: "1", stage: "grup", group_name: "B", category: "U10" },
  { id: "3a4fb29a-968e-4a51-a2bd-e1833ed6dd92", team_a_id: "9068fbef-c3be-4246-9cfb-1f13e96c7b89", team_b_id: "43927958-0c3f-401d-8f3b-b6aa99c7008e", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "10:00:00", field: "2", stage: "grup", group_name: "C", category: "U10" },
  { id: "2c68a0c2-73f9-4b5d-ad07-b28627f10cbc", team_a_id: "93138b00-cf3c-4a9f-9782-deddebad8c94", team_b_id: "25ab9066-901b-4c3b-bc20-1b161d1a20cc", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "10:00:00", field: "1", stage: "grup", group_name: "C", category: "U10" },
  { id: "af0da335-83d2-4a5f-adb8-03cd627d0dd5", team_a_id: "8ef0363f-419b-4601-9d9b-a9a980114f50", team_b_id: "ee299fc0-78c2-478a-b8cf-e51b304dcd42", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "10:30:00", field: "2", stage: "grup", group_name: "D", category: "U10" },
  { id: "14e94bf3-b0da-45bc-b1f8-34a4890f6910", team_a_id: "9ce6af20-8851-455e-aba5-7b6fd7a6c93c", team_b_id: "ae0a907b-4857-4967-b6a4-44ffd1fefc7d", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "10:30:00", field: "1", stage: "grup", group_name: "D", category: "U10" },
  { id: "34023816-1f77-4bd0-816e-cee46fbe8cc6", team_a_id: "a6e96822-f831-4f9a-a0a3-ef38a76156bc", team_b_id: "5498d61b-5309-44ac-869c-16e3207b3444", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "11:00:00", field: "2", stage: "grup", group_name: "A", category: "U10" },
  { id: "b95feb65-c0fc-4273-a57e-a3f7b0f373e6", team_a_id: "3a3825b8-e665-4851-9020-e7e9df275e50", team_b_id: "6bd29faf-bb34-4c01-b0fc-07bc98a5a044", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "11:00:00", field: "1", stage: "grup", group_name: "A", category: "U10" },
  { id: "0eae0c35-9c64-4434-92eb-a5f5b5c25175", team_a_id: "f04bf325-c8bf-4d05-8c94-9473d77aeda6", team_b_id: "28dcd130-1b5b-44d4-b9f1-7f9599594d0e", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "12:30:00", field: "2", stage: "grup", group_name: "B", category: "U10" },
  { id: "73443c9e-f911-4ed8-ab86-8365f98aa4a1", team_a_id: "0577085d-2f0d-4c94-aa6f-e3d57d9ca308", team_b_id: "bbdcda96-9b69-41f7-b28f-7913ca456f11", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "12:30:00", field: "1", stage: "grup", group_name: "B", category: "U10" },
  { id: "e77aa38b-f136-4041-b60b-f261c6f540c9", team_a_id: "25ab9066-901b-4c3b-bc20-1b161d1a20cc", team_b_id: "9068fbef-c3be-4246-9cfb-1f13e96c7b89", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "13:00:00", field: "1", stage: "grup", group_name: "C", category: "U10" },
  { id: "6d595546-30a6-4a56-b4c5-1d068f8a2960", team_a_id: "43927958-0c3f-401d-8f3b-b6aa99c7008e", team_b_id: "93138b00-cf3c-4a9f-9782-deddebad8c94", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "13:00:00", field: "2", stage: "grup", group_name: "C", category: "U10" },
  { id: "70f370b0-138c-4f56-a22d-e0fb235c4cee", team_a_id: "ae0a907b-4857-4967-b6a4-44ffd1fefc7d", team_b_id: "8ef0363f-419b-4601-9d9b-a9a980114f50", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "13:30:00", field: "1", stage: "grup", group_name: "D", category: "U10" },
  { id: "87ea5e31-56a8-481d-ad9c-e8f32e7a511c", team_a_id: "ee299fc0-78c2-478a-b8cf-e51b304dcd42", team_b_id: "9ce6af20-8851-455e-aba5-7b6fd7a6c93c", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-09", kickoff_time: "13:30:00", field: "2", stage: "grup", group_name: "D", category: "U10" },
  { id: "0dff597b-12f8-42db-b7d3-b49eb1523c63", team_a_id: "edbb20eb-c023-4499-ac40-b4c28d6c2f08", team_b_id: "56e1811f-fd0a-40fe-9efb-8a1889bcbb18", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "07:00:00", field: "2", stage: "grup", group_name: "W", category: "U12" },
  { id: "7f381163-ed0b-487d-acaa-359cbab106db", team_a_id: "1d6447fb-66c5-4097-b9b9-1b51cb50de02", team_b_id: "3b6b8390-bd9a-4137-b15a-11a106c5dfd5", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "07:00:00", field: "1", stage: "grup", group_name: "W", category: "U12" },
  { id: "6c7c82e8-62d8-4ee4-b165-d7664890af40", team_a_id: "f086e33a-8b75-496c-9ef6-daae2dc8a4ec", team_b_id: "eb5cb306-81f6-4575-9eb4-4a20ba8b3d7a", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "07:30:00", field: "2", stage: "grup", group_name: "X", category: "U12" },
  { id: "fa86f61f-a1c0-4ea9-a6da-fdabb47efb9d", team_a_id: "9e564a65-460b-4494-89a3-63e544ddcb09", team_b_id: "ca5083d8-4094-498c-bad5-df8b7b638d20", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "07:30:00", field: "1", stage: "grup", group_name: "X", category: "U12" },
  { id: "7614eb6c-567a-4759-b1f3-3f52b7b23f5d", team_a_id: "8d4cb741-dd7d-41a8-acbd-63d9fb8d50bc", team_b_id: "5388187f-2344-4868-a17e-9e8f4665dad4", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "08:00:00", field: "2", stage: "grup", group_name: "Y", category: "U12" },
  { id: "885f99ce-80c9-4128-8126-c56c69983e00", team_a_id: "0bf506f3-0b9d-4f32-b1ee-6d19d4661bb4", team_b_id: "b34b9563-5163-4735-af0b-026f30e64b77", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "08:00:00", field: "1", stage: "grup", group_name: "Y", category: "U12" },
  { id: "7dccf95d-c0c9-43ea-beea-13928cd29ab7", team_a_id: "a48f6b14-fbee-4bfb-aa8e-26583670d86e", team_b_id: "a7fcfa4a-42a5-49e9-b806-041115daa6d5", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "08:30:00", field: "2", stage: "grup", group_name: "Z", category: "U12" },
  { id: "68150502-a4f2-4049-810e-3aa8c7fc3394", team_a_id: "c5738d7a-96be-4e3c-bc2f-ff7ca1066695", team_b_id: "627392e1-4344-47ab-b556-3d287ed6ae89", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "08:30:00", field: "1", stage: "grup", group_name: "Z", category: "U12" },
  { id: "95dbae11-2e26-4938-8b41-46fb7a959385", team_a_id: "3b6b8390-bd9a-4137-b15a-11a106c5dfd5", team_b_id: "56e1811f-fd0a-40fe-9efb-8a1889bcbb18", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "09:00:00", field: "2", stage: "grup", group_name: "W", category: "U12" },
  { id: "87cc441d-4d21-484c-a225-a4207e9d3fa2", team_a_id: "1d6447fb-66c5-4097-b9b9-1b51cb50de02", team_b_id: "edbb20eb-c023-4499-ac40-b4c28d6c2f08", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "09:00:00", field: "1", stage: "grup", group_name: "W", category: "U12" },
  { id: "8a88be0f-f3e2-43b7-bdff-1461292b7c5a", team_a_id: "ca5083d8-4094-498c-bad5-df8b7b638d20", team_b_id: "eb5cb306-81f6-4575-9eb4-4a20ba8b3d7a", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "09:30:00", field: "2", stage: "grup", group_name: "X", category: "U12" },
  { id: "a124041e-6828-4ec9-9430-f000fcce64c0", team_a_id: "9e564a65-460b-4494-89a3-63e544ddcb09", team_b_id: "f086e33a-8b75-496c-9ef6-daae2dc8a4ec", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "09:30:00", field: "1", stage: "grup", group_name: "X", category: "U12" },
  { id: "03071e68-60b6-4817-a78a-e817b8d742da", team_a_id: "b34b9563-5163-4735-af0b-026f30e64b77", team_b_id: "5388187f-2344-4868-a17e-9e8f4665dad4", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "10:00:00", field: "2", stage: "grup", group_name: "Y", category: "U12" },
  { id: "e1524ac9-b72d-40ea-998b-fa383980d7b7", team_a_id: "0bf506f3-0b9d-4f32-b1ee-6d19d4661bb4", team_b_id: "8d4cb741-dd7d-41a8-acbd-63d9fb8d50bc", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "10:00:00", field: "1", stage: "grup", group_name: "Y", category: "U12" },
  { id: "513377f2-7967-4d08-8dd1-f4ef73b2ff36", team_a_id: "627392e1-4344-47ab-b556-3d287ed6ae89", team_b_id: "a7fcfa4a-42a5-49e9-b806-041115daa6d5", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "10:30:00", field: "2", stage: "grup", group_name: "Z", category: "U12" },
  { id: "64bcb0c2-e05a-4675-a492-545e29608721", team_a_id: "c5738d7a-96be-4e3c-bc2f-ff7ca1066695", team_b_id: "a48f6b14-fbee-4bfb-aa8e-26583670d86e", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "10:30:00", field: "1", stage: "grup", group_name: "Z", category: "U12" },
  { id: "9d53c094-a478-474f-8c89-d33d6ffa3d13", team_a_id: "56e1811f-fd0a-40fe-9efb-8a1889bcbb18", team_b_id: "1d6447fb-66c5-4097-b9b9-1b51cb50de02", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "11:00:00", field: "2", stage: "grup", group_name: "W", category: "U12" },
  { id: "03ba753c-48ea-4635-926b-725280ab0d42", team_a_id: "edbb20eb-c023-4499-ac40-b4c28d6c2f08", team_b_id: "3b6b8390-bd9a-4137-b15a-11a106c5dfd5", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "11:00:00", field: "1", stage: "grup", group_name: "W", category: "U12" },
  { id: "a2591c5f-4a7e-408c-b7d3-aec236c19dc6", team_a_id: "eb5cb306-81f6-4575-9eb4-4a20ba8b3d7a", team_b_id: "9e564a65-460b-4494-89a3-63e544ddcb09", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "11:30:00", field: "2", stage: "grup", group_name: "X", category: "U12" },
  { id: "4c9e14e4-7b73-4172-8866-c7feb6a127bd", team_a_id: "f086e33a-8b75-496c-9ef6-daae2dc8a4ec", team_b_id: "ca5083d8-4094-498c-bad5-df8b7b638d20", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "11:30:00", field: "1", stage: "grup", group_name: "X", category: "U12" },
  { id: "6ed80df0-caed-4b27-b9c2-a6818d84640b", team_a_id: "8d4cb741-dd7d-41a8-acbd-63d9fb8d50bc", team_b_id: "b34b9563-5163-4735-af0b-026f30e64b77", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "12:00:00", field: "1", stage: "grup", group_name: "Y", category: "U12" },
  { id: "ee0c1c75-c37c-4110-b496-08bdf960238e", team_a_id: "5388187f-2344-4868-a17e-9e8f4665dad4", team_b_id: "0bf506f3-0b9d-4f32-b1ee-6d19d4661bb4", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "12:00:00", field: "2", stage: "grup", group_name: "Y", category: "U12" },
  { id: "8851c8dd-6f77-46de-a83f-cc31cbef0f1e", team_a_id: "a48f6b14-fbee-4bfb-aa8e-26583670d86e", team_b_id: "627392e1-4344-47ab-b556-3d287ed6ae89", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "12:30:00", field: "1", stage: "grup", group_name: "Z", category: "U12" },
  { id: "61014145-b909-4fa5-8b8c-8ffde3fd15b5", team_a_id: "a7fcfa4a-42a5-49e9-b806-041115daa6d5", team_b_id: "c5738d7a-96be-4e3c-bc2f-ff7ca1066695", score_a: 0, score_b: 0, status: "scheduled", match_date: "2026-10-10", kickoff_time: "12:30:00", field: "2", stage: "grup", group_name: "Z", category: "U12" },
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

/** Seluruh pemain untuk render instan. */
export const SEED_PLAYERS: Player[] = [

];

/** Pemain seorang tim. */
export function seedTeamPlayers(teamId: string): Player[] {
  return SEED_PLAYERS.filter((p) => p.team_id === teamId);
}

export const SEED_SETTINGS: EventSettings = {
  id: "8f32c29f-934b-4387-9fc4-8784359235d6",
  event_name: "ANNUR MINI SOCCER 2026",
  start_date: "2026-10-09",
  end_date: "2026-10-10",
  location: "Lapangan Desa Penatarsewu, Sidoarjo",
  map_url: null,
  rules_text: "Turnamen ANNUR MINI SOCCER 2026 untuk kategori KU-10 dan KU-12, maksimal 16 tim per kategori.\nSetiap tim terdiri dari maksimal 14 pemain (7 inti + 7 cadangan).\nDurasi pertandingan 25 menit berjalan, memakai bola ukuran 4.\nSistem setengah kompetisi per grup; juara dan runner-up tiap grup lolos ke babak gugur (8 besar, semifinal, final, dan perebutan juara 3).\nPoin kemenangan: menang 3, seri 1, kalah 0.\nPertandingan babak gugur yang berakhir seri dilanjutkan adu penalti 5 penendang, lalu sudden death.\nPergantian pemain memakai sistem rolling — pemain yang diganti boleh masuk lagi.\nPemain kartu merah wajib keluar lapangan dan tidak bisa diganti; dua kartu kuning sama dengan kartu merah.\nSetiap pemain hanya boleh terdaftar di satu tim dalam satu kategori; panitia berhak screening dan mendiskualifikasi pemain yang tidak sesuai.\nProtes wajib disertai bukti pembanding dan uang jaminan Rp500.000, kalau tidak protes diabaikan.\nKeputusan wasit dan panitia bersifat mengikat.",
  tiebreak_rules: "Poin -> selisih gol -> gol memasukkan",
  contact_info: null,
};
