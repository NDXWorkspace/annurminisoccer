'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);
  return (
    <div className="bg-ink px-4 py-20">
      <div className="wrap">
        <p className="label text-danger">Terjadi kesalahan</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold md:text-5xl">
          Data tidak dapat dimuat
        </h1>
        <p className="mt-3 max-w-[52ch] text-muted">
          Halaman ini gagal dimuat. Coba muat ulang. Jika berlanjut, periksa koneksi
          Anda lalu hubungi panitia.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="label inline-flex h-12 items-center rounded-full bg-blue px-6 text-ink"
          >
            Coba lagi
          </button>
          <Link
            href="/"
            className="label inline-flex h-12 items-center rounded-full border border-line px-6 text-text"
          >
            Kembali ke jadwal
          </Link>
        </div>
      </div>
    </div>
  );
}