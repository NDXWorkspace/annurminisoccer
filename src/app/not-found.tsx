import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="pitch-wash relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="relative text-center">
        <span className="label-programme text-flood">Error 404</span>

        <p className="score-plate mt-4 text-[7rem] leading-none text-chalk sm:text-[10rem]">
          404
        </p>

        <div className="mx-auto mt-2 h-[2px] w-24 bg-flood" aria-hidden />

        <h1 className="mt-6 font-display text-2xl font-bold uppercase tracking-[0.06em] text-chalk sm:text-3xl">
          Halaman tidak ditemukan
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-chalk-dim">
          Alamat yang Anda tuju tidak tersedia. Mungkin tautannya sudah berubah atau halamannya
          dihapus.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-flood px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-ink transition-transform duration-200 hover:-translate-y-0.5"
          >
            Kembali ke beranda
          </Link>
          <Link
            href="/jadwal"
            className="rounded-lg border border-line-bright bg-ink-raised px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-chalk transition-colors hover:border-flood/50 hover:text-flood"
          >
            Lihat jadwal
          </Link>
        </div>
      </div>
    </div>
  );
}
