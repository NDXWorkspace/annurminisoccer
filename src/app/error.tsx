'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);
  return (
    <div className="pitch-wash relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="relative max-w-md text-center">
        <span className="label-programme text-live-red">Terjadi kesalahan</span>

        <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-none tracking-[0.01em] text-chalk sm:text-5xl">
          Ada gangguan
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-chalk-dim">
          Halaman ini gagal dimuat. Coba muat ulang — jika masalahnya berlanjut, periksa koneksi
          Anda lalu hubungi panitia.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-flood px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-ink transition-transform duration-200 hover:-translate-y-0.5"
          >
            Coba lagi
          </button>
          <Link
            href="/"
            className="rounded-lg border border-line-bright bg-ink-raised px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-chalk transition-colors hover:border-flood/50 hover:text-flood"
          >
            Ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
