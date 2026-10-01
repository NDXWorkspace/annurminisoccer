'use client';

import { useState, useEffect, useRef } from 'react';
import type { MatchWithTeams, Team, MatchFormData, MatchStage } from '@/lib/types';
import { formatShortDate, formatTime, getStatusLabel, getStatusColor, todayWIB } from '@/lib/utils';

export default function PertandinganPage() {
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);

  const flashMessage = (m: { type: 'success' | 'error'; text: string }) => {
    setMessage(m);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 3000);
  };
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<MatchWithTeams | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<MatchFormData>({
    team_a_id: '',
    team_b_id: '',
    match_date: todayWIB(),
    kickoff_time: '19:00',
    field: '1',
    stage: 'grup',
    group_name: '',
  });

  const fetchData = async () => {
    try {
      const [teamsRes, matchesRes] = await Promise.all([
        fetch('/api/teams', { cache: 'no-store' }),
        fetch('/api/matches', { cache: 'no-store' })
      ]);
      const teamsData = await teamsRes.json().catch(() => ({}));
      const matchesData = await matchesRes.json().catch(() => ({}));

      if (!teamsRes.ok || !matchesRes.ok || !teamsData.success || !matchesData.success) {
        setLoadError(teamsData.error || matchesData.error || 'Gagal memuat data. Silakan coba lagi.');
        return;
      }
      
      if (teamsData.data) setTeams(teamsData.data);
      if (matchesData.data) {
        const sorted = (matchesData.data as MatchWithTeams[]).sort((a, b) => {
          if (a.match_date !== b.match_date) return a.match_date.localeCompare(b.match_date);
          return (a.kickoff_time || '').localeCompare(b.kickoff_time || '');
        });
        setMatches(sorted);
      }
      setLoadError(null);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setLoadError('Gagal memuat data. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.team_a_id === formData.team_b_id) {
      setMessage({ type: 'error', text: 'Tim A dan Tim B tidak boleh sama' });
      return;
    }

    try {
      const url = editingId ? `/api/matches/${editingId}` : '/api/matches';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        closeForm();
        fetchData();
        flashMessage({
          type: 'success',
          text: editingId ? 'Jadwal pertandingan berhasil diperbarui' : 'Jadwal pertandingan berhasil ditambahkan',
        });
      } else {
        const error = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: error.error || 'Terjadi kesalahan saat menyimpan jadwal' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Kesalahan jaringan, coba lagi nanti' });
    }
  };

  const confirmDelete = async () => {
    if (!deletingMatch) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/matches/${deletingMatch.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletingMatch(null);
        fetchData();
        flashMessage({ type: 'success', text: 'Pertandingan berhasil dihapus' });
      } else {
        const error = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: error.error || 'Gagal menghapus pertandingan' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Kesalahan jaringan saat menghapus pertandingan' });
    } finally {
      setIsDeleting(false);
    }
  };

  const openForm = (match?: MatchWithTeams) => {
    if (match) {
      setEditingId(match.id);
      setFormData({
        team_a_id: match.team_a_id,
        team_b_id: match.team_b_id,
        match_date: match.match_date,
        kickoff_time: match.kickoff_time,
        field: match.field,
        stage: match.stage,
        group_name: match.group_name || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        team_a_id: teams.length > 0 ? teams[0].id : '',
        team_b_id: teams.length > 1 ? teams[1].id : '',
        match_date: todayWIB(),
        kickoff_time: '19:00',
        field: '1',
        stage: 'grup',
        group_name: '',
      });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Group matches by date
  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.match_date]) acc[match.match_date] = [];
    acc[match.match_date].push(match);
    return acc;
  }, {} as Record<string, MatchWithTeams[]>);

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{loadError}</span>
          <button
            onClick={() => {
              setIsLoading(true);
              fetchData();
            }}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
          >
            Coba lagi
          </button>
        </div>
      )}
      {message && (
        <div className={`p-4 rounded-lg font-medium transition-all ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Jadwal Pertandingan</h1>
        <button
          onClick={() => openForm()}
          className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Tambah Jadwal</span>
        </button>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <h2 className="font-bold text-lg">{editingId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formData.match_date}
                    onChange={e => setFormData({...formData, match_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Kickoff</label>
                  <input
                    type="time"
                    required
                    value={formData.kickoff_time}
                    onChange={e => setFormData({...formData, kickoff_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tim A</label>
                    <select
                      required
                      value={formData.team_a_id}
                      onChange={e => setFormData({...formData, team_a_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white font-medium"
                    >
                      <option value="">Pilih Tim A</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.group_name})</option>)}
                    </select>
                  </div>
                  <div className="flex justify-center text-gray-400 font-bold text-xs">VS</div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tim B</label>
                    <select
                      required
                      value={formData.team_b_id}
                      onChange={e => setFormData({...formData, team_b_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white font-medium"
                    >
                      <option value="">Pilih Tim B</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.group_name})</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lapangan</label>
                  <select
                    value={formData.field}
                    onChange={e => setFormData({...formData, field: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                  >
                    <option value="1">Lap 1</option>
                    <option value="2">Lap 2</option>
                    <option value="3">Lap 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                  <select
                    value={formData.stage}
                    onChange={e => setFormData({...formData, stage: e.target.value as MatchStage})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                  >
                    <option value="grup">Grup</option>
                    <option value="semifinal">Semifinal</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Grup (opsi)</label>
                  <select
                    value={formData.group_name || ''}
                    onChange={e => setFormData({...formData, group_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                  >
                    <option value="">-</option>
                    {['A', 'B', 'C', 'D'].map(g => <option key={g} value={g}>Grup {g}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeForm} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-light">
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lists grouped by date */}
      {Object.keys(groupedMatches).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500">Belum ada jadwal pertandingan.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedMatches).sort().map(date => (
            <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <h2 className="font-bold text-gray-800">{formatShortDate(date)}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {groupedMatches[date].map(match => (
                  <div key={match.id} className="p-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6 w-full md:w-auto">
                      <div className="flex items-center space-x-3 mb-3 md:mb-0">
                        <div className="text-center font-mono font-bold text-primary bg-primary-lighter px-3 py-1.5 rounded-lg text-lg min-w-[70px]">
                          {formatTime(match.kickoff_time)}
                        </div>
                        <div className="text-xs font-semibold text-gray-500 flex flex-col bg-gray-100 px-2 py-1 rounded">
                          <span>Lap {match.field}</span>
                          <span className="uppercase">{match.stage} {match.group_name}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right font-medium min-w-[100px]">{match.team_a.name}</div>
                        <div className="font-bold text-xl bg-gray-100 px-4 py-1 rounded-lg border border-gray-200">
                          {match.score_a} - {match.score_b}
                        </div>
                        <div className="text-left font-medium min-w-[100px]">{match.team_b.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(match.status)}`}>
                        {getStatusLabel(match.status)}
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => openForm(match)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          onClick={() => setDeletingMatch(match)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Hapus"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Hapus Pertandingan?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Pertandingan antara <span className="font-semibold text-gray-800">{deletingMatch.team_a.name}</span> vs{' '}
                <span className="font-semibold text-gray-800">{deletingMatch.team_b.name}</span> akan dihapus permanen.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingMatch(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
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
