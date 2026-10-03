'use client';

import { useState, useEffect } from 'react';

const KEY = 'annur-kategori';

/** Pilihan kategori terakhir tersimpan di perangkat; dipakai Jadwal, Klasemen, Tim. */
export function useCategory(defaultValue = 'Semua'): [string, (c: string) => void] {
  const [category, setCategory] = useState(defaultValue);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setCategory(saved);
    } catch {
      // Abaikan: tanpa penyimpanan, pakai default.
    }
  }, []);

  const set = (c: string) => {
    setCategory(c);
    try {
      window.localStorage.setItem(KEY, c);
    } catch {
      // Abaikan.
    }
  };

  return [category, set];
}
