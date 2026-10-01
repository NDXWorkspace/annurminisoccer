'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { MatchWithTeams } from '@/lib/types';
import { getStatusLabel, getStatusColor, formatTime, formatShortDate, todayWIB } from '@/lib/utils';

export default function SkorPage() {
  const [allMatches, setAllMatches] = useState<MatchWithTeams[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isSavingRef = useRef<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    isSavingRef.current = savingId;
  }, [savingId]);
  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const flashSaved = (id: string) => {
    setFlashId(id);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 1000);
  };

  const dates = useMemo(() => {
    return Array.from(new Set(allMatches.map(m => m.match_date))).sort();
  }, [allMatches]);

  const fetchMatches = async (isInitial = false) => {
    try {
      const res = await fetch('/api/matches', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error || `Gagal memuat pertandingan (HTTP ${res.status}).`);
        return;
      }
      if (data.success && data.data) {
        const list: MatchWithTeams[] = data.data || [];
        if (!isSavingRef.current) {
          setAllMatches(list);
        }
        setLoadError(null);

        if (isInitial && list.length > 0) {
          const today = todayWIB();
          const hasToday = list.some(m => m.match_date === today);
          if (hasToday) {
            setSelectedDate(today);
          } else {
            const availableDates = Array.from(new Set(list.map(m => m.match_date))).sort();
            const first = availableDates[0];
            if (first) {
              setSelectedDate(first);
            }
          }
        }
      } else {
        setLoadError(data.error || 'Gagal memuat pertandingan.');
      }
    } catch (err) {
      console.error('Gagal memuat pertandingan:', err);
      setLoadError('Koneksi ke server terputus. Skor mungkin tidak tersimpan.');
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(true);
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchMatches(false);
      }
    }, 5000);

    const onVisible = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchMatches(false);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const displayedMatches = useMemo(() => {
    let filtered = allMatches;
    if (selectedDate !== 'all') {
      filtered = allMatches.filter(m => m.match_date === selectedDate);
    }
    return [...filtered].sort((a, b) => {
      const isLiveA = a.status === 'live' || a.status === 'halftime';
      const isLiveB = b.status === 'live' || b.status === 'halftime';
      if (isLiveA && !isLiveB) return -1;
      if (!isLiveA && isLiveB) return 1;

      if (a.match_date !== b.match_date) return a.match_date.localeCompare(b.match_date);
      return (a.kickoff_time || '').localeCompare(b.kickoff_time || '');
    });
  }, [allMatches, selectedDate]);

  const updateMatch = async (id: string, updates: Partial<MatchWithTeams>) => {
    setSavingId(id);
    setErrorId(null);
    
    setAllMatches(current => 
      current.map(m => m.id === id ? { ...m, ...updates } : m)
    );

    try {
      const res = await fetch(`/api/matches/${id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        flashSaved(id);
      } else {
        fetchMatches();
        setErrorId(id);
      }
    } catch {
      fetchMatches();
      setErrorId(id);
    } finally {
      setSavingId(null);
    }
  };

  const handleScore = (id: string, team: 'a' | 'b', delta: number) => {
    const match = allMatches.find(m => m.id === id);
    if (!match) return;

    const currentScore = team === 'a' ? match.score_a : match.score_b;
    const newScore = Math.max(0, currentScore + delta);

    if (newScore === currentScore) return;

    updateMatch(id, {
      ...(team === 'a' ? { score_a: newScore } : { score_b: newScore })
    });
  };

  const handleStatus = (id: string, newStatus: MatchWithTeams['status']) => {
    updateMatch(id, { status: newStatus });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Input Skor Live</h1>
        <div className="flex items-center gap-2">
          {loadError ? (
            <span className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Offline
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-gray-500 font-medium">Sinkronisasi Realtime Otomatis</span>
            </span>
          )}
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}{' '}
          <button onClick={() => fetchMatches(true)} className="font-semibold underline">
            Coba lagi
          </button>
        </div>
      )}

      {dates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedDate('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDate === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Semua ({allMatches.length})
          </button>
          {dates.map(date => {
            const count = allMatches.filter(m => m.match_date === date).length;
            const isToday = date === todayWIB();
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedDate === date
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {formatShortDate(date)} {isToday && '(Hari Ini)'} ({count})
              </button>
            );
          })}
        </div>
      )}

      {displayedMatches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500">Tidak ada jadwal pertandingan pada filter ini.</p>
        </div>
      ) : (
        displayedMatches.map(match => (
          <div 
            key={match.id} 
            className={`
              bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-colors duration-300
              ${flashId === match.id ? 'border-green-400 bg-green-50' : errorId === match.id ? 'border-red-400 bg-red-50' : 'border-gray-100'}
            `}
          >
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-primary">{formatTime(match.kickoff_time)}</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm font-medium text-gray-600">Lap {match.field}</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm font-medium text-gray-600">{match.stage.toUpperCase()}</span>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(match.status)}`}>
                {getStatusLabel(match.status)}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                
                <div className="flex-1 flex flex-col items-center">
                  <div className="text-center mb-2">
                    <div className="font-bold text-lg leading-tight line-clamp-1">{match.team_a.short_name}</div>
                    <div className="text-xs text-gray-500">{match.team_a.name}</div>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <button 
                      onClick={() => handleScore(match.id, 'a', 1)}
                      className="w-16 h-14 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-xl font-bold text-gray-700 transition-colors"
                      title="Tambah 1"
                    >
                      +1
                    </button>
                    <div className="text-6xl font-black text-gray-900 tracking-tighter w-24 text-center">
                      {match.score_a}
                    </div>
                    <button 
                      onClick={() => handleScore(match.id, 'a', -1)}
                      disabled={match.score_a === 0}
                      className="w-16 h-14 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-50 rounded-xl flex items-center justify-center text-xl font-bold text-gray-500 transition-colors border border-gray-200"
                      title="Kurang 1"
                    >
                      -1
                    </button>
                  </div>
                </div>

                <div className="px-4 flex flex-col items-center justify-center">
                  <span className="text-gray-300 font-black text-2xl">VS</span>
                  {savingId === match.id && (
                    <div className="mt-2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center">
                  <div className="text-center mb-2">
                    <div className="font-bold text-lg leading-tight line-clamp-1">{match.team_b.short_name}</div>
                    <div className="text-xs text-gray-500">{match.team_b.name}</div>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <button 
                      onClick={() => handleScore(match.id, 'b', 1)}
                      className="w-16 h-14 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl flex items-center justify-center text-xl font-bold text-gray-700 transition-colors"
                      title="Tambah 1"
                    >
                      +1
                    </button>
                    <div className="text-6xl font-black text-gray-900 tracking-tighter w-24 text-center">
                      {match.score_b}
                    </div>
                    <button 
                      onClick={() => handleScore(match.id, 'b', -1)}
                      disabled={match.score_b === 0}
                      className="w-16 h-14 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-50 rounded-xl flex items-center justify-center text-xl font-bold text-gray-500 transition-colors border border-gray-200"
                      title="Kurang 1"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-center">
                {match.status === 'scheduled' && (
                  <button 
                    onClick={() => handleStatus(match.id, 'live')}
                    className="flex-1 min-w-[120px] h-12 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Mulai Pertandingan
                  </button>
                )}

                {match.status === 'live' && (
                  <>
                    <button 
                      onClick={() => handleStatus(match.id, 'halftime')}
                      className="flex-1 min-w-[120px] h-12 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                      Istirahat
                    </button>
                    <button 
                      onClick={() => handleStatus(match.id, 'finished')}
                      className="flex-1 min-w-[120px] h-12 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                      Selesai
                    </button>
                  </>
                )}

                {match.status === 'halftime' && (
                  <>
                    <button 
                      onClick={() => handleStatus(match.id, 'live')}
                      className="flex-1 min-w-[120px] h-12 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                      Lanjut Babak 2
                    </button>
                    <button 
                      onClick={() => handleStatus(match.id, 'finished')}
                      className="flex-1 min-w-[120px] h-12 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                      Selesai
                    </button>
                  </>
                )}

                {match.status === 'finished' && (
                  <div className="w-full text-center py-2 text-green-600 font-bold bg-green-50 rounded-lg flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>Pertandingan Selesai</span>
                  </div>
                )}
              </div>
              {errorId === match.id && (
                <div className="mt-2 text-center text-red-600 text-sm">Gagal menyimpan perubahan. Data akan di-refresh.</div>
              )}
              <div className="mt-3 text-center text-[10px] text-gray-400">
                Terakhir diperbarui:{' '}
                {match.updated_at
                  ? new Date(match.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : '-'}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
