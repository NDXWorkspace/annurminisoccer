import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

const NAV = [
  { name: 'Jadwal', path: '/' },
  { name: 'Klasemen', path: '/klasemen' },
  { name: 'Tim', path: '/tim' },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="header-shadow sticky top-0 z-40 border-b border-rule bg-white">
        <div className="mx-auto flex h-16 w-full max-w-[1080px] items-center justify-between gap-4 px-4">
          <Link href="/" className="font-display text-xl font-extrabold tracking-tight text-ink">
            An-Nur Mini Soccer
          </Link>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-6 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="font-display text-base font-bold uppercase text-ink hover:text-blue"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 pb-safe lg:pb-8">
        {children}
      </main>

      <footer className="border-t border-rule bg-white">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-6">
          <p className="max-w-[65ch] text-sm text-muted">
            Skor diinput manual oleh panitia. Jika ada selisih, keputusan panitia yang
            berlaku.
          </p>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
