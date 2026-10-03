'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { name: 'Beranda', path: '/' },
  { name: 'Jadwal', path: '/jadwal' },
  { name: 'Live', path: '/live' },
  { name: 'Klasemen', path: '/klasemen' },
  { name: 'Tim', path: '/tim' },
];

/** Bar tab bawah mobile. Desktop memakai tab di header. */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-white lg:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {NAV.map((item) => {
          const isActive =
            pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center justify-center font-display text-sm font-bold uppercase ${
                isActive ? 'text-blue' : 'text-muted'
              }`}
            >
              {isActive && (
                <span aria-hidden className="absolute inset-x-6 top-0 h-[3px] bg-blue" />
              )}
              {item.name}
              {item.path === '/live' && (
                <span aria-hidden className="ml-1 h-1.5 w-1.5 rounded-full bg-alert" />
              )}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
