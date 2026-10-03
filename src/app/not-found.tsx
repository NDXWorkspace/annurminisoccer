import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="bg-paper px-4 py-16">
      <div className="rule-double mx-auto max-w-[1080px] pt-6">
        <p className="font-mono text-[13px] text-muted">Kesalahan 404</p>
        <h1 className="mt-2 font-display text-5xl font-extrabold text-ink">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-3 max-w-[65ch] text-muted">
          Alamat yang Anda tuju tidak tersedia. Mungkin tautannya sudah berubah atau
          halamannya dihapus.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-[4px] bg-blue px-5 font-display text-base font-bold uppercase text-white"
          >
            Kembali ke jadwal
          </Link>
          <Link
            href="/klasemen"
            className="inline-flex h-12 items-center rounded-[4px] border-[1.5px] border-ink px-5 font-display text-base font-bold uppercase text-ink"
          >
            Lihat klasemen
          </Link>
        </div>
      </div>
    </div>
  );
}
