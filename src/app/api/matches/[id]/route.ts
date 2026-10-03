import { NextResponse } from 'next/server';
import { supabase, getServiceSupabase, isSupabaseConfigured, isServiceRoleConfigured, SUPABASE_MISCONFIGURED_MESSAGE, SUPABASE_MISSING_SERVICE_KEY_MESSAGE } from '@/lib/supabase';
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: SUPABASE_MISCONFIGURED_MESSAGE },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ success: false, error: 'ID pertandingan tidak valid.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('matches')
      .select('*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)')
      .eq('id', id)
      .single();
       
    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Pertandingan tidak ditemukan.' }, { status: 404 });
      }
      throw error;
    }
    if (!data) return NextResponse.json({ success: false, error: 'Tidak ditemukan' }, { status: 404 });
    
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Fetch match error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Sesi berakhir, masuk kembali.' }, { status: 401 });
    }
    await audit(session, 'update_match', 'matches');

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ success: false, error: 'ID pertandingan tidak valid.' }, { status: 400 });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.body;
    const update: Record<string, string | number | null> = {};

    if (body?.team_a_id !== undefined) {
      if (typeof body.team_a_id !== 'string' || !UUID_RE.test(body.team_a_id)) {
        return NextResponse.json({ success: false, error: 'ID tim tidak valid.' }, { status: 400 });
      }
      update.team_a_id = body.team_a_id;
    }
    if (body?.team_b_id !== undefined) {
      if (typeof body.team_b_id !== 'string' || !UUID_RE.test(body.team_b_id)) {
        return NextResponse.json({ success: false, error: 'ID tim tidak valid.' }, { status: 400 });
      }
      update.team_b_id = body.team_b_id;
    }
    if (update.team_a_id && update.team_b_id && update.team_a_id === update.team_b_id) {
      return NextResponse.json({ success: false, error: 'Tim A dan Tim B tidak boleh sama' }, { status: 400 });
    }
    if (body?.match_date !== undefined) {
      const v = typeof body.match_date === 'string' ? body.match_date.trim() : '';
      if (!ISO_DATE.test(v)) {
        return NextResponse.json({ success: false, error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.' }, { status: 400 });
      }
      update.match_date = v;
    }
    if (body?.kickoff_time !== undefined) {
      const v = typeof body.kickoff_time === 'string' ? body.kickoff_time.trim() : '';
      if (!TIME_RE.test(v)) {
        return NextResponse.json({ success: false, error: 'Format jam tidak valid. Gunakan HH:MM.' }, { status: 400 });
      }
      update.kickoff_time = v;
    }
    if (body?.field !== undefined) {
      const v = typeof body.field === 'string' ? body.field.trim() : '';
      if (!v) return NextResponse.json({ success: false, error: 'Lapangan wajib diisi.' }, { status: 400 });
      update.field = v;
    }
    if (body?.status !== undefined) {
      if (!STATUSES.includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Status tidak valid.' }, { status: 400 });
      }
      // Validasi transisi: finished tidak bisa diubah kembali, scheduled harus lewat live.
      const { data: current } = await getServiceSupabase()
        .from('matches')
        .select('status')
        .eq('id', id)
        .single();
      if (current) {
        const allowed: Record<string, string[]> = {
          scheduled: ['live'],
          live: ['halftime', 'finished'],
          halftime: ['live', 'finished'],
          finished: [],
        };
        if (!(allowed[current.status] ?? []).includes(body.status) && current.status !== body.status) {
          return NextResponse.json(
            { success: false, error: `Tidak bisa mengubah status dari "${current.status}" ke "${body.status}".` },
            { status: 400 }
          );
        }
      }
      update.status = body.status;
    }
    if (body?.stage !== undefined) {
      if (!STAGES.includes(body.stage)) {
        return NextResponse.json({ success: false, error: 'Fase tidak valid.' }, { status: 400 });
      }
      update.stage = body.stage;
    }
    if (body?.group_name !== undefined) {
      update.group_name =
        typeof body.group_name === 'string' && body.group_name.trim() ? body.group_name.trim() : null;
    }
    if (body?.category !== undefined) {
      const v = typeof body.category === 'string' ? body.category.trim().toUpperCase() : '';
      if (v !== 'U10' && v !== 'U12') {
        return NextResponse.json({ success: false, error: 'Kategori harus U10 atau U12.' }, { status: 400 });
      }
      // Kategori menentukan lapangan otomatis: U10 → Lapangan 1, U12 → Lapangan 2.
      update.category = v;
      update.field = v === 'U10' ? '1' : '2';
    }
    if (body?.score_a !== undefined || body?.score_b !== undefined) {
      for (const k of ['score_a', 'score_b'] as const) {
        if (body?.[k] !== undefined) {
          if (!Number.isInteger(body[k]) || body[k] < 0 || body[k] > 99) {
            return NextResponse.json({ success: false, error: 'Skor harus bilangan bulat 0â€“99.' }, { status: 400 });
          }
          update[k] = body[k];
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada perubahan untuk disimpan.' }, { status: 400 });
    }

    const adminSupabase = getServiceSupabase();

    // Bila kategori atau tim berubah, pastikan kedua tim satu kategori
    // dengan kategori efektif pertandingan.
    if (update.category !== undefined || update.team_a_id !== undefined || update.team_b_id !== undefined) {
      const { data: current } = await adminSupabase
        .from('matches')
        .select('team_a_id, team_b_id, category')
        .eq('id', id)
        .single();
      if (current) {
        const effCategory = (update.category as string) ?? current.category;
        const teamA = (update.team_a_id as string) ?? current.team_a_id;
        const teamB = (update.team_b_id as string) ?? current.team_b_id;
        const { data: pair } = await adminSupabase
          .from('teams')
          .select('id, category')
          .in('id', [teamA, teamB]);
        if (!pair || pair.length !== 2 || pair.some((t) => t.category !== effCategory)) {
          return NextResponse.json(
            { success: false, error: `Kedua tim harus berkategori ${effCategory}.` },
            { status: 400 }
          );
        }
      }
    }

    const { data, error } = await adminSupabase
      .from('matches')
      .update(update)
      .eq('id', id)
      .select('*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Update match error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Sesi berakhir, masuk kembali.' }, { status: 401 });
    }
    await audit(session, 'update_match', 'matches');

    if (!UUID_RE.test(id)) {
      return NextResponse.json({ success: false, error: 'ID pertandingan tidak valid.' }, { status: 400 });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json({ success: false, error: SUPABASE_MISSING_SERVICE_KEY_MESSAGE }, { status: 503 });
    }

    const adminSupabase = getServiceSupabase();
    const { error } = await adminSupabase
      .from('matches')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: null });
  } catch (error: unknown) {
    console.error('Delete match error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Terjadi kesalahan' }, { status: 500 });
  }
}
