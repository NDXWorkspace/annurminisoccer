'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ApiResponse, EventSettings } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { SEED_SETTINGS } from '@/lib/seed';

const DEFAULT_RULES = [
  'Sistem pertandingan menggunakan babak penyisihan grup dilanjutkan fase gugur (semifinal dan final).',
  'Waktu pertandingan adalah 2 x 15 menit kotor dengan jeda istirahat 5 menit.',
  'Jumlah pemain di lapangan 7 lawan 7 termasuk penjaga gawang.',
  'Pergantian pemain bebas tanpa batasan.',
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

  if (loading && !settings) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-4 py-8">
        <div className="border border-rule bg-white px-4 py-8">
          <div className="h-8 w-1/2 bg-rule" />
          <div className="mt-3 h-4 w-1/3 bg-rule" />
        </div>
      </div>
    );
  }

  const facts = [
    {
      label: 'Tanggal',
      value:
        settings?.start_date && settings?.end_date
          ? `${formatDate(settings.start_date.split('T')[0])} sampai ${formatDate(settings.end_date.split('T')[0])}`
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
      value: settings?.contact_info || 'Hubungi petugas lapangan saat pertandingan berlangsung.',
      icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
    },
  ];

  const rules = settings?.rules_text
    ? settings.rules_text.split('\n').filter((l) => l.trim().length > 0)
    : DEFAULT_RULES;

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-8">
      <div className="rule-double pt-3">
        <h1 className="font-display text-[32px] font-extrabold leading-none text-ink md:text-[44px]">
          {settings?.event_name || 'An-Nur Mini Soccer'}
        </h1>
      </div>

      <dl className="mt-6 border border-rule bg-white">
        {facts.map((f) => (
          <div key={f.label} className="flex items-start gap-4 border-b border-rule px-4 py-4 last:border-0">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-ink text-ink">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <dt className="label text-muted">{f.label}</dt>
              <dd className="mt-1 whitespace-pre-line text-base leading-relaxed text-ink">{f.value}</dd>
              {f.label === 'Lokasi' && settings?.map_url && (
                <a
                  href={settings.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-display text-base font-bold uppercase text-blue"
                >
                  Buka peta
                </a>
              )}
            </div>
          </div>
        ))}
      </dl>

      <section aria-label="Peraturan turnamen" className="mt-10">
        <div className="rule-double pt-3">
          <h2 className="font-display text-2xl font-extrabold text-ink">Peraturan turnamen</h2>
        </div>
        <ol className="mt-3 border-t border-rule">
          {rules.map((r, i) => (
            <li key={i} className="flex gap-4 border-b border-rule bg-white px-4 py-3.5">
              <span className="score-display shrink-0 text-2xl text-ink">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-base leading-relaxed text-ink">{r}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Urutan tie-break" className="mt-10">
        <div className="rule-double pt-3">
          <h2 className="font-display text-2xl font-extrabold text-ink">Urutan tie-break</h2>
        </div>
        <div className="mt-3 border border-rule bg-white px-4 py-5">
          <p className="font-display text-xl font-extrabold text-ink">
            {settings?.tiebreak_rules || 'Poin, selisih gol, gol memasukkan'}
          </p>
          <ol className="mt-3 space-y-1.5 text-sm text-muted">
            <li>1. Poin tertinggi (menang 3, seri 1, kalah 0)</li>
            <li>2. Selisih gol terbanyak</li>
            <li>3. Gol memasukkan terbanyak</li>
          </ol>
          <Link
            href="/klasemen"
            className="mt-4 inline-flex h-12 items-center rounded-[4px] border-[1.5px] border-ink px-5 font-display text-base font-bold uppercase text-ink"
          >
            Lihat klasemen
          </Link>
        </div>
      </section>
    </div>
  );
}
