import { NextResponse } from 'next/server';
import { getServiceSupabase, isServiceRoleConfigured, SUPABASE_MISSING_SERVICE_KEY_MESSAGE } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  try {
    const isAdmin = await getSessionFromCookies();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Sesi berakhir, masuk kembali.' }, { status: 401 });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    const adminSupabase = getServiceSupabase();
    
    const { error: matchesError } = await adminSupabase
      .from('matches')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); 

    if (matchesError) throw matchesError;

    const { error: teamsError } = await adminSupabase
      .from('teams')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (teamsError) throw teamsError;

    return NextResponse.json({ success: true, data: null, message: 'Semua data pertandingan dan tim telah direset' });
  } catch (error: unknown) {
    console.error('Reset data error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Terjadi kesalahan' }, { status: 500 });
  }
}
