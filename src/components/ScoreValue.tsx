'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Pasangan skor A–B yang tahu kapan berubahnya.
 *
 * Angka naik dari bawah dan garis bawah kuning muncul HANYA saat nilai
 * benar-benar berubah — bukan setiap render. `aria-label` dibacakan ulang
 * supaya pembaca layar hearsskor baru.
 */
export default function ScorePair({
  a,
  b,
  size = 'text-[34px]',
  label,
}: {
  a: number;
  b: number;
  size?: string;
  label: string;
}) {
  const [flash, setFlash] = useState(0);
  const prev = useRef(`${a}-${b}`);

  useEffect(() => {
    if (prev.current !== `${a}-${b}`) {
      prev.current = `${a}-${b}`;
      setFlash((k) => k + 1);
    }
  }, [a, b]);

  return (
    <p
      className={`num relative flex items-center gap-2 ${size}`}
      aria-label={label}
      aria-live="polite"
    >
      <span key={`a${flash}`} className={flash > 0 ? 'animate-flip' : undefined}>
        {a}
      </span>
      <span className="font-medium text-muted" aria-hidden>
        –
      </span>
      <span key={`b${flash}`} className={flash > 0 ? 'animate-flip' : undefined}>
        {b}
      </span>
      {flash > 0 && (
        <span
          aria-hidden
          className="animate-flash absolute inset-x-2 -bottom-1 h-1 rounded-full bg-yellow"
        />
      )}
    </p>
  );
}