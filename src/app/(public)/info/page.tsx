'use client';

import { useEffect, useState } from 'react';
import { EventSettings, ApiResponse } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { SEED_SETTINGS } from '@/lib/seed';

const DEFAULT_RULES = [
  'Sistem pertandingan menggunakan babak penyisihan grup dilanjutkan fase gugur (semifinal & final).',
  'Waktu pertandingan adalah 2 x 15 menit kotor dengan jeda istirahat 5 menit.',
  'Jumlah pemain di lapangan 7 vs 7 termasuk penjaga gawang.',
  'Pergantian pemain bebas tanpa batasan (rolling substitution).',
  'Tim yang tidak hadir setelah pemanggilan 3 kali dengan jeda 5 menit dinyatakan kalah WO (3-0).',
];

export default function InfoPage() {
  const [settings, setSettings] = useState<EventSettings | null>(SEED_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (initial = false) => {
      try {
        if (initial) setLoading(true);
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (!res.ok) throw new Error('Gagal memuat info');
        const data: ApiResponse<EventSettings> = await res.json();
        if (data.success && data.data) setSettings(data.data);
      } catch {
        // keep the previous snapshot
      } finally {
        if (initial) setLoading(false);
      }
    };

    load(true);
    const id = setInterval(() => load(false), 30_000);
    return () => clearInterval(id);
  }, []);

  // Seed sudah mengisi `settings`, jadi spinner hanya ditampilkan bila
  // kita benar-benar tidak punya apa pun untuk dirender.
  if (loading && !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-flood border-t-transparent" />
      </div>
    );
  }

  const facts = [
    {
      label: 'Tanggal',
      value:
        settings?.start_date && settings?.end_date
          ? `${formatDate(settings.start_date.split('T')[0])} s/d ${formatDate(settings.end_date.split('T')[0])}`
          : '9–10 Oktober 2026',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      label: 'Lokasi',
      value: settings?.location || 'Lapangan An-Nur',
      icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
    },
    {
      label: 'Kontak panitia',
      value: settings?.contact_info || 'Hubungi steward lapangan saat pertandingan berlangsung.',
      icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
    },
  ];

  const rules = settings?.rules_text
    ? settings.rules_text.split('\n').filter((l) => l.trim().length > 0)
    : DEFAULT_RULES;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="pitch-wash relative mb-8 overflow-hidden rounded-[14px] border border-line px-6 py-7">
        <span className="label-programme text-flood">Informasi acara</span>
        <h1 className="mt-2 font-display text-4xl font-extrabold uppercase leading-none tracking-[0.01em] text-chalk sm:text-5xl">
          {settings?.event_name || 'An-Nur Mini Soccer'}
        </h1>
      </header>

      {/* Fact list — hairline rules, not cards */}
      <dl className="mb-10 overflow-hidden rounded-[14px] border border-line bg-ink-raised">
        {facts.map((f) => (
          <div key={f.label} className="flex items-start gap-4 border-b border-line px-5 py-4 last:border-0">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-ink-sunken text-flood">
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={f.icon} />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <dt className="label-programme text-chalk-faint">{f.label}</dt>
              <dd className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-chalk">{f.value}</dd>
              {f.label === 'Lokasi' && settings?.map_url && (
                <a
                  href={settings.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-programme mt-2 inline-flex items-center gap-1.5 text-flood transition-opacity hover:opacity-75"
                >
                  Buka di Google Maps →
                </a>
              )}
            </div>
          </div>
        ))}
      </dl>

      {/* Rules */}
      <section className="mb-10">
        <div className="mb-4 border-b border-line pb-3">
          <span className="label-programme text-flood">Peraturan</span>
          <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-[0.04em] text-chalk">
            Peraturan turnamen
          </h2>
        </div>
        <ol className="space-y-3">
          {rules.map((r, i) => (
            <li key={i} className="flex gap-4 rounded-xl border border-line bg-ink-raised/50 px-4 py-3.5">
              <span className="score-plate shrink-0 text-lg text-flood">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[15px] leading-relaxed text-chalk-dim">{r}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Tiebreak */}
      <section>
        <div className="mb-4 border-b border-line pb-3">
          <span className="label-programme text-flood">Klasemen</span>
          <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-[0.04em] text-chalk">
            Urutan tie-break
          </h2>
        </div>

        <div className="rounded-[14px] border border-flood/25 bg-flood/[0.05] p-5">
          <p className="score-plate text-lg text-flood">
            {settings?.tiebreak_rules || 'poin → selisih gol → gol masuk'}
          </p>
          <ol className="mt-4 space-y-2 text-sm text-chalk-dim">
            <li>1. Poin tertinggi (Menang 3, Seri 1, Kalah 0)</li>
            <li>2. Selisih gol terbanyak</li>
            <li>3. Gol memasukkan terbanyak</li>
          </ol>
          <a
            href="/klasemen"
            className="label-programme mt-5 inline-flex items-center gap-1.5 text-flood transition-opacity hover:opacity-75"
          >
            Lihat klasemen →
          </a>
        </div>
      </section>
    </div>
  );
}
