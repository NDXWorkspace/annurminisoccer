import { NextResponse } from 'next/server';
import {
  supabase,
  getServiceSupabase,
  isSupabaseConfigured,
  isServiceRoleConfigured,
  SUPABASE_MISCONFIGURED_MESSAGE,
  SUPABASE_MISSING_SERVICE_KEY_MESSAGE,
} from '@/lib/supabase';
import { requireSuperAdmin } from '@/lib/auth';
import { audit } from '@/lib/admin-users';
import { parseJsonBody } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POSITIONS = ['GK', 'DF', 'MF', 'FW'] as const;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, data: [], error: SUPABASE_MISCONFIGURED_MESSAGE },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');

    let query = supabase.from('players').select('*').order('jersey_number', { nullsFirst: false }).order('name');
    if (teamId) {
      if (!UUID_RE.test(teamId)) {
        return NextResponse.json({ success: false, error: 'ID tim tidak valid.' }, { status: 400 });
      }
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: unknown) {
    console.error('Fetch players error:', error);
    return NextResponse.json({ success: false, data: [], error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Hanya superadmin.' }, { status: 403 });
    }
    await audit(session, 'create_player', 'players');

    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.body;

    const team_id = typeof body?.team_id === 'string' ? body.team_id : '';
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const jersey_number = body?.jersey_number === null || body?.jersey_number === undefined ? null : Number(body.jersey_number);
    const position = body?.position === null || body?.position === undefined || body.position === '' ? null : String(body.position).toUpperCase();

    if (!UUID_RE.test(team_id)) {
      return NextResponse.json({ success: false, error: 'ID tim tidak valid.' }, { status: 400 });
    }
    if (!name || name.length > 80) {
      return NextResponse.json({ success: false, error: 'Nama pemain wajib diisi (maks 80 huruf).' }, { status: 400 });
    }
    if (jersey_number !== null && (!Number.isInteger(jersey_number) || jersey_number < 0 || jersey_number > 99)) {
      return NextResponse.json({ success: false, error: 'Nomor punggung harus 0–99.' }, { status: 400 });
    }
    if (position !== null && !POSITIONS.includes(position as (typeof POSITIONS)[number])) {
      return NextResponse.json({ success: false, error: 'Posisi harus GK, DF, MF, atau FW.' }, { status: 400 });
    }

    const adminSupabase = getServiceSupabase();
    const { data: team } = await adminSupabase.from('teams').select('id').eq('id', team_id).single();
    if (!team) {
      return NextResponse.json({ success: false, error: 'Tim tidak ditemukan.' }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from('players')
      .insert({ team_id, name, jersey_number, position })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Create player error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Terjadi kesalahan' }, { status: 500 });
  }
}
