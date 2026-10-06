import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, SUPABASE_MISCONFIGURED_MESSAGE } from '@/lib/supabase';
import { planBracket } from '@/lib/bracket';
import type { Match, Team } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Status braket gugur per kategori — baca saja, tanpa menulis.
 * Dipakai memantau kemajuan otomatis: grup mana yang tuntas, slot mana
 * yang menunggu, dan apa yang mengganjal (mis. poin imbang persis).
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, data: [], error: SUPABASE_MISCONFIGURED_MESSAGE },
      { status: 503 }
    );
  }

  try {
    const [{ data: teams, error: teamsErr }, { data: matches, error: matchesErr }] =
      await Promise.all([
        supabase.from('teams').select('*'),
        supabase.from('matches').select('*'),
      ]);
    if (teamsErr) throw teamsErr;
    if (matchesErr) throw matchesErr;

    const plans = planBracket((teams ?? []) as Team[], (matches ?? []) as Match[]);
    return NextResponse.json({ success: true, data: plans });
  } catch (error: unknown) {
    console.error('Bracket status error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
