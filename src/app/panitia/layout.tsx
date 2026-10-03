'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const TABS = [
  { name: 'Skor', path: '/panitia' },
  { name: 'Jadwal', path: '/panitia/jadwal' },
  { name: 'Tim', path: '/panitia/tim' },
];

const MORE = [
  { name: 'Pengaturan', path: '/panitia/pengaturan' },
  { name: 'Pengguna', path: '/panitia/pengguna', superadmin: true },
];

export default function PanitiaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);

  const isMasukPage = pathname === '/panitia/masuk';

  useEffect(() => {
    if (isMasukPage) {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check', { cache: 'no-store' });
        if (res.ok) {
          setIsAuthenticated(true);
          const data = await res.json().catch(() => ({}));
          if (data?.data) setCurrentUser(data.data);
        } else {
          router.push('/panitia/masuk');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/panitia/masuk');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const refreshId = window.setInterval(() => {
      fetch('/api/auth/check', { cache: 'no-store' }).catch(() => {});
    }, 30 * 60 * 1000);
    const onVisible = () => {
      if (!document.hidden) fetch('/api/auth/check', { cache: 'no-store' }).catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(refreshId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router, isMasukPage]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/panitia/masuk');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/panitia/masuk');
    }
  };

  if (isMasukPage) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper p-6 text-center">
        <p className="text-sm text-muted">Sesi berakhir atau belum masuk.</p>
        <Link
          href="/panitia/masuk"
          className="inline-flex h-12 items-center rounded-[4px] bg-blue px-5 font-display text-base font-bold uppercase text-white"
        >
          Ke halaman masuk
        </Link>
      </div>
    );
  }

  const visibleMore = MORE.filter((l) => !l.superadmin || currentUser?.role === 'superadmin');

  return (
    <div className="min-h-screen bg-paper">
      <header className="header-shadow border-b border-rule bg-white">
        <div className="mx-auto flex h-16 w-full max-w-[1080px] items-center justify-between gap-4 px-4">
          <Link href="/panitia" className="font-display text-xl font-extrabold text-ink">
            Panitia
          </Link>
          <div className="flex items-center gap-3">
            {currentUser && (
              <span className="font-mono text-[13px] text-muted">
                {currentUser.username} · {currentUser.role}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="h-11 rounded-[4px] border-[1.5px] border-alert px-4 font-display text-sm font-bold uppercase text-alert"
            >
              Keluar
            </button>
          </div>
        </div>
        <nav aria-label="Tab panitia" className="mx-auto w-full max-w-[1080px] px-4">
          <div className="flex gap-6 overflow-x-auto">
            {[...TABS, ...visibleMore].map((link) => {
              const isActive =
                pathname === link.path ||
                (link.path !== '/panitia' && pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex h-12 shrink-0 items-center font-display text-base font-bold uppercase ${
                    isActive ? 'border-b-[3px] border-blue text-blue' : 'text-muted'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1080px] px-4 py-6">{children}</main>
    </div>
  );
}
