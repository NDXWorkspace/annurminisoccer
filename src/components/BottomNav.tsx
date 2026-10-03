'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { name: 'Jadwal', path: '/' },
  { name: 'Klasemen', path: '/klasemen' },
  { name: 'Tim', path: '/tim' },
];

/** Bar pil di bawah layar. Desktop memakai tab yang sama di header. */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-4 bottom-3 z-40 mx-auto grid max-w-[420px] grid-cols-3 gap-1 rounded-full border border-line bg-surface/95 p-1.5 backdrop-blur-md lg:hidden"
    >
      {NAV.map((item) => {
        const isActive =
          pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            href={item.path}
            aria-current={isActive ? 'page' : undefined}
            className={`label flex h-[46px] items-center justify-center rounded-full transition-colors ${
              isActive
                ? 'bg-blue/20 text-text shadow-[inset_0_0_0_1px_rgba(91,141,255,.45)]'
                : 'text-muted'
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}