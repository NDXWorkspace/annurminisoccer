'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const from = useSearchParams().get('from');

  // Heuristic only — it labels the meter, the server still does the real check.
  const strength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password) || /[^\w\s]/.test(password)) score++;
    return Math.min(3, score);
  })();

  const strengthLabel = ['', 'Lemah', 'Cukup', 'Kuat'][strength];
  const strengthTone = ['bg-gray-200', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'][strength];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // Only follow same-origin relative paths, never an absolute URL
        const dest = from && from.startsWith('/') && !from.startsWith('//') ? from : '/admin';
        router.replace(dest);
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Username atau password salah');
    } catch {
      setError('Tidak dapat menghubungi server. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-slate-900/10">
        <div className="bg-primary px-6 py-7 text-center text-white">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 font-black ring-1 ring-inset ring-white/25">
            A
          </div>
          <h1 className="text-lg font-bold leading-tight">Panitia An-Nur</h1>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.14em] text-primary-lighter">
            Panel administrasi
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 p-7">
          {from && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Sesi berakhir. Masuk kembali untuk melanjutkan.
            </p>
          )}

          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              placeholder="Masukkan username"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Password panitia
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Masukkan password"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {password.length > 0 && (
              <div className="mt-2.5">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        i <= strength ? strengthTone : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[11px] font-medium text-gray-500">
                  Kekuatan password: {strengthLabel}
                </p>
              </div>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || password.length < 4 || username.trim().length === 0}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Memeriksa…
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-xs text-gray-400">
        <Link href="/" className="transition-colors hover:text-primary">
          ← Kembali ke situs publik
        </Link>
      </p>
    </div>
  );
}
