'use client';

import { useState, useEffect, useMemo } from 'react';

interface Team {
  id: string;
  name: string;
  short_name: string;
}

interface Match {
  id: string;
  team_a_id: string;
  team_b_id: string;
  team_a: Team;
  team_b: Team;
  score_a: number;
  score_b: number;
  status: 'scheduled' | 'live' | 'halftime' | 'finished';
  match_date: string;
  kickoff_time: string;
  field: string;
  stage: string;
  group_name: string | null;
}

export default function UpdateSkorPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedField, setSelectedField] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setMatches(data.data);
        setLastUpdated(new Date().toLocaleTimeString('id-ID', { timeStyle: 'short' }));
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 3000);
    return () => clearInterval(interval);
  }, []);

  const fields = useMemo(() => {
    const f = matches.map((m) => m.field).filter(Boolean) as string[];
    return [...new Set(f)].sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    let list = matches.filter((m) => m.status === 'live' || m.status === 'halftime');
    if (selectedField !== 'all') list = list.filter((m) => m.field === selectedField);
    return list.sort((a, b) => a.kickoff_time.localeCompare(b.kickoff_time));
  }, [matches, selectedField]);

  const updateScore = async (id: string, team: 'a' | 'b', delta: number) => {
    const match = matches.find((m) => m.id === id);
    if (!match) return;

    const newScoreA = team === 'a' ? match.score_a + delta : match.score_a;
    const newScoreB = team === 'b' ? match.score_b + delta : match.score_b;

    try {
      setSaving(id);
      await fetch(`/api/updateskor?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score_a: Math.max(0, newScoreA),
          score_b: Math.max(0, newScoreB),
        }),
      });
      fetchMatches();
    } catch (err) {
      console.error('Failed:', err);
    } finally {
      setSaving(null);
    }
  };

  const updateStatus = async (id: string, newStatus: Match['status']) => {
    try {
      setSaving(id);
      await fetch(`/api/updateskor?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchMatches();
    } catch (err) {
      console.error('Failed:', err);
    } finally {
      setSaving(null);
    }
  };

  const liveByField = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    filteredMatches.forEach((m) => {
      const f = m.field;
      if (!groups[f]) groups[f] = [];
      groups[f].push(m);
    });
    return groups;
  }, [filteredMatches]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header - Industrial LED style */}
      <header className="border-b-4 border-red-600 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase" style={{ fontFamily: '"Courier New", monospace' }}>
                SCOREBOARD <span className="text-red-500">CONTROL</span>
              </h1>
              <p className="text-zinc-500 text-sm mt-1">Halaman wasit • Tanpa password</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 ${saving ? 'bg-yellow-400' : 'bg-green-500'} animate-pulse`}></div>
                <span className="text-xl font-mono font-bold">{lastUpdated || '--:--'}</span>
              </div>
              <div className="text-zinc-500 text-xs mt-1">UPDATE TERAKHIR</div>
            </div>
          </div>
        </div>
      </header>

      {/* Field Filter Tabs */}
      {fields.length > 0 && (
        <div className="bg-zinc-900 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedField('all')}
              className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                selectedField === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Semua
            </button>
            {fields.map((f) => (
              <button
                key={f}
                onClick={() => setSelectedField(f)}
                className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                  selectedField === f
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Lap {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-zinc-500 font-mono">LOADING...</p>
            </div>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-20 border-2 border-zinc-800 bg-zinc-900/50">
            <div className="text-6xl mb-4">⚽</div>
            <h3 className="text-2xl font-bold text-zinc-400 uppercase tracking-wider">Tidak Ada Pertanding Live</h3>
            <p className="text-zinc-600 mt-2 font-mono text-sm">
              {selectedField !== 'all' ? `Lapangan ${selectedField} kosong` : 'Semua match belum dimulai atau sudah selesai'}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(liveByField).map(([field, fieldMatches]) => (
              <section key={field}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-red-500 animate-pulse"></div>
                  <h2 className="text-xl font-black uppercase tracking-widest text-zinc-400" style={{ fontFamily: '"Courier New", monospace' }}>
                    {'/// LAPANGAN '}{field}
                  </h2>
                  <div className="flex-1 h-px bg-zinc-800"></div>
                  <span className="text-zinc-600 font-mono text-sm">{fieldMatches.length} MATCH</span>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  {fieldMatches.map((match) => (
                    <div
                      key={match.id}
                      className={`relative border-2 transition-all ${
                        match.status === 'halftime' ? 'border-yellow-500 bg-yellow-900/10' : 'border-zinc-800 bg-zinc-900'
                      }`}
                    >
                      {/* Status Bar */}
                      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800">
                        <span className="font-mono text-xs text-zinc-500">
                          {match.group_name ? `GRUP ${match.group_name}` : match.stage.toUpperCase()} • {match.kickoff_time.slice(0, 5)}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold uppercase ${
                          match.status === 'live' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-black'
                        }`}>
                          {match.status === 'live' ? '● LIVE' : '⏸ ISTIRAHAT'}
                        </span>
                      </div>

                      {/* Score Area */}
                      <div className="flex items-stretch">
                        {/* Team A */}
                        <div className="flex-1 py-6 px-4 text-center">
                          <div className="text-lg font-bold text-zinc-400 uppercase tracking-wider mb-1">
                            {match.team_a.short_name}
                          </div>
                          <div className="text-xs text-zinc-600 mb-4 truncate">{match.team_a.name}</div>
                          
                          <button
                            onClick={() => updateScore(match.id, 'a', 1)}
                            disabled={saving === match.id}
                            className="w-16 h-12 bg-zinc-800 hover:bg-green-700 active:bg-green-600 disabled:opacity-50 text-white font-bold text-lg transition-colors mb-3"
                          >
                            +1
                          </button>
                          
                          <div className={`text-8xl font-black leading-none my-2 ${saving === match.id ? 'text-green-400' : 'text-white'}`}>
                            {match.score_a}
                          </div>
                          
                          <button
                            onClick={() => updateScore(match.id, 'a', -1)}
                            disabled={match.score_a === 0 || saving === match.id}
                            className="w-16 h-12 bg-zinc-800 hover:bg-red-700 active:bg-red-600 disabled:opacity-30 disabled:hover:bg-zinc-800 text-white font-bold text-lg transition-colors mt-3"
                          >
                            -1
                          </button>
                        </div>

                        {/* VS */}
                        <div className="w-20 flex flex-col items-center justify-center bg-zinc-950 border-x border-zinc-800">
                          <span className="text-2xl font-black text-zinc-700">VS</span>
                          {saving === match.id && (
                            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin mt-2"></div>
                          )}
                        </div>

                        {/* Team B */}
                        <div className="flex-1 py-6 px-4 text-center">
                          <div className="text-lg font-bold text-zinc-400 uppercase tracking-wider mb-1">
                            {match.team_b.short_name}
                          </div>
                          <div className="text-xs text-zinc-600 mb-4 truncate">{match.team_b.name}</div>
                          
                          <button
                            onClick={() => updateScore(match.id, 'b', 1)}
                            disabled={saving === match.id}
                            className="w-16 h-12 bg-zinc-800 hover:bg-green-700 active:bg-green-600 disabled:opacity-50 text-white font-bold text-lg transition-colors mb-3"
                          >
                            +1
                          </button>
                          
                          <div className={`text-8xl font-black leading-none my-2 ${saving === match.id ? 'text-green-400' : 'text-white'}`}>
                            {match.score_b}
                          </div>
                          
                          <button
                            onClick={() => updateScore(match.id, 'b', -1)}
                            disabled={match.score_b === 0 || saving === match.id}
                            className="w-16 h-12 bg-zinc-800 hover:bg-red-700 active:bg-red-600 disabled:opacity-30 disabled:hover:bg-zinc-800 text-white font-bold text-lg transition-colors mt-3"
                          >
                            -1
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-0 border-t-2 border-zinc-800">
                        {match.status === 'live' && (
                          <>
                            <button
                              onClick={() => updateStatus(match.id, 'halftime')}
                              disabled={saving === match.id}
                              className="py-4 bg-yellow-700 hover:bg-yellow-600 text-white font-bold uppercase tracking-wider text-sm transition-colors disabled:opacity-50"
                            >
                              ⏸ Istirahat
                            </button>
                            <button
                              onClick={() => updateStatus(match.id, 'finished')}
                              disabled={saving === match.id}
                              className="py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-wider text-sm transition-colors disabled:opacity-50"
                            >
                              ✓ Selesai
                            </button>
                          </>
                        )}
                        {match.status === 'halftime' && (
                          <>
                            <button
                              onClick={() => updateStatus(match.id, 'live')}
                              disabled={saving === match.id}
                              className="py-4 bg-green-700 hover:bg-green-600 text-white font-bold uppercase tracking-wider text-sm transition-colors disabled:opacity-50"
                            >
                              ▶ Lanjut
                            </button>
                            <button
                              onClick={() => updateStatus(match.id, 'finished')}
                              disabled={saving === match.id}
                              className="py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-wider text-sm transition-colors disabled:opacity-50"
                            >
                              ✓ Selesai
                            </button>
                          </>
                        )}
                        {match.status === 'finished' && (
                          <div className="col-span-2 py-4 bg-green-900 text-green-400 font-bold uppercase tracking-wider text-center">
                            ✓ PERTANDINGAN SELESAI
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-zinc-800 mt-12 py-6 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-zinc-600 text-sm font-mono">
            AN-NUR MINI SOCCER CUP 2026 • SCOREBOARD SYSTEM
          </p>
          <p className="text-zinc-700 text-xs mt-2">
            Data otomatis muncul di <span className="text-zinc-400">/live</span> dalam 3 detik
          </p>
        </div>
      </footer>
    </div>
  );
}