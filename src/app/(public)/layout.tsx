import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import MatchdayRail from '@/components/MatchdayRail';
import ScrollProgress from '@/components/ScrollProgress';

const NAV = [
  { name: 'Jadwal', path: '/' },
  { name: 'Klasemen', path: '/klasemen' },
  { name: 'Tim', path: '/tim' },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollProgress />
      <div className="flex min-h-screen flex-col bg-ink">
        <header className="sticky top-[calc(env(safe-area-inset-top,0px)+10px)] z-40 mt-2.5">
        <div className="wrap">
          <div className="flex h-14 items-center justify-between gap-3 rounded-full border border-line bg-surface/95 pl-5 pr-2.5 backdrop-blur-md">
            <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap">
              <span aria-hidden className="relative h-5 w-5 flex-none rounded-full border-2 border-blue">
                <span className="absolute left-1/2 top-[-5px] bottom-[-5px] w-0.5 -translate-x-1/2 rounded-full bg-blue" />
              </span>
              <span className="font-display text-[17px] font-extrabold tracking-tight">
                An-Nur Mini Soccer
              </span>
            </Link>

            <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="label rounded-full px-4 py-2.5 text-muted transition-colors hover:text-text"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <MatchdayRail />
        </div>
      </header>

      <main className="wrap flex-1 pb-safe lg:pb-12">{children}</main>

      <footer className="wrap py-9 text-sm text-muted">
        <div className="border-t border-line pt-6">
          <p className="max-w-[65ch]">
            Skor diinput manual oleh panitia. Jika ada selisih, keputusan panitia yang
            berlaku.
          </p>
          <nav aria-label="Tautan lain" className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/jadwal" className="hover:text-blue">
              Jadwal lengkap
            </Link>
            <Link href="/live" className="hover:text-blue">
              Skor live
            </Link>
            <Link href="/info" className="hover:text-blue">
              Info
            </Link>
            <Link href="/panitia" className="hover:text-blue">
              Panitia
            </Link>
          </nav>
        </div>
      </footer>

      <BottomNav />
      </div>
    </>
  );
}