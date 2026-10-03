'use client';

import { useState, useEffect } from 'react';
import { EventSettings } from '@/lib/types';

export default function PengaturanPage() {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));

      if (data.success && data.data) {
        setSettings(data.data);
      }

      if (!res.ok || !data.success) {
        // Keep the form usable with the returned defaults, but say why
        setLoadError(data.error || `Gagal memuat pengaturan (HTTP ${res.status}).`);
      } else {
        setLoadError(null);
      }
    } catch (err) {
      console.error('Gagal memuat pengaturan:', err);
      setLoadError('Tidak dapat memuat pengaturan acara. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setIsSaving(true);
    setMessage(null);

    // Only send the editable columns. `id` is server-owned — sending the
    // placeholder "default" from the fallback payload is what Postgres rejects.
    const payload = {
      event_name: settings.event_name,
      start_date: settings.start_date,
      end_date: settings.end_date,
      location: settings.location,
      map_url: settings.map_url,
      rules_text: settings.rules_text,
      tiebreak_rules: settings.tiebreak_rules,
      contact_info: settings.contact_info,
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Adopt the canonical row the server just wrote (it may assign the id).
        if (data.data) setSettings(data.data);
        setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Gagal menyimpan pengaturan.',
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (resetCode !== 'RESET') {
      setMessage({ type: 'error', text: "Ketik 'RESET' untuk mengonfirmasi" });
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/settings/reset', { method: 'POST' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Semua data berhasil direset!' });
        setTimeout(() => {
          setMessage(null);
          window.location.reload();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: 'Gagal mereset data' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat mereset data' });
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
      setResetCode('');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!settings) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8">
          <h2 className="text-lg font-semibold text-red-700">Gagal memuat pengaturan</h2>
          <p className="mt-1.5 text-sm text-red-600">
            {loadError ?? 'Respons dari server tidak berisi data acara.'}
          </p>
          <button
            onClick={() => {
              setIsLoading(true);
              setLoadError(null);
              fetchSettings();
            }}
            className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>{loadError} Form di bawah menampilkan nilai bawaan — perubahan belum dapat disimpan.</span>
          <button
            onClick={() => {
              setIsLoading(true);
              setLoadError(null);
              fetchSettings();
            }}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
          >
            Coba lagi
          </button>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Acara</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Nama Acara</label>
              <input
                type="text"
                value={settings.event_name}
                onChange={(e) => setSettings({...settings, event_name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Lokasi</label>
              <input
                type="text"
                value={settings.location}
                onChange={(e) => setSettings({...settings, location: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Tanggal Mulai</label>
              <input
                type="date"
                value={settings.start_date.slice(0, 10)}
                onChange={(e) => setSettings({...settings, start_date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Tanggal Selesai</label>
              <input
                type="date"
                value={settings.end_date.slice(0, 10)}
                onChange={(e) => setSettings({...settings, end_date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">URL Peta (Google Maps embed/link)</label>
              <input
                type="url"
                value={settings.map_url || ''}
                onChange={(e) => setSettings({...settings, map_url: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">Kontak Info (No HP / WhatsApp)</label>
              <input
                type="text"
                value={settings.contact_info || ''}
                onChange={(e) => setSettings({...settings, contact_info: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Contoh: 081234567890 (Panitia)"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">Aturan Main</label>
              <textarea
                value={settings.rules_text || ''}
                onChange={(e) => setSettings({...settings, rules_text: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none h-32"
                placeholder="Detail aturan turnamen..."
              ></textarea>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">Aturan Penentuan Klasemen (Tiebreak)</label>
              <textarea
                value={settings.tiebreak_rules}
                onChange={(e) => setSettings({...settings, tiebreak_rules: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none h-24"
                placeholder="Contoh: 1. Poin, 2. Selisih Gol, 3. Produktivitas Gol"
                required
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-primary hover:bg-primary-light text-white font-medium rounded-lg transition-colors flex items-center space-x-2 min-w-[140px] justify-center"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-red-50 rounded-xl border border-red-200 overflow-hidden mt-8">
        <div className="p-6">
          <h2 className="text-lg font-bold text-red-700 mb-2">Zona Berbahaya</h2>
          <p className="text-sm text-red-600 mb-4">Mereset data akan menghapus semua tim dan jadwal pertandingan secara permanen. Tindakan ini tidak bisa dibatalkan.</p>
          
          {!showResetConfirm ? (
            <button 
              onClick={() => {
                setShowResetConfirm(true);
                setMessage(null);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Reset Semua Data
            </button>
          ) : (
            <div className="bg-white p-4 rounded-lg border border-red-300 inline-block w-full sm:w-auto">
              <p className="font-bold text-gray-900 mb-2">Yakin ingin mereset semua data?</p>
              <p className="text-sm text-gray-600 mb-3">Ketik <strong className="text-red-600 font-mono">RESET</strong> untuk mengonfirmasi.</p>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                  placeholder="RESET"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 outline-none w-24 uppercase font-mono"
                />
                <button 
                  onClick={handleReset}
                  disabled={resetCode !== 'RESET' || isResetting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-md transition-colors"
                >
                  {isResetting ? 'Mereset...' : 'Konfirmasi Reset'}
                </button>
                <button 
                  onClick={() => {
                    setShowResetConfirm(false);
                    setResetCode('');
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
