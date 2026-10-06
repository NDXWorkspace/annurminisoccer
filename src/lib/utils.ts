import type { Match, MatchWithTeams, Team, StandingRow, GroupStandings } from './types';

/**
 * Calculate standings from finished matches for a specific group
 */
export function calculateStandings(
  teams: Team[],
  matches: Match[] | MatchWithTeams[],
  groupName: string
): StandingRow[] {
  const groupTeams = teams.filter((t) => t.group_name === groupName);
  const finishedMatches = matches.filter((m) => {
    if (m.status !== 'finished') return false;
    if (m.group_name === groupName) return true;
    // Fallback: baris matches tanpa group_name tetap dihitung selama
    // kedua timnya ada di grup ini (data lama bisa NULL/kosong).
    if (!m.group_name) {
      const ta = teams.find((t) => t.id === m.team_a_id);
      const tb = teams.find((t) => t.id === m.team_b_id);
      return ta?.group_name === groupName && tb?.group_name === groupName;
    }
    return false;
  });

  const rows: StandingRow[] = groupTeams.map((team) => {
    let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;

    finishedMatches.forEach((m) => {
      let scored: number | undefined;
      let conceded: number | undefined;

      if (m.team_a_id === team.id) {
        scored = m.score_a;
        conceded = m.score_b;
      } else if (m.team_b_id === team.id) {
        scored = m.score_b;
        conceded = m.score_a;
      }

      if (scored !== undefined && conceded !== undefined) {
        played++;
        gf += scored;
        ga += conceded;
        if (scored > conceded) won++;
        else if (scored === conceded) drawn++;
        else lost++;
      }
    });

    return {
      team,
      played,
      won,
      drawn,
      lost,
      goals_for: gf,
      goals_against: ga,
      goal_difference: gf - ga,
      points: won * 3 + drawn,
    };
  });

  // Sort: points → goal difference → goals for
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    return b.goals_for - a.goals_for;
  });

  return rows;
}

/**
 * Calculate standings for all groups
 */
export function calculateAllStandings(
  teams: Team[],
  matches: Match[] | MatchWithTeams[]
): GroupStandings[] {
  const groupNames = [...new Set(teams.map((t) => t.group_name))].sort();
  return groupNames.map((group_name) => ({
    group_name,
    rows: calculateStandings(teams, matches, group_name),
  }));
}

/**
 * Label posisi pemain dalam Bahasa Indonesia.
 */
export function positionLabel(p: string | null | undefined): string {
  switch (p) {
    case 'GK': return 'Kiper';
    case 'DF': return 'Belakang';
    case 'MF': return 'Tengah';
    case 'FW': return 'Depan';
    default: return '–';
  }
}

/**
 * Tanggal hari ini dalam zona WIB (Asia/Jakarta) sebagai YYYY-MM-DD.
 * Jangan pakai `new Date().toISOString().split('T')[0]` — itu UTC dan bisa
 * geser H-1/H+1 di sekitar tengah malam WIB.
 */
export function todayWIB(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts; // en-CA = YYYY-MM-DD
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format short date
 */
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Format time (HH:MM)
 */
export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

/**
 * Get status label in Indonesian
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'scheduled': return 'Akan Datang';
    case 'live': return 'LIVE';
    case 'halftime': return 'Istirahat';
    case 'finished': return 'Selesai';
    default: return status;
  }
}

/**
 * Get status color classes
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'live': return 'bg-red-500 text-white';
    case 'halftime': return 'bg-yellow-500 text-white';
    case 'finished': return 'bg-gray-500 text-white';
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get initials from team name (for placeholder logo)
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Calculate countdown to event
 */
export function getCountdown(targetDate: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
} {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
  };
}

/**
 * Validasi logo tim: URL penuh (https://…) atau path relatif dari akar situs
 * (/teams/…). Yang kedua dipakai untuk logo yang ikut ter-deploy di folder
 * `public`, jadi tidak bergantung pada domain tertentu.
 */
export function isValidLogoUrl(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
