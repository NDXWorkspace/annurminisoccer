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
import { advanceBracket } from '@/lib/bracket-runner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const STATUSES = ['scheduled', 'live', 'halftime', 'finished'] as const;
const STAGES = ['grup', 'perempat-final', 'semifinal', 'final'] as const;

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
      .select(
        '*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*), ' +
          'events:match_events(id, event_type, team_id, player_name, minute, note, created_at)'
      )
      .order('match_date')
      .order('kickoff_time')
      .order('created_at', { referencedTable: 'match_events' });

    if (status) {
      query = query.eq('status', status);
    }
    if (date) {
      query = query.eq('match_date', date);
    }
    if (group) {
      query = query.eq('group_name', group);
    }

    // Lazy auto-start (pengganti Vercel Cron yang diblokir di paket Hobby):
    // promosikan scheduled -> live bila kickoff (WIB = UTC+7) sudah lewat.
    // Best-effort: kegagalan tidak boleh menggagalkan GET.
    try {
      if (isServiceRoleConfigured()) {
        const now = new Date();
        const admin = getServiceSupabase();
        const { data: scheduled } = await admin
          .from('matches')
          .select('id, match_date, kickoff_time')
          .eq('status', 'scheduled')
          .limit(200);
        const dueIds = (scheduled ?? [])
          .filter((m) => {
            if (!m.match_date || !m.kickoff_time) return false;
            const kickoff = new Date(`${m.match_date}T${m.kickoff_time}+07:00`);
            return !Number.isNaN(kickoff.getTime()) && kickoff.getTime() <= now.getTime();
          })
          .map((m) => m.id);
        if (dueIds.length > 0) {
          await admin
            .from('matches')
            .update({ status: 'live', updated_at: now.toISOString() })
            .in('id', dueIds);
        }
      }
    } catch {
      // Abaikan: auto-start tidak boleh merusak respons baca.
    }

    // Braket gugur otomatis: tiap grup penyisihan yang tuntas → juara dan
    // runner-up-nya dipasangkan ke 8 besar; pemenang 8 besar → semifinal;
    // pemenang semifinal → final + perebutan juara 3. Berjalan di jalur
    // polling yang sama (tiap GET), best-effort, dan idempoten: slot yang
    // sudah ada tidak pernah dibuat ulang atau ditulis ulang — koreksi skor
    // grup setelah slot terbentuk harus dibetulkan manual lewat /panitia.
    try {
      if (isServiceRoleConfigured()) {
        await advanceBracket(getServiceSupabase());
      }
    } catch {
      // Abaikan: kegagalan braket tidak boleh merusak respons baca.
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
    // Kategori menentukan lapangan otomatis: U10 → Lapangan 1, U12 → Lapangan 2.
    const category =
      typeof body?.category === 'string' ? body.category.trim().toUpperCase() : '';
    const field = category === 'U10' ? '1' : category === 'U12' ? '2' : '';

    if (!team_a_id || !team_b_id || !match_date || !kickoff_time || !category) {
      return NextResponse.json({ success: false, error: 'Tim, kategori, tanggal, dan jam wajib diisi.' }, { status: 400 });
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
    if (category !== 'U10' && category !== 'U12') {
      return NextResponse.json({ success: false, error: 'Kategori harus U10 atau U12.' }, { status: 400 });
    }

    const adminSupabase = getServiceSupabase();

    // Tim A/B harus satu kategori dengan pertandingan (U10 tak bisa lawan U12).
    const { data: pair, error: pairErr } = await adminSupabase
      .from('teams')
      .select('id, category')
      .in('id', [team_a_id, team_b_id]);
    if (pairErr) throw pairErr;
    if (!pair || pair.length !== 2) {
      return NextResponse.json({ success: false, error: 'Salah satu tim tidak ditemukan.' }, { status: 400 });
    }
    if (pair.some((t) => t.category !== category)) {
      return NextResponse.json(
        { success: false, error: `Kedua tim harus berkategori ${category}.` },
        { status: 400 }
      );
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

    const { data, error } = await adminSupabase
      .from('matches')
      .insert({ team_a_id, team_b_id, match_date, kickoff_time, field, status, stage, group_name, category })
      .select('*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Create match error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Terjadi kesalahan' }, { status: 500 });
  }
}
