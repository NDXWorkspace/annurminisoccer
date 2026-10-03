'use client';

import { useEffect, useState } from 'react';

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
    past: ms === 0,
  };
}

const LABELS = ['hari', 'jam', 'menit', 'detik'];

/**
 * Hitung mundur ke pertandingan pertama.
 * SSR-safe: selalu render "--" dulu supaya server dan klien sama di frame pertama.
 */
export default function Countdown({ target }: { target: string }) {
  const [state, setState] = useState<{ v: number[]; ready: boolean }>({
    v: [0, 0, 0, 0],
    ready: false,
  });

  useEffect(() => {
    const targetMs = new Date(target).getTime();
    const tick = () => {
      const d = diff(targetMs);
      setState({ v: [d.days, d.hours, d.minutes, d.seconds], ready: true });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div
      className="mt-8 grid grid-cols-4 gap-2.5"
      role="timer"
      aria-label="Hitung mundur menuju pertandingan pertama"
    >
      {LABELS.map((label, i) => (
        <div key={label} className="rounded-[22px] border border-line bg-surface px-4 py-3">
          <span className="num block text-[34px] md:text-[52px]" suppressHydrationWarning>
            {state.ready ? String(state.v[i]).padStart(2, '0') : '--'}
          </span>
          <span className="label mt-1 block text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}