'use client';

import { useState, useEffect } from 'react';
import type { Team, TeamFormData } from '@/lib/types';
import Monogram from '@/components/Monogram';
import CategoryMark from '@/components/CategoryMark';

const EMPTY: TeamFormData = {
  name: '',
  short_name: '',
  group_name: 'A',
  color: '#0B3D91',
  logo_url: '',
  category: 'U10',
};

export default function TimPanitia() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<TeamFormData>(EMPTY);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function fetchTeams() {
    try {
      const res = await fetch('/api/teams', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error || 'Gagal memuat tim.');
        return;
      }
      if (data.success && data.data) {
        setTeams(data.data);
        setLoadError(null);
      } else {
        setLoadError(data.error || 'Tidak dapat memuat daftar tim.');
      }
    } catch {
      setLoadError('Tidak dapat memuat daftar tim. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.short_name.trim().length !== 3) {
      setMessage({ type: 'error', text: 'Singkatan tim harus tepat 3 huruf.' });
      return;
    }
    try {
      const url = editingId ? `/api/teams/${editingId}` : '/api/teams';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, short_name: formData.short_name.toUpperCase() }),
      });
      if (res.ok) {
        closeForm();
        fetchTeams();
        setMessage({
          type: 'success',
          text: editingId ? 'Tim berhasil diperbarui.' : 'Tim berhasil ditambahkan.',
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: err.error || 'Terjadi kesalahan.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Kesalahan jaringan.' });
    }
  };

  const confirmDeleteTeam = async () => {
    if (!deletingTeam) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/teams/${deletingTeam.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletingTeam(null);
        fetchTeams();
        setMessage({ type: 'success', text: 'Tim berhasil dihapus.' });
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: err.error || 'Gagal menghapus tim.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Kesalahan jaringan saat menghapus tim.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditForm = (team: Team) => {
    setFormData({
      name: team.name,
      short_name: team.short_name,
      group_name: team.group_name,
      color: team.color || '#0B3D91',
      logo_url: team.logo_url || '',
      category: team.category ?? 'U10',
    });
    setEditingId(team.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(EMPTY);
  };

  if (isLoading) {
    return (
      <div className="border border-rule bg-white px-4 py-8">
        <div className="h-8 w-1/2 bg-rule" />
        <div className="mt-3 h-4 w-1/3 bg-rule" />
      </div>
    );
  }

  const inputCls =
    'h-[52px] w-full rounded-[2px] border-[1.5px] border-rule bg-white px-3 text-base text-ink outline-none focus:border-blue';

  return (
    <div className="space-y-6">
      {message && (
        <p className={`border border-rule bg-white px-4 py-3 text-sm ${message.type === 'success' ? 'text-blue' : 'text-alert'}`}>
          {message.text}
        </p>
      )}

      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-alert bg-white px-4 py-3">
          <p className="text-sm text-alert">{loadError}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              fetchTeams();
            }}
            className="h-11 rounded-[4px] border-[1.5px] border-ink px-4 font-display text-sm font-bold uppercase text-ink"
          >
            Coba lagi
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold text-ink">Tim</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="h-12 rounded-[4px] bg-blue px-5 font-display text-base font-bold uppercase text-white hover:bg-ink"
        >
          Tambah tim
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto border border-rule bg-white">
            <div className="flex items-center justify-between border-b border-rule px-4 py-3">
              <h2 className="font-display text-xl font-extrabold text-ink">
                {editingId ? 'Ubah tim' : 'Tambah tim'}
              </h2>
              <button onClick={closeForm} className="flex h-11 w-11 items-center justify-center text-ink" aria-label="Tutup">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
              <div>
                <label htmlFor="t-name" className="label block text-ink">Nama tim</label>
                <input
                  id="t-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`${inputCls} mt-1.5`}
                />
              </div>
              <div>
                <span className="label block text-ink">Kategori</span>
                <div className="mt-1.5 grid grid-cols-2 border border-rule" role="group" aria-label="Kategori">
                  {['U10', 'U12'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: c })}
                      aria-pressed={formData.category === c}
                      className={`h-12 font-display text-base font-bold uppercase ${
                        formData.category === c ? 'bg-blue text-white' : 'text-ink'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="t-short" className="label block text-ink">Singkatan (3 huruf)</label>
                  <input
                    id="t-short"
                    type="text"
                    required
                    maxLength={3}
                    value={formData.short_name}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value.toUpperCase() })}
                    className={`${inputCls} mt-1.5 font-mono uppercase`}
                  />
                </div>
                <div>
                  <label htmlFor="t-group" className="label block text-ink">Grup</label>
                  <select
                    id="t-group"
                    value={formData.group_name}
                    onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                    className={`${inputCls} mt-1.5`}
                  >
                    {['A', 'B', 'C', 'D'].map((g) => (
                      <option key={g} value={g}>
                        Grup {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="t-color" className="label block text-ink">Warna tim</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    id="t-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-[52px] w-16 cursor-pointer rounded-[2px] border-[1.5px] border-rule bg-white p-1"
                  />
                  <span className="font-mono text-sm uppercase text-muted">{formData.color}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="h-12 flex-1 rounded-[4px] border-[1.5px] border-ink font-display text-base font-bold uppercase text-ink"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-12 flex-1 rounded-[4px] bg-blue font-display text-base font-bold uppercase text-white hover:bg-ink"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-rule bg-white">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="bg-ink text-white">
              <th scope="col" className="label px-4 py-2.5">Tim</th>
              <th scope="col" className="label px-4 py-2.5">Kategori</th>
              <th scope="col" className="label px-4 py-2.5">Grup</th>
              <th scope="col" className="label px-4 py-2.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Belum ada tim terdaftar.
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr key={team.id} className="border-b border-rule last:border-0">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <Monogram name={team.name} shortName={team.short_name} color={team.color} size={32} />
                      <span>
                        <span className="block font-bold text-ink">{team.name}</span>
                        <span className="font-mono text-xs text-muted">{team.short_name}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <CategoryMark category={team.category ?? 'U10'} />
                  </td>
                  <td className="px-4 py-3 text-ink">Grup {team.group_name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex gap-2">
                      <button
                        onClick={() => openEditForm(team)}
                        className="h-11 rounded-[4px] border-[1.5px] border-ink px-4 font-display text-sm font-bold uppercase text-ink"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() => setDeletingTeam(team)}
                        className="h-11 rounded-[4px] border-[1.5px] border-alert px-4 font-display text-sm font-bold uppercase text-alert"
                      >
                        Hapus
                      </button>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deletingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="w-full max-w-sm border border-rule bg-white p-6 text-center">
            <h3 className="font-display text-xl font-extrabold text-ink">Hapus tim?</h3>
            <p className="mt-2 text-sm text-muted">
              Tim {deletingTeam.name} akan dihapus permanen. Tim yang sudah punya
              pertandingan tidak dapat dihapus.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingTeam(null)}
                className="h-12 flex-1 rounded-[4px] border-[1.5px] border-ink font-display text-base font-bold uppercase text-ink"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteTeam}
                className="h-12 flex-1 rounded-[4px] bg-alert font-display text-base font-bold uppercase text-white"
              >
                {isDeleting ? 'Menghapus…' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
