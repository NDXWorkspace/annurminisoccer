import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="bg-ink px-4 py-20">
      <div className="wrap">
        <p className="label text-blue">Error 404</p>
        <p className="num mt-3 text-[clamp(90px,22vw,180px)] leading-none">404</p>
        <div className="mt-3 h-px w-24 bg-blue" aria-hidden />
        <h1 className="mt-6 font-display text-2xl font-extrabold md:text-3xl">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-3 max-w-[52ch] text-muted">
          Alamat yang Anda tuju tidak tersedia. Mungkin tautannya sudah berubah atau
          halamannya dihapus.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="label inline-flex h-12 items-center rounded-full bg-blue px-6 text-ink"
          >
            Kembali ke jadwal
          </Link>
          <Link
            href="/klasemen"
            className="label inline-flex h-12 items-center rounded-full border border-line px-6 text-text"
          >
            Lihat klasemen
          </Link>
        </div>
      </div>
    </div>
  );
}