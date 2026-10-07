import type { EventSettings } from '@/lib/types';

/** Isi bawaan bila pengaturan panitia belum pernah diisi. */
export const DEFAULT_RULES = [
  'Sistem pertandingan menggunakan babak penyisihan grup dilanjutkan fase gugur (semifinal dan final).',
  'Waktu pertandingan adalah 2 x 15 menit kotor dengan jeda istirahat 5 menit.',
  'Jumlah pemain di lapangan 7 lawan 7 termasuk penjaga gawang.',
  'Pergantian pemain bebas tanpa batasan.',
  'Tim yang tidak hadir setelah pemanggilan 3 kali dengan jeda 5 menit dinyatakan kalah WO (3-0).',
];

/**
 * Daftar peraturan turnamen untuk tampilan: diambil dari pengaturan panitia
 * (`event_settings.rules_text`, satu baris satu aturan), atau DEFAULT_RULES.
 * Dipakai halaman Info dan popup beranda supaya isinya selalu identik.
 */
export function rulesOf(settings: EventSettings | null | undefined): string[] {
  if (settings?.rules_text) {
    return settings.rules_text.split('\n').filter((l) => l.trim().length > 0);
  }
  return DEFAULT_RULES;
}
