'use client';

import { useState, useMemo } from 'react';
import type { MatchWithTeams, MatchFormData, MatchStage } from '@/lib/types';
import { formatShortDate, formatTime, todayWIB } from '@/lib/utils';
import {
  announceChangeEverywhere,
  matchesStore,
  teamsStore,
  useResource,
} from '@/lib/live-store';
import CategoryMark from '@/components/CategoryMark';
import StatusBadge from '@/components/StatusBadge';

const fieldFor = (category: string) => (category === 'U12' ? '2' : '1');

export default function JadwalPanitia() {
  // Sebelumnya halaman ini hanya memuat SEKALI saat dibuka. Kalaucommittee
  // mengubah jadwal dari perangkat lain, daftar di sini tidak pernah bergerak.
  const [allMatches, online, reload, loaded] = useResource(matchesStore);
  const [teams] = useResource(teamsStore);
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

  const matches = useMemo(
    () =>
      [...allMatches].sort((a, b) => {
        if (a.match_date !== b.match_date) return a.match_date.localeCompare(b.match_date);
        return (a.kickoff_time || '').localeCompare(b.kickoff_time || '');
      }),
    [allMatches]
  );

  const isLoading = !loaded;

  const categoryTeams = teams.filter((t) => (t.category ?? 'U10') === formData.category);

  const clash = matches.find(
    (m) =>
      m.id !== editingId &&
      m.match_date === formData.match_date &&
      m.kickoff_time.slice(0, 5) === formData.kickoff_time.slice(0, 5) &&
      m.field === fieldFor(formData.category)
  );

  const setCategory = (category: string) => {
    setFormData((f) => ({ ...f, category, field: fieldFor(category), team_a_id: '', team_b_id: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.team_a_id === formData.team_b_id) {
      setMessage({ type: 'error', text: 'Tim A dan Tim B tidak boleh sama.' });
      return;
    }
    try {
      const url = editingId ? `/api/matches/${editingId}` : '/api/matches';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, field: fieldFor(formData.category) }),
      });
      if (res.ok) {
        closeForm();
        void matchesStore.refresh();
        announceChangeEverywhere();
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
        void matchesStore.refresh();
        announceChangeEverywhere();
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
    return <div className="h-40 animate-skeleton rounded-[28px] bg-raise" />;
  }

  const grouped = matches.reduce(
    (acc, m) => {
      if (!acc[m.match_date]) acc[m.match_date] = [];
      acc[m.match_date].push(m);
      return acc;
    },
    {} as Record<string, MatchWithTeams[]>
  );

  const input =
    'h-12 w-full rounded-full border border-line bg-surface px-4 text-base text-text outline-none transition-colors focus:border-blue';

  return (
    <div className="space-y-6">
      {!online && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-danger/40 bg-danger/10 px-5 py-3">
          <p className="text-sm text-danger">Data tidak dapat dimuat.</p>
          <button onClick={reload} className="label text-text">
            Coba lagi
          </button>
        </div>
      )}
      {message && (
        <p
          className={`rounded-full border border-line px-5 py-3 text-sm ${
            message.type === 'success' ? 'text-blue' : 'text-danger'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="rule-title font-display text-3xl font-extrabold">Jadwal</h1>
        <button
          onClick={() => openForm()}
          className="label h-12 rounded-full bg-blue px-6 text-ink"
        >
          Tambah pertandingan
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="font-display text-xl font-extrabold">
                {editingId ? 'Ubah jadwal' : 'Tambah jadwal'}
              </h2>
              <button onClick={closeForm} className="label h-9 px-3 text-muted" aria-label="Tutup">
                Tutup
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              <div>
                <span className="label block text-muted">Kategori</span>
                <div className="pill mt-1.5 w-full gap-0.5 p-1" role="group" aria-label="Kategori">
                  {['U10', 'U12'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      aria-pressed={formData.category === c}
                      className={`label h-11 flex-1 rounded-full ${
                        formData.category === c ? 'bg-text text-ink' : 'text-muted'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <p className="label mt-1.5 text-muted">
                  Lapangan otomatis: {formData.category} → Lapangan {fieldFor(formData.category)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="f-date" className="label block text-muted">
                    Tanggal
                  </label>
                  <input
                    id="f-date"
                    type="date"
                    required
                    value={formData.match_date}
                    onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                    className={`${input} mt-1.5`}
                  />
                </div>
                <div>
                  <label htmlFor="f-time" className="label block text-muted">
                    Jam
                  </label>
                  <input
                    id="f-time"
                    type="time"
                    required
                    value={formData.kickoff_time}
                    onChange={(e) => setFormData({ ...formData, kickoff_time: e.target.value })}
                    className={`${input} mt-1.5`}
                  />
                </div>
              </div>

              {clash && (
                <p role="alert" className="rounded-full border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger">
                  Bentrok dengan {clash.team_a?.short_name}–{clash.team_b?.short_name} jam{' '}
                  {formatTime(clash.kickoff_time)} di lapangan yang sama.
                </p>
              )}

              <div>
                <label htmlFor="f-teama" className="label block text-muted">
                  Tim A ({formData.category})
                </label>
                <select
                  id="f-teama"
                  required
                  value={formData.team_a_id}
                  onChange={(e) => setFormData({ ...formData, team_a_id: e.target.value })}
                  className={`${input} mt-1.5`}
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
                <label htmlFor="f-teamb" className="label block text-muted">
                  Tim B ({formData.category})
                </label>
                <select
                  id="f-teamb"
                  required
                  value={formData.team_b_id}
                  onChange={(e) => setFormData({ ...formData, team_b_id: e.target.value })}
                  className={`${input} mt-1.5`}
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
                  <label htmlFor="f-stage" className="label block text-muted">
                    Fase
                  </label>
                  <select
                    id="f-stage"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as MatchStage })}
                    className={`${input} mt-1.5`}
                  >
                    <option value="grup">Grup</option>
                    <option value="perempat-final">8 Besar</option>
                    <option value="semifinal">Semifinal</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="f-group" className="label block text-muted">
                    Grup
                  </label>
                  <select
                    id="f-group"
                    value={formData.group_name || ''}
                    onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                    className={`${input} mt-1.5`}
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

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeForm}
                  className="label h-12 flex-1 rounded-full border border-line"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="label h-12 flex-1 rounded-full bg-blue text-ink"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <p className="panel px-5 py-8 text-muted">Belum ada jadwal pertandingan.</p>
      ) : (
        <div className="space-y-8">
          {Object.keys(grouped)
            .sort()
            .map((date) => (
              <section key={date} aria-label={formatShortDate(date)}>
                <h2 className="rule-title font-display text-xl font-extrabold">
                  {formatShortDate(date)}
                </h2>
                <div className="mt-3 overflow-hidden rounded-[28px] border border-line">
                  {grouped[date].map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-5 py-3 last:border-0"
                    >
                      <span className="label w-14 flex-none text-muted">
                        {formatTime(m.kickoff_time)}
                      </span>
                      <CategoryMark category={m.category ?? 'U10'} field={m.field} />
                      <span className="min-w-0 flex-1 truncate font-bold">
                        {m.team_a?.name} {m.score_a}–{m.score_b} {m.team_b?.name}
                      </span>
                      <StatusBadge status={m.status} />
                      <span className="flex gap-2">
                        <button
                          onClick={() => openForm(m)}
                          className="label h-11 rounded-full border border-line px-4"
                        >
                          Ubah
                        </button>
                        <button
                          onClick={() => setDeletingMatch(m)}
                          className="label h-11 rounded-full border border-danger/40 px-4 text-danger"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-[28px] border border-line bg-surface p-6 text-center">
            <h3 className="font-display text-xl font-extrabold">Hapus pertandingan?</h3>
            <p className="mt-2 text-sm text-muted">
              {deletingMatch.team_a?.name} lawan {deletingMatch.team_b?.name} akan dihapus
              permanen.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingMatch(null)}
                className="label h-12 flex-1 rounded-full border border-line"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="label h-12 flex-1 rounded-full bg-danger text-white"
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