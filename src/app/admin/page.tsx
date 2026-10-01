'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { MatchWithTeams } from '@/lib/types';
import { getStatusLabel, getStatusColor, formatTime, todayWIB } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMatches: 0,
    matchesToday: 0,
    liveMatches: 0,
  });
  const [todayMatches, setTodayMatches] = useState<MatchWithTeams[]>([]);
  const [displayTitle, setDisplayTitle] = useState('Pertandingan Hari Ini');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [teamsRes, matchesRes] = await Promise.all([
        fetch('/api/teams', { cache: 'no-store' }),
        fetch('/api/matches', { cache: 'no-store' })
      ]);

      const teamsData = await teamsRes.json().catch(() => ({}));
      const matchesData = await matchesRes.json().catch(() => ({}));

      if (!teamsRes.ok || !matchesRes.ok) {
        setLoadError(
          teamsData.error || matchesData.error || 'Tidak dapat memuat ringkasan.'
        );
        return;
      }

      const teams = teamsData.data || [];
      const matches: MatchWithTeams[] = matchesData.data || [];
      
      const today = todayWIB();
      const todays = matches.filter((m) => m.match_date === today);
      const live = matches.filter((m) => m.status === 'live' || m.status === 'halftime');

      setStats({
        totalTeams: teams.length,
        totalMatches: matches.length,
        matchesToday: todays.length,
        liveMatches: live.length,
      });

      if (todays.length > 0) {
        setDisplayTitle('Pertandingan Hari Ini');
        setTodayMatches(todays.sort((a, b) => (a.kickoff_time || '').localeCompare(b.kickoff_time || '')));
      } else if (matches.length > 0) {
        setDisplayTitle('Daftar Pertandingan Turnamen');
        setTodayMatches(matches.slice(0, 6));
      } else {
        setDisplayTitle('Pertandingan Hari Ini');
        setTodayMatches([]);
      }
      setLoadError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoadError('Tidak dapat memuat ringkasan. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ringkasan</h1>
      </div>

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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Tim</div>
          <div className="text-3xl font-bold text-primary">{stats.totalTeams}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Laga</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalMatches}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-gray-500 text-sm font-medium mb-1">Laga Hari Ini</div>
          <div className="text-3xl font-bold text-gray-900">{stats.matchesToday}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
          <div className="text-gray-500 text-sm font-medium mb-1">Laga Live</div>
          <div className="text-3xl font-bold text-live-red">{stats.liveMatches}</div>
          {stats.liveMatches > 0 && (
            <div className="absolute top-4 right-4 w-3 h-3 bg-live-red rounded-full animate-live-pulse"></div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/skor" className="bg-primary hover:bg-primary-light text-white rounded-xl shadow-sm p-4 flex items-center space-x-3 transition-colors min-h-[64px]">
          <div className="bg-white/20 p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <span className="font-semibold">Input Skor Live</span>
        </Link>
        <Link href="/admin/tim" className="bg-white hover:bg-gray-50 text-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 flex items-center space-x-3 transition-colors min-h-[64px]">
          <div className="bg-primary/10 text-primary p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <span className="font-medium">Tambah Tim</span>
        </Link>
        <Link href="/admin/pertandingan" className="bg-white hover:bg-gray-50 text-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 flex items-center space-x-3 transition-colors min-h-[64px]">
          <div className="bg-primary/10 text-primary p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <span className="font-medium">Jadwal Laga</span>
        </Link>
        <Link href="/admin/pengaturan" className="bg-white hover:bg-gray-50 text-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 flex items-center space-x-3 transition-colors min-h-[64px]">
          <div className="bg-primary/10 text-primary p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <span className="font-medium">Pengaturan</span>
        </Link>
      </div>

      {/* Today's Matches List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-800">{displayTitle}</h2>
          <Link href="/admin/pertandingan" className="text-sm text-primary hover:underline font-medium">Lihat Semua</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {todayMatches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Tidak ada pertandingan hari ini.</div>
          ) : (
            todayMatches.map((match) => (
              <div key={match.id} className="p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <div className="text-center font-mono font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg text-sm">
                    {formatTime(match.kickoff_time)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium">{match.stage.toUpperCase()} {match.group_name ? `- Grup ${match.group_name}` : ''} • Lapangan {match.field}</span>
                    <span className="font-bold text-gray-900 mt-0.5">{match.team_a.short_name} vs {match.team_b.short_name}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="font-bold text-lg bg-gray-50 px-3 py-1 rounded border">
                    {match.score_a} - {match.score_b}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(match.status)}`}>
                    {getStatusLabel(match.status)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
