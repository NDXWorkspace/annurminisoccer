'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/**
 * Penanda "peraturan sudah dibaca" per perangkat.
 * Angkat versi (…-v2) bila isi peraturan berubah, supaya pengunjung lama
 * melihat lembar yang baru.
 */
const SEEN_KEY = 'annur-peraturan-v1';

/**
 * Popup peraturan turnamen di beranda — tampil sekali untuk client baru
 * (kunjungan pertama di perangkat ini), lalu disimpan di localStorage.
 *
 * Geraknya mengikuti sistem halaman: strip pengumuman naik dari tepi bawah
 * di ponsel, mengambang di tengah di layar lebar; Escape dan ketuk latar
 * sama dengan menekan "Mengerti".
 */
export default function RulesPopup({ rules }: { rules: string[] }) {
  const [open, setOpen] = useState(false);
  const ackRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Penyimpanan diblokir: penguncian hanya berlaku selama tab terbuka.
    }
  }, []);

  // Kunjungan pertama: buka setelah komponen terpasang (tanpa kilau SSR).
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SEEN_KEY)) return;
    } catch {
      // Mode privat tanpa localStorage: tetap tampilkan.
    }
    setOpen(true);
  }, []);

  // Selama lembar terbuka: kunci gulir halaman, fokus ke tombol utama,
  // dan Escape ikut menandai "sudah dibaca".
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ackRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      {/* Ketuk latar = tutup, menandai sudah dibaca. */}
      <div
        className="rules-bd absolute inset-0 bg-ink/85 backdrop-blur-[6px]"
        aria-hidden
        onClick={dismiss}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-title"
        className="rules-sheet relative flex max-h-[min(84vh,760px)] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[32px] border border-line bg-surface sm:rounded-[32px]"
      >
        {/* Strip pengumuman */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <span className="label flex items-center gap-2 text-yellow">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow" aria-hidden />
            Pengumuman panitia
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Tutup peraturan"
            className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line text-muted transition-colors hover:border-blue/50 hover:text-text"
          >
            ✕
          </button>
        </div>

        {/* Isi bergulir, judul tetap ikut naik dari tepi seperti hero. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-5">
          <h2 id="rules-title" className="num text-[clamp(32px,9vw,44px)]">
            <span className="hero-line">
              <b>Peraturan</b>
            </span>
            <span className="hero-line">
              <b>turnamen</b>
            </span>
          </h2>
          <p className="mt-3.5 max-w-[46ch] text-sm leading-relaxed text-muted">
            Berlaku untuk seluruh peserta. Baca sekali sekarang — peraturan
            lengkap selalu tersedia di menu Info.
          </p>

          <ol className="mt-5 overflow-hidden rounded-[22px] border border-line">
            {rules.map((r, i) => (
              <li
                key={i}
                className="flex gap-3.5 border-b border-line bg-white/[0.025] px-4 py-3.5 last:border-0"
              >
                <span className="num w-7 flex-none text-xl text-blue">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[15px] leading-relaxed">{r}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Kaki lembar: satu tindakan jelas, satu jalan ke peraturan lengkap. */}
        <div className="border-t border-line px-5 pb-[max(env(safe-area-inset-bottom,0px),16px)] pt-4">
          <button
            ref={ackRef}
            type="button"
            onClick={dismiss}
            className="label h-12 w-full rounded-full bg-blue text-ink transition-colors hover:bg-blue/85"
          >
            Mengerti, mulai menonton
          </button>
          <Link
            href="/info"
            onClick={dismiss}
            className="label mt-2.5 block py-1 text-center text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
          >
            Baca selengkapnya di Info
          </Link>
        </div>
      </div>
    </div>
  );
}
