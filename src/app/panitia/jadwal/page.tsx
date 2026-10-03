'use client';

import { useState, useEffect } from 'react';
import type { MatchWithTeams, Team, MatchFormData, MatchStage } from '@/lib/types';
import { formatShortDate, formatTime, todayWIB } from '@/lib/utils';
import CategoryMark from '@/components/CategoryMark';
import StatusBadge from '@/components/StatusBadge';

const fieldFor = (category: string) => (category === 'U12' ? '2' : '1');

export default function JadwalPanitia() {
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
    category: 'U10',
  });

  const fetchData = async () => {
    try {
      const [teamsRes, matchesRes] = await Promise.all([
        fetch('/api/teams', { cache: 'no-store' }),
        fetch('/api/matches', { cache: 'no-store' }),
      ]);
      const teamsData = await teamsRes.json().catch(() => ({}));
      const matchesData = await matchesRes.json().catch(() => ({}));
      if (!teamsRes.ok || !matchesRes.ok || !teamsData.success || !matchesData.success) {
        setLoadError(teamsData.error || matchesData.error || 'Gagal memuat data.');
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
    } catch {
      setLoadError('Gagal memuat data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const categoryTeams = teams.filter((t) => (t.category ?? 'U10') === formData.category);

  // Peringatan bentrok: lapangan sama, tanggal dan jam sama.
  const clash = matches.find(
    (m) =>
      m.id !== editingId &&
      m.match_date === formData.match_date &&
      m.kickoff_time.slice(0, 5) === formData.kickoff_time.slice(0, 5) &&
      m.field === fieldFor(formData.category)
  );

  const setCategory = (category: string) => {
    setFormData((f) => ({
      ...f,
      category,
      field: fieldFor(category),
      team_a_id: '',
      team_b_id: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.team_a_id === formData.team_b_id) {
      setMessage({ type: 'error', text: 'Tim A dan Tim B tidak boleh sama.' });
      return;
    }
    try {
      const url = editingId ? `/api/matches/${editingId}` : '/api/matches';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, field: fieldFor(formData.category) }),
      });
      if (res.ok) {
        closeForm();
        fetchData();
        setMessage({
          type: 'success',
          text: editingId ? 'Jadwal berhasil diperbarui.' : 'Jadwal berhasil ditambahkan.',
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: err.error || 'Gagal menyimpan jadwal.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Kesalahan jaringan, coba lagi.' });
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
        setMessage({ type: 'success', text: 'Pertandingan berhasil dihapus.' });
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: err.error || 'Gagal menghapus pertandingan.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Kesalahan jaringan saat menghapus.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const openForm = (match?: MatchWithTeams) => {
    if (match) {
      setEditingId(match.id);
      const cat = match.category ?? (match.field === '2' ? 'U12' : 'U10');
      setFormData({
        team_a_id: match.team_a_id,
        team_b_id: match.team_b_id,
        match_date: match.match_date,
        kickoff_time: match.kickoff_time,
        field: match.field,
        stage: match.stage,
        group_name: match.group_name || '',
        category: cat,
      });
    } else {
      setEditingId(null);
      const u10 = teams.filter((t) => (t.category ?? 'U10') === 'U10');
      setFormData({
        team_a_id: u10[0]?.id ?? '',
        team_b_id: u10[1]?.id ?? '',
        match_date: todayWIB(),
        kickoff_time: '19:00',
        field: '1',
        stage: 'grup',
        group_name: '',
        category: 'U10',
      });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  if (isLoading) {
    return (
      <div className="border border-rule bg-white px-4 py-8">
        <div className="h-8 w-1/2 bg-rule" />
        <div className="mt-3 h-4 w-1/3 bg-rule" />
      </div>
    );
  }

  const grouped = matches.reduce(
    (acc, m) => {
      if (!acc[m.match_date]) acc[m.match_date] = [];
      acc[m.match_date].push(m);
      return acc;
    },
    {} as Record<string, MatchWithTeams[]>
  );

  const inputCls =
    'h-[52px] w-full rounded-[2px] border-[1.5px] border-rule bg-white px-3 text-base text-ink outline-none focus:border-blue';

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-alert bg-white px-4 py-3">
          <p className="text-sm text-alert">{loadError}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              fetchData();
            }}
            className="h-11 rounded-[4px] border-[1.5px] border-ink px-4 font-display text-sm font-bold uppercase text-ink"
          >
            Coba lagi
          </button>
        </div>
      )}
      {message && (
        <p className={`border border-rule bg-white px-4 py-3 text-sm ${message.type === 'success' ? 'text-blue' : 'text-alert'}`}>
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold text-ink">Jadwal</h1>
        <button
          onClick={() => openForm()}
          className="h-12 rounded-[4px] bg-blue px-5 font-display text-base font-bold uppercase text-white hover:bg-ink"
        >
          Tambah pertandingan
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-rule bg-white">
            <div className="flex items-center justify-between border-b border-rule px-4 py-3">
              <h2 className="font-display text-xl font-extrabold text-ink">
                {editingId ? 'Ubah jadwal' : 'Tambah jadwal'}
              </h2>
              <button
                onClick={closeForm}
                className="flex h-11 w-11 items-center justify-center text-ink"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
              <div>
                <span className="label block text-ink">Kategori</span>
                <div className="mt-1.5 grid grid-cols-2 border border-rule" role="group" aria-label="Kategori">
                  {['U10', 'U12'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      aria-pressed={formData.category === c}
                      className={`h-12 font-display text-base font-bold uppercase ${
                        formData.category === c ? 'bg-blue text-white' : 'text-ink'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 font-mono text-[13px] text-muted">
                  Lapangan otomatis: {formData.category} → Lapangan {fieldFor(formData.category)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="f-date" className="label block text-ink">Tanggal</label>
                  <input
                    id="f-date"
                    type="date"
                    required
                    value={formData.match_date}
                    onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                    className={`${inputCls} mt-1.5`}
                  />
                </div>
                <div>
                  <label htmlFor="f-time" className="label block text-ink">Jam</label>
                  <input
                    id="f-time"
                    type="time"
                    required
                    value={formData.kickoff_time}
                    onChange={(e) => setFormData({ ...formData, kickoff_time: e.target.value })}
                    className={`${inputCls} mt-1.5`}
                  />
                </div>
              </div>

              {clash && (
                <p role="alert" className="border border-alert px-3 py-2 text-sm text-alert">
                  Bentrok dengan {clash.team_a?.short_name}–{clash.team_b?.short_name} jam{' '}
                  {formatTime(clash.kickoff_time)} di lapangan yang sama.
                </p>
              )}

              <div>
                <label htmlFor="f-teama" className="label block text-ink">Tim A ({formData.category})</label>
                <select
                  id="f-teama"
                  required
                  value={formData.team_a_id}
                  onChange={(e) => setFormData({ ...formData, team_a_id: e.target.value })}
                  className={`${inputCls} mt-1.5`}
                >
                  <option value="">Pilih tim A</option>
                  {categoryTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-teamb" className="label block text-ink">Tim B ({formData.category})</label>
                <select
                  id="f-teamb"
                  required
                  value={formData.team_b_id}
                  onChange={(e) => setFormData({ ...formData, team_b_id: e.target.value })}
                  className={`${inputCls} mt-1.5`}
                >
                  <option value="">Pilih tim B</option>
                  {categoryTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="f-stage" className="label block text-ink">Fase</label>
                  <select
                    id="f-stage"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as MatchStage })}
                    className={`${inputCls} mt-1.5`}
                  >
                    <option value="grup">Grup</option>
                    <option value="semifinal">Semifinal</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="f-group" className="label block text-ink">Grup</label>
                  <select
                    id="f-group"
                    value={formData.group_name || ''}
                    onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                    className={`${inputCls} mt-1.5`}
                  >
                    <option value="">Tanpa grup</option>
                    {['A', 'B', 'C', 'D'].map((g) => (
                      <option key={g} value={g}>
                        Grup {g}
                      </option>
                    ))}
                  </select>
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

      {Object.keys(grouped).length === 0 ? (
        <p className="border border-rule bg-white px-4 py-8 text-muted">
          Belum ada jadwal pertandingan.
        </p>
      ) : (
        <div className="space-y-8">
          {Object.keys(grouped)
            .sort()
            .map((date) => (
              <section key={date} aria-label={formatShortDate(date)}>
                <h2 className="font-display text-2xl font-extrabold text-ink">
                  {formatShortDate(date)}
                </h2>
                <div className="mt-2 border-t border-rule">
                  {grouped[date].map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-wrap items-center gap-3 border-b border-rule bg-white px-4 py-3"
                    >
                      <span className="tnum w-14 shrink-0 font-mono text-[13px] text-muted">
                        {formatTime(m.kickoff_time)}
                      </span>
                      <CategoryMark category={m.category ?? (m.field === '2' ? 'U12' : 'U10')} field={m.field} />
                      <span className="min-w-0 flex-1 text-[15px] font-bold text-ink">
                        {m.team_a?.name} {m.score_a}–{m.score_b} {m.team_b?.name}
                      </span>
                      <StatusBadge status={m.status} />
                      <span className="flex gap-2">
                        <button
                          onClick={() => openForm(m)}
                          className="h-11 rounded-[4px] border-[1.5px] border-ink px-4 font-display text-sm font-bold uppercase text-ink"
                        >
                          Ubah
                        </button>
                        <button
                          onClick={() => setDeletingMatch(m)}
                          className="h-11 rounded-[4px] border-[1.5px] border-alert px-4 font-display text-sm font-bold uppercase text-alert"
                        >
                          Hapus
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}

      {deletingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="w-full max-w-sm border border-rule bg-white p-6 text-center">
            <h3 className="font-display text-xl font-extrabold text-ink">Hapus pertandingan?</h3>
            <p className="mt-2 text-sm text-muted">
              {deletingMatch.team_a?.name} lawan {deletingMatch.team_b?.name} akan
              dihapus permanen.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingMatch(null)}
                className="h-12 flex-1 rounded-[4px] border-[1.5px] border-ink font-display text-base font-bold uppercase text-ink"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
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
