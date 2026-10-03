'use client';

import { useEffect, useRef } from 'react';

/**
 * Sorotan lembut yang mengikuti kursor di area hero.
 *
 *Sorotan itu sendiri tidak informatif — gunanya memberi tanda arah mata pada teks besar
 * saat halaman dibuka di laptop. Di perangkat sentuh dimatikan.
 */
export default function HeroSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', `${e.clientX - r.left}px`);
      el.style.setProperty('--y2', `${e.clientY - r.top}px`);
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          'radial-gradient(520px circle at var(--x,70%) var(--y2,30%), rgb(70 120 255 / .3), transparent 70%), radial-gradient(460px circle at 0% 100%, rgb(30 210 200 / .15), transparent 70%)',
      }}
    />
  );
}