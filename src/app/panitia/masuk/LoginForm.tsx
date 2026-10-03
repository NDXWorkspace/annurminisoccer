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
        const dest = from && from.startsWith('/') && !from.startsWith('//') ? from : '/panitia';
        router.replace(dest);
        router.refresh();
        return;
      }

      await res.json().catch(() => ({}));
      setError('Kata sandi salah.');
    } catch {
      setError('Tidak dapat menghubungi server. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[360px]">
      <h1 className="font-display text-3xl font-extrabold text-ink">Masuk Panitia</h1>

      <form onSubmit={handleLogin} className="mt-6">
        <label htmlFor="username" className="label block text-ink">
          Nama pengguna
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          className="mt-1.5 h-[52px] w-full rounded-[2px] border-[1.5px] border-rule bg-white px-3 text-base text-ink outline-none focus:border-blue"
        />

        <label htmlFor="password" className="label mt-4 block text-ink">
          Kata sandi
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mt-1.5 h-[52px] w-full rounded-[2px] border-[1.5px] border-rule bg-white px-3 text-base text-ink outline-none focus:border-blue"
        />
        {error && (
          <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-alert">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading || password.length === 0 || username.trim().length === 0}
          className="mt-6 h-14 w-full rounded-[4px] bg-blue font-display text-base font-bold uppercase text-white hover:bg-ink disabled:opacity-50"
        >
          {isLoading ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>

      <p className="mt-6">
        <Link href="/" className="font-display text-base font-bold uppercase text-blue">
          ← Kembali ke jadwal
        </Link>
      </p>
    </div>
  );
}
