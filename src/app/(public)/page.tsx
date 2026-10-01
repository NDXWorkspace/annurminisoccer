'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MatchWithTeams, EventSettings, ApiResponse } from '@/lib/types';
import MatchCard from '@/components/MatchCard';
import EmptyState from '@/components/EmptyState';
import { formatShortDate } from '@/lib/utils';
import { SEED_MATCHES, SEED_SETTINGS } from '@/lib/seed';

/* ------------------------------------------------------------------ */
/* Countdown — four LED plates, mono figures, no drop shadows          */
/* ------------------------------------------------------------------ */
function Countdown({ target }: { target: string }) {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [over, setOver] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setOver(true);
        return;
      }
      setLeft({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff / 3_600_000) % 24),
        m: Math.floor((diff / 60_000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (over) {
    return (
      <div className="inline-flex items-center gap-2.5 rounded-full border border-turf/30 bg-turf/10 px-4 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-turf" />
        <span className="label-programme text-turf">Turnamen sedang berlangsung</span>
      </div>
    );
  }

  const cells = [
    { v: left.d, l: 'Hari' },
    { v: left.h, l: 'Jam' },
    { v: left.m, l: 'Menit' },
    { v: left.s, l: 'Detik' },
  ];

  return (
    <div className="flex items-stretch gap-px overflow-hidden rounded-xl border border-line bg-line">
      {cells.map((c, i) => (
        <div
          key={c.l}
          className="animate-rise flex min-w-[64px] flex-col items-center bg-ink-raised px-3 py-2.5 sm:min-w-[76px]"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <span
            key={c.v}
            className="score-plate tnum animate-score-pop text-2xl text-flood sm:text-[28px]"
          >
            {String(c.v).padStart(2, '0')}
          </span>
          <span className="label-programme mt-1 text-chalk-faint">{c.l}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading — hairline rule with a programme label               */
/* ------------------------------------------------------------------ */
function SectionHead({
  label,
  title,
  href,
  accent = false,
}: {
  label: string;
  title: string;
  href?: string;
  accent?: boolean;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b border-line pb-3">
      <div className="min-w-0">
        <span className={`label-programme ${accent ? 'text-live-red' : 'text-flood'}`}>{label}</span>
        <h2 className="mt-1 truncate font-display text-2xl font-bold uppercase tracking-[0.04em] text-chalk">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="label-programme shrink-0 text-chalk-faint transition-colors hover:text-flood"
        >
          Semua →
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
export default function BerandaPage() {
  // Seed dulu supaya halaman terisi pada frame pertama; respons API menimpanya.
  const [matches, setMatches] = useState<MatchWithTeams[]>(SEED_MATCHES);
  const [settings, setSettings] = useState<EventSettings | null>(SEED_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, s] = await Promise.all([
          fetch('/api/matches', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
        ]);
        // Seed hanya ditimpa kalau API benar-benar sukses. Endpoint yang
        // gagal tetap mengirim `data: []`, dan itu bukan reasonsional untuk
        // mengosongkan tampilan yang sudah terisi.
        const mData: ApiResponse<MatchWithTeams[]> = await m.json().catch(() => ({}));
        const sData: ApiResponse<EventSettings> = await s.json().catch(() => ({}));

        if (mData.success && mData.data) setMatches(mData.data);
        if (sData.success && sData.data) setSettings(sData.data);

        setError(mData.error || sData.error || null);
      } catch {
        setError('Tidak dapat terhubung ke server.');
      } finally {
        setLoading(false);
      }
    };

    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, []);

  const byKickoff = (a: MatchWithTeams, b: MatchWithTeams) =>
    `${a.match_date}${a.kickoff_time}`.localeCompare(`${b.match_date}${b.kickoff_time}`);

  const live = matches.filter((m) => m.status === 'live' || m.status === 'halftime');
  const results = matches.filter((m) => m.status === 'finished').sort((a, b) => byKickoff(b, a)).slice(0, 3);
  const upcoming = matches.filter((m) => m.status === 'scheduled').sort(byKickoff);
  const nextMatch = upcoming[0];

  const name = settings?.event_name || 'An-Nur Mini Soccer';
  const location = settings?.location || 'Lapangan An-Nur';
  const start = settings?.start_date || '2026-10-09';
  const end = settings?.end_date || '2026-10-10';
  const dateLabel =
    start === end
      ? formatShortDate(start)
      : `${formatShortDate(start)} – ${formatShortDate(end)} 2026`;

  if (loading && matches.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-flood border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* ================= HERO — asymmetric, title left / clock right ============ */}
      <section className="grain pitch-wash relative overflow-hidden border-b border-line">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-7">
            <span className="label-programme inline-flex items-center gap-2 rounded-full border border-line bg-ink-raised/70 px-3 py-1.5 text-flood">
              <span className="h-1 w-1 rounded-full bg-flood" />
              Turnamen 2026
            </span>

            <h1 className="mt-5 font-display text-[clamp(2.6rem,9vw,5.2rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.01em] text-chalk">
              An-Nur
              <span className="block text-flood">Mini Soccer</span>
            </h1>

            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-chalk-dim">
              Jadwal, skor langsung, dan klasemen fair-play sepanjang turnamen. Semua diperbarui
              otomatis dari meja panitia.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="flex items-center gap-2 text-sm text-chalk-dim">
                <svg className="h-4 w-4 text-flood" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {dateLabel}
              </span>
              <span className="flex items-center gap-2 text-sm text-chalk-dim">
                <svg className="h-4 w-4 text-flood" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {location}
              </span>
            </div>

            <div className="mt-9 flex flex-wrap gap-2.5">
              <Link
                href="/live"
                className="inline-flex items-center gap-2 rounded-lg bg-flood px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-ink transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-live-red" />
                Skor live
              </Link>
              <Link
                href="/jadwal"
                className="inline-flex items-center gap-2 rounded-lg border border-line-bright bg-ink-raised px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-chalk transition-colors hover:border-flood/50 hover:text-flood"
              >
                Jadwal lengkap
              </Link>
            </div>
          </div>

          {/* Clock panel — deliberately offset down to break the grid */}
          <div className="animate-rise rise-2 lg:col-span-5 lg:pt-6">
            <div className="rounded-[14px] border border-line bg-ink-raised/80 p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="label-programme text-chalk-faint">Hitung mundur kickoff</span>
                <span className="label-programme text-flood">{name}</span>
              </div>
              <Countdown target={`${start}T08:00:00`} />
              <p className="mt-4 text-xs leading-relaxed text-chalk-faint">
              Satu babak penyisian grup, lalu semifinal dan final. Klik{' '}
                <Link href="/jadwal" className="text-flood hover:underline">
                  jadwal
                </Link>{' '}
                untuk detail tiap laga.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BODY ================= */}
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6">
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber">
            <span className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
              <span>{error}</span>
            </span>
            <button
              onClick={() => window.location.reload()}
              className="label-programme shrink-0 hover:underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* On air / next up */}
        <section>
          {live.length > 0 ? (
            <>
              <SectionHead label="Sedang berlangsung" title="On air" href="/live" accent />
              <div className="grid gap-4 md:grid-cols-2">
                {live.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </>
          ) : nextMatch ? (
            <>
              <SectionHead label="Pertandingan berikutnya" title="Next up" href="/jadwal" />
              <div className="grid gap-4 md:grid-cols-2">
                <MatchCard match={nextMatch} />
              </div>
            </>
          ) : (
            <EmptyState
              title="Belum ada pertandingan"
              description="Jadwal akan tampil di sini begitu panitia mengisinya."
            />
          )}
        </section>

        {/* Results + upcoming, offset columns on desktop */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
          <section>
            <SectionHead label="Sudah selesai" title="Hasil terbaru" href="/live" />
            {results.length > 0 ? (
              <div className="flex flex-col gap-3">
                {results.map((m) => (
                  <MatchCard key={m.id} match={m} compact />
                ))}
              </div>
            ) : (
              <EmptyState title="Belum ada hasil" description="Belum ada pertandingan yang selesai." />
            )}
          </section>

          <section className="lg:pt-10">
            <SectionHead label="Akan datang" title="Jadwal terdekat" href="/jadwal" />
            {upcoming.length > 0 ? (
              <div className="flex flex-col gap-3">
                {upcoming.slice(0, 3).map((m) => (
                  <MatchCard key={m.id} match={m} compact />
                ))}
              </div>
            ) : (
              <EmptyState title="Belum ada jadwal" description="Jadwal lanjutan belum diumumkan." />
            )}
          </section>
        </div>

        {/* Shortcut strip — the four sections, as programme tabs */}
        <section>
          <SectionHead label="Navigasi cepat" title="Telusuri" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Jadwal', path: '/jadwal', hint: 'Semua laga', glyph: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { label: 'Live', path: '/live', hint: 'Skor terkini', glyph: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
              { label: 'Klasemen', path: '/klasemen', hint: 'Poin & gol', glyph: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.236m0 0V3m0 0h.75M17.5 9.728a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0' },
              { label: 'Info', path: '/info', hint: 'Aturan main', glyph: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z' },
            ].map((item, i) => (
              <Link
                key={item.path}
                href={item.path}
                className="animate-rise group flex items-center gap-3 rounded-xl border border-line bg-ink-raised px-4 py-3.5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-flood/45"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-ink-sunken text-flood transition-colors group-hover:border-flood/40">
                  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={item.glyph} />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm font-bold uppercase tracking-[0.1em] text-chalk">
                    {item.label}
                  </span>
                  <span className="label-programme block text-chalk-faint">{item.hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
