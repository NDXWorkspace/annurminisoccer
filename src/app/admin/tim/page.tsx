'use client';

import { useState, useEffect, useRef } from 'react';
import type { Team, TeamFormData } from '@/lib/types';

export default function TimPage() {
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    short_name: '',
    group_name: 'A',
    color: '#0B3D91',
    logo_url: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const flashMessage = (m: { type: 'success' | 'error'; text: string }) => {
    setMessage(m);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const res = await fetch('/api/teams', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error || `Gagal memuat tim (HTTP ${res.status}).`);
        return;
      }
      if (data.success && data.data) {
        setTeams(data.data);
        setLoadError(null);
      } else {
        setLoadError(data.error || 'Tidak dapat memuat daftar tim.');
      }
    } catch (err) {
      console.error('Gagal memuat tim:', err);
      setLoadError('Tidak dapat memuat daftar tim. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.short_name.length !== 3) {
      setMessage({ type: 'error', text: 'Singkatan tim harus tepat 3 huruf' });
      return;
    }

    try {
      const url = editingId ? `/api/teams/${editingId}` : '/api/teams';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        short_name: formData.short_name.toUpperCase()
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        closeForm();
        fetchTeams();
        flashMessage({ type: 'success', text: editingId ? 'Tim berhasil diupdate' : 'Tim berhasil ditambahkan' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Terjadi kesalahan' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Kesalahan jaringan' });
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
        flashMessage({ type: 'success', text: 'Tim berhasil dihapus' });
      } else {
        const error = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: error.error || 'Gagal menghapus tim' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Kesalahan jaringan saat menghapus tim' });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditForm = (team: Team) => {
    setFormData({
      name: team.name,
      short_name: team.short_name,
      group_name: team.group_name,
      color: team.color || '#000000',
      logo_url: team.logo_url || '',
    });
    setEditingId(team.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      short_name: '',
      group_name: 'A',
      color: '#0B3D91',
      logo_url: '',
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span>
          <button
            onClick={() => {
              setIsLoading(true);
              fetchTeams();
            }}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
          >
            Coba lagi
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Tim</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Tambah Tim</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg">{editingId ? 'Edit Tim' : 'Tambah Tim Baru'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tim</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Mis. Garuda FC"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Singkatan</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={formData.short_name}
                    onChange={e => setFormData({...formData, short_name: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none uppercase font-mono"
                    placeholder="GRD"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tepat 3 huruf</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grup</label>
                  <select
                    value={formData.group_name}
                    onChange={e => setFormData({...formData, group_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                  >
                    {['A', 'B', 'C', 'D'].map(g => <option key={g} value={g}>Grup {g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warna Tim</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                    className="w-12 h-10 p-1 border border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm font-mono text-gray-600">{formData.color}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Logo (Opsional)</label>
                <input
                  type="url"
                  value={formData.logo_url || ''}
                  onChange={e => setFormData({...formData, logo_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="https://..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeForm} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-light">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Tim</th>
                <th className="px-6 py-4">Grup</th>
                <th className="px-6 py-4">Singkatan</th>
                <th className="px-6 py-4">Warna</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada tim terdaftar.</td>
                </tr>
              ) : (
                teams.map(team => (
                  <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: team.color || '#000' }}
                      >
                        {team.short_name.substring(0, 2)}
                      </div>
                      {team.name}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">Grup {team.group_name}</td>
                    <td className="px-6 py-4 font-mono font-medium text-gray-600">{team.short_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: team.color || '#000' }}></div>
                        <span className="font-mono text-xs text-gray-500 uppercase">{team.color}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => openEditForm(team)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={() => setDeletingTeam(team)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                        title="Hapus"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Team Confirmation Modal */}
      {deletingTeam && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Hapus Tim?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Tim <span className="font-semibold text-gray-800">{deletingTeam.name}</span> ({deletingTeam.short_name}) akan dihapus permanen.
              </p>
              <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                Catatan: Tim yang sudah memiliki jadwal pertandingan tidak dapat dihapus.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingTeam(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteTeam}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
