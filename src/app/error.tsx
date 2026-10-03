'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);
  return (
    <div className="bg-paper px-4 py-16">
      <div className="rule-double mx-auto max-w-[1080px] pt-6">
        <p className="font-mono text-[13px] text-muted">Terjadi kesalahan</p>
        <h1 className="mt-2 font-display text-5xl font-extrabold text-ink">
          Data tidak dapat dimuat
        </h1>
        <p className="mt-3 max-w-[65ch] text-muted">
          Halaman ini gagal dimuat. Coba muat ulang. Jika berlanjut, periksa koneksi
          Anda lalu hubungi panitia.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="inline-flex h-12 items-center rounded-[4px] bg-blue px-5 font-display text-base font-bold uppercase text-white"
          >
            Coba lagi
          </button>
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-[4px] border-[1.5px] border-ink px-5 font-display text-base font-bold uppercase text-ink"
          >
            Kembali ke jadwal
          </Link>
        </div>
      </div>
    </div>
  );
}
