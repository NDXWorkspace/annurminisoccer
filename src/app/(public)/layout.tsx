import BottomNav from '@/components/BottomNav';
import MatchdayRail from '@/components/MatchdayRail';
import Link from 'next/link';

const NAV = [
  { name: 'Beranda', path: '/' },
  { name: 'Jadwal', path: '/jadwal' },
  { name: 'Live', path: '/live' },
  { name: 'Klasemen', path: '/klasemen' },
  { name: 'Tim', path: '/tim' },
  { name: 'Info', path: '/info' },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-flood font-display text-xl font-extrabold text-ink transition-transform duration-300 group-hover:rotate-[-6deg]">
              A
              <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/30" aria-hidden />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold uppercase tracking-[0.12em] text-chalk">
                An-Nur
              </span>
              <span className="label-programme mt-0.5 text-chalk-faint">Mini Soccer Cup</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
            {NAV.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="group relative rounded-md px-3.5 py-2 font-display text-sm font-semibold uppercase tracking-[0.1em] text-chalk-dim transition-colors hover:text-chalk"
              >
                {item.name}
                {item.path === '/live' && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-live-red align-middle animate-live-pulse" />
                )}
                <span className="absolute inset-x-3.5 -bottom-px h-[2px] origin-left scale-x-0 rounded-full bg-flood transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <Link
            href="/live"
            className="flex items-center gap-2 rounded-full border border-live-red/40 bg-live-red/10 px-3.5 py-1.5 font-display text-xs font-bold uppercase tracking-[0.14em] text-live-red transition-colors hover:bg-live-red/20 lg:hidden"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-live-pulse" />
            Live
          </Link>
        </div>
      </header>

      <MatchdayRail />

      <main className="flex-1 pb-safe lg:pb-0">{children}</main>

      <footer className="mt-16 border-t border-line bg-ink-sunken">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="label-programme text-chalk-faint">
            An-Nur Mini Soccer · Turnamen 2026
          </p>
          <Link
            href="/admin"
            className="label-programme text-chalk-faint transition-colors hover:text-flood"
          >
            Panitia →
          </Link>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
