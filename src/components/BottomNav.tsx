'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { name: 'Jadwal', path: '/' },
  { name: 'Klasemen', path: '/klasemen' },
  { name: 'Tim', path: '/tim' },
];

/** Bar tab bawah: 3 item (spesifikasi bagian 6). */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-white lg:hidden"
    >
      <div className="grid h-16 grid-cols-3">
        {NAV.map((item) => {
          const isActive =
            pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center justify-center border-t-[3px] font-display text-lg font-bold uppercase ${
                isActive
                  ? 'border-blue text-blue'
                  : 'border-transparent text-muted'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
