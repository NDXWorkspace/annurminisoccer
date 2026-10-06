/**
 * Uji vital: apakah perubahan di Postgres benar-benar sampai ke klien lewat
 * Supabase Realtime memakai anon key (persis seperti yang dilakukan browser).
 *
 * Skor yang disentuh dikembalikan lagi setelah event diterima, jadi skrip ini
 * tidak mengubah data apa pun.
 *
 * Jalankan: node scripts/test-realtime.mjs
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / ANON / SERVICE tidak lengkap di .env.local');
  process.exit(1);
}

const reader = createClient(url, anon);
const writer = createClient(url, service);

const received = [];
let settled = false;
let restore = null;

const done = async (code) => {
  if (settled) return;
  settled = true;
  if (restore) {
    await writer.from('matches').update({ score_a: restore }).eq('id', restoreId);
    console.log(`dikembalikan: score_a -> ${restore}`);
  }
  await chan.unsubscribe();
  console.log(code === 0 ? 'REALTIME OK' : 'REALTIME GAGAL');
  process.exit(code);
};

let restoreId = null;

const chan = reader.channel('uji-realtime');
for (const table of ['matches', 'teams', 'event_settings', 'players']) {
  chan.on('postgres_changes', { event: '*', schema: 'public', table }, (p) => {
    received.push({ table, event: p.eventType });
    console.log(`event: ${table} ${p.eventType}`);
    void done(0);
  });
}

chan.subscribe(async (status) => {
  console.log(`status: ${status}`);
  if (status !== 'SUBSCRIBED') return;

  // Beri waktu server Realtime menyiapkan langganan di sisi Postgres
  // sebelum menulis, supaya event tidak keluar sebelum siap.
  await new Promise((r) => setTimeout(r, 1500));

  // Ubah satu baris tanpa mengubah apa pun yang dilihat pengguna.
  const { data: rows, error } = await writer
    .from('matches')
    .select('id, score_a')
    .order('match_date')
    .limit(1);
  if (error || !rows?.length) {
    console.error('gagal membaca matches:', error?.message);
    return done(1);
  }

  const target = rows[0];
  restoreId = target.id;
  restore = target.score_a ?? 0;
  const next = restore + 1;
  const { error: writeError } = await writer
    .from('matches')
    .update({ score_a: next })
    .eq('id', target.id);
  if (writeError) {
    console.error('gagal menulis:', writeError.message);
    return done(1);
  }
  console.log(`menulis: matches ${target.id} score_a ${restore} -> ${next}`);
});

setTimeout(() => {
  if (received.length === 0) console.error('tidak ada event dalam 30 detik');
  void done(received.length > 0 ? 0 : 1);
}, 30_000);
