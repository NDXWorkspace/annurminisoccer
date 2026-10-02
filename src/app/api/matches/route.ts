import { NextResponse } from 'next/server';
import {
  supabase,
  getServiceSupabase,
  isSupabaseConfigured,
  isServiceRoleConfigured,
  SUPABASE_MISCONFIGURED_MESSAGE,
  SUPABASE_MISSING_SERVICE_KEY_MESSAGE,
} from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { audit } from '@/lib/admin-users';
import { parseJsonBody } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const STATUSES = ['scheduled', 'live', 'halftime', 'finished'] as const;
const STAGES = ['grup', 'semifinal', 'final'] as const;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    console.warn(SUPABASE_MISCONFIGURED_MESSAGE);
    return NextResponse.json(
      { success: false, data: [], error: SUPABASE_MISCONFIGURED_MESSAGE },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const group = searchParams.get('group');

    let query = supabase
      .from('matches')
      .select('*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)')
      .order('match_date')
      .order('kickoff_time');

    if (status) {
      query = query.eq('status', status);
    }
    if (date) {
      query = query.eq('match_date', date);
    }
    if (group) {
      query = query.eq('group_name', group);
    }

    const { data, error } = await query;
      
    if (error) {
      console.warn('Database warning fetching matches:', (error as Error).message);
      return NextResponse.json({ success: false, data: [], error: (error as Error).message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: unknown) {
    console.error('Fetch matches error:', error);
    return NextResponse.json({ success: false, data: [], error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Sesi berakhir, masuk kembali.' }, { status: 401 });
    }
    await audit(session, 'create_match', 'matches');

    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }
    
    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.body;

    const team_a_id = typeof body?.team_a_id === 'string' ? body.team_a_id : '';
    const team_b_id = typeof body?.team_b_id === 'string' ? body.team_b_id : '';
    const match_date = typeof body?.match_date === 'string' ? body.match_date.trim() : '';
    const kickoff_time = typeof body?.kickoff_time === 'string' ? body.kickoff_time.trim() : '';
    const field = typeof body?.field === 'string' ? body.field.trim() : '';

    if (!team_a_id || !team_b_id || !match_date || !kickoff_time || !field) {
      return NextResponse.json({ success: false, error: 'Tim, tanggal, jam, dan lapangan wajib diisi.' }, { status: 400 });
    }
    if (!UUID_RE.test(team_a_id) || !UUID_RE.test(team_b_id)) {
      return NextResponse.json({ success: false, error: 'ID tim tidak valid.' }, { status: 400 });
    }
    if (team_a_id === team_b_id) {
      return NextResponse.json({ success: false, error: 'Tim A dan Tim B tidak boleh sama' }, { status: 400 });
    }
    if (!ISO_DATE.test(match_date)) {
      return NextResponse.json({ success: false, error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.' }, { status: 400 });
    }
    if (!TIME_RE.test(kickoff_time)) {
      return NextResponse.json({ success: false, error: 'Format jam tidak valid. Gunakan HH:MM.' }, { status: 400 });
    }

    const status = body?.status === undefined ? 'scheduled' : body.status;
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: 'Status tidak valid.' }, { status: 400 });
    }
    const stage = body?.stage === undefined ? 'grup' : body.stage;
    if (!STAGES.includes(stage)) {
      return NextResponse.json({ success: false, error: 'Fase tidak valid.' }, { status: 400 });
    }
    const group_name =
      typeof body?.group_name === 'string' && body.group_name.trim() ? body.group_name.trim() : null;

    const adminSupabase = getServiceSupabase();
    const { data, error } = await adminSupabase
      .from('matches')
      .insert({ team_a_id, team_b_id, match_date, kickoff_time, field, status, stage, group_name })
      .select('*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Create match error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Terjadi kesalahan' }, { status: 500 });
  }
}
